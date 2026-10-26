import assert from 'node:assert/strict';
import { generateKeyPairSync, verify, X509Certificate } from 'node:crypto';
import { createRequire } from 'node:module';
import test from 'node:test';

// Exercise the dependency actually used by Expo's signing-certificate tooling.
const mobile = createRequire(new URL('../apps/mobile/package.json', import.meta.url));
const expo = createRequire(mobile.resolve('expo/package.json'));
const cli = createRequire(expo.resolve('@expo/cli/package.json'));
const certificates = createRequire(cli.resolve('@expo/code-signing-certificates/package.json'));
const forge = certificates('node-forge');
const signing = cli('@expo/code-signing-certificates');
const { privateKey: pem } = generateKeyPairSync('rsa', {
  modulusLength: 1024,
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
});
const key = forge.pki.privateKeyFromPem(pem);
const publicKey = forge.pki.rsa.setPublicKey(key.n, key.e);

test('RSA verification rejects extra nested DigestAlgorithm fields (CVE-2026-85393)', () => {
  const { asn1 } = forge;
  const node = (type, constructed, value) => asn1.create(asn1.Class.UNIVERSAL, type, constructed, value);
  const digest = forge.md.sha256.create().update('Mizu signing certificate regression').digest().getBytes();
  for (const withNull of [true, false]) {
    const algorithm = [node(asn1.Type.OID, false, asn1.oidToDer(forge.pki.oids.sha256).getBytes())];
    if (withNull) algorithm.push(node(asn1.Type.NULL, false, ''));
    const encode = () => asn1.toDer(node(asn1.Type.SEQUENCE, true, [
      node(asn1.Type.SEQUENCE, true, algorithm), node(asn1.Type.OCTETSTRING, false, digest),
    ])).getBytes();
    const valid = forge.pki.rsa.encrypt(encode(), key, 0x01);
    assert.equal(publicKey.verify(digest, valid), true, 'valid SHA256 signatures must still verify');
    algorithm.push(node(asn1.Type.OCTETSTRING, false, 'unconsumed bytes'));
    const malformed = forge.pki.rsa.encrypt(encode(), key, 0x01);
    assert.throws(() => publicKey.verify(digest, malformed), /DigestInfo/);
  }
});

test('Expo certificate and CSR round trips preserve verifiable update signing', () => {
  const keyPair = { privateKey: key, publicKey };
  const certificate = signing.generateSelfSignedCodeSigningCertificate({
    keyPair,
    validityNotBefore: new Date(Date.now() - 60_000),
    validityNotAfter: new Date(Date.now() + 86_400_000),
    commonName: 'Mizu signing compatibility',
  });
  const certificatePEM = signing.convertCertificateToCertificatePEM(certificate);
  const parsed = signing.convertCertificatePEMToCertificate(certificatePEM);
  signing.validateSelfSignedCertificate(parsed, keyPair);
  // iOS identity parsing uses Forge directly from the CLI, outside the signing helper.
  const iosCertificate = cli('node-forge').pki.certificateFromPem(certificatePEM);
  assert.equal(iosCertificate.subject.getField('CN').value, 'Mizu signing compatibility');
  const payload = Buffer.from('Mizu Expo update manifest');
  const signature = signing.signBufferRSASHA256AndVerify(key, parsed, payload);
  const nativePublicKey = new X509Certificate(certificatePEM).publicKey;
  assert.equal(verify('sha256', payload, nativePublicKey, Buffer.from(signature, 'base64')), true);
  assert.equal(verify('sha256', Buffer.from('tampered update'), nativePublicKey, Buffer.from(signature, 'base64')), false);
  const csr = signing.generateCSR(keyPair, 'Mizu development');
  const parsedCSR = signing.convertCSRPEMToCSR(signing.convertCSRToCSRPEM(csr));
  assert.equal(parsedCSR.verify(), true);
  const development = signing.generateDevelopmentCertificateFromCSR(
    key, parsed, parsedCSR, 'fcb79424-9757-409f-9fb8-b9c29bf3e6c4', '@mizu/member',
  );
  assert.equal(new X509Certificate(signing.convertCertificateToCertificatePEM(development)).verify(nativePublicKey), true);
  assert.equal(development.getExtension({ id: signing.expoProjectInformationOID }).value,
    'fcb79424-9757-409f-9fb8-b9c29bf3e6c4,@mizu/member');
});
