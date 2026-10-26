# Penyelesaian advisory high node-forge

Pembaruan lanjutan: [audit seluruh workspace bersih](workspace-security-audit-clean.md). Moderate/low pada tabel tahap ini sudah diselesaikan dan CI kini memeriksa semua severity. Patch query-string yang baru serta Docker COPY patches didokumentasikan pada laporan tersebut.

Tanggal: 24 Oktober 2026. Dikerjakan lokal tanpa Git, commit, push, deployment, atau perubahan database kerja.

## Hasil

Gate CI yang sudah ada, `pnpm audit --prod --audit-level=high`, sekarang **exit 0**. Gate seluruh dependency, `pnpm audit --audit-level=high`, juga **exit 0**. Workflow CI tidak diubah, tidak ada advisory ignore/mute, dan severity gate tidak diturunkan.

| Cakupan setelah perubahan | Critical | High | Moderate | Low |
| --- | ---: | ---: | ---: | ---: |
| Production | 0 | 0 | 5 | 1 |
| Seluruh workspace, termasuk development | 0 | 0 | 27 | 2 |

Ini bukan klaim semua advisory sudah nol. `pnpm audit` dengan threshold default masih dapat gagal karena moderate/low. Output diagnostik `--json` pada pnpm 9 juga masih exit 1 untuk temuan tersebut; laporan JSON tetap disimpan lengkap. Perintah CLI normal dengan threshold high yang dipakai CI telah dijalankan dan lulus.

## Dependency yang digunakan

Rilis npm terbaru saat pemeriksaan tetap `node-forge@1.4.0`, dan [advisory GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) belum mencantumkan rilis perbaikan. Source `main` resmi menyatakan versi `1.4.1-0`, tetapi masih tidak memiliki pemeriksaan jumlah elemen `DigestAlgorithm` bersarang; source tersebut ditolak.

Workspace memakai source yang benar-benar memuat perbaikan dari [PR #1152](https://github.com/digitalbazaar/forge/pull/1152), dipin ke commit penuh:

```text
https://codeload.github.com/Krysthyan/forge/tar.gz/ceba34402e329f0365134f23fe19898756527d65
```

**PR ini belum di-merge dan bukan rilis resmi yang sudah diperbaiki.** Pemakaian snapshot merupakan keputusan sementara sampai rilis resmi tersedia. Nama asli `node-forge` dan versi asli source `1.4.1-0` dipertahankan tanpa disunting. Tidak mengganti nama paket atau memalsukan versinya untuk menyembunyikan advisory.

Perubahan produksi PR hanya pemeriksaan RSA yang sebelumnya dipakai sebagai patch lokal. Ketiga file dalam PR adalah `lib/rsa.js`, tes regresi RSA, dan changelog. Seluruh **49 file JavaScript produksi** snapshot dibandingkan byte demi byte dengan dependency lama yang sudah dipatch lokal dan identik. Kedua pemakai, Expo CLI dan helper code-signing, resolve ke source yang sama.

Root override mengunci URL commit, sedangkan lockfile juga mengunci tarball dengan:

```text
sha512-fYRFJf8ymZNJ5jGirbhuwAljM0rSJG03cldnAK3sJRMDHSS+tG8DPosOB8he34pGWMylVCMOtnIxUEepsME2Rg==
```

Cold install dengan checksum tersebut lulus. Probe terpisah dengan checksum salah ditolak sebagai `ERR_PNPM_TARBALL_INTEGRITY`. Tidak menggunakan branch bergerak, URL `main`, pengecualian audit, atau perubahan metadata versi buatan. Implementasi audit pnpm diperiksa: dependency source tetap dimasukkan dengan nama dan versi aslinya, bukan dihapus dari payload audit.

Hotfix `patchedDependencies` dan file `patches/node-forge@1.4.0.patch` sudah dihapus karena redundan. Baris Docker `COPY patches/` juga dihapus. Aplikasi dan versi Expo/React/Next tidak diubah pada tahap ini.

## Verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| Gate audit production persis seperti CI | Lulus, exit 0 |
| Gate audit high seluruh dependency | Lulus, exit 0 |
| Root frozen install | Lulus |
| Cold install manifest-only seperti Docker deps | Lulus dari store kosong dalam 43,6 detik, tanpa `--ignore-scripts` |
| RSA dan kompatibilitas Expo pada cold install | 2/2 lulus |
| `pnpm test` | Lulus: 11 tes tooling/security, 5.469 tes web, 11 tes mobile, dan paket Go unit; 10 tes web tetap skip seperti baseline |
| `pnpm test:integration` | Seluruh suite Go lulus pada PostgreSQL disposable |
| `pnpm lint` dan `pnpm check-types` | Lulus |
| `pnpm build` | Next+Go lulus; env database dummy dan heap 4 GB sesuai CI |
| Expo export | Android, iOS dan web lulus |
| Dev web+Go dan standalone HTTP | Readiness/login/static 200, auth tanpa sesi 401; Ctrl+C menutup port tes |
| Standalone resource | PDFKit/font, Sharp, worker Tesseract dan WASM offline lulus |
| Generator/SQL | Route manifest tetap identik; 619 file SQL tidak berubah |
| Review independen | Tidak ada temuan correctness/security yang menghalangi perubahan; cold install juga ditinjau |

Tes RSA tetap membuktikan penolakan elemen ASN.1 tambahan. Tes kompatibilitas tambahan mencakup sertifikat self-signed dan PEM, parser identitas iOS, CSR, sertifikat development beserta project scope, serta signature update yang diverifikasi independen oleh `node:crypto`. Payload update yang diubah ditolak.

Pemeriksaan lokal membuktikan perintah-perintah terkait CI lulus; workflow remote tidak dijalankan karena tidak ada push. Cold install ini tetap berjalan di macOS, bukan build image Docker/Linux. Native APK/IPA, akses keychain nyata, pairing WA, transaksi hardware, dan OCR lengkap dengan model bahasa belum diuji langsung.

## Perawatan snapshot

Source berasal dari kontributor PR yang belum di-merge. SHA commit dan SHA512 mencegah perubahan konten tanpa terdeteksi; ketersediaan archive eksternal tetap menjadi tanggung jawab perawatan. Ketika rilis resmi yang memperbaiki celah tersedia, pindahkan override ke rilis tersebut lalu ulangi tes RSA/Expo, frozen install, dan audit. Jangan mengganti pin ke `main` atau menghapus regresi hanya karena audit bersih.

Jika lockfile dibuat ulang saat memperbarui dependency, pastikan integrity source tidak hilang; pnpm 9 tidak selalu menambahkan SHA512 untuk URL GitHub secara otomatis. Verifikasi ulang tarball dan cold install sebelum menerima pin yang berubah.

Log, checksum, source pembanding, snapshot manifest awal dan hasil audit lengkap berada sementara di `/tmp/mizu-forge-resolution/`, terutama `ci-audit.log`, `all-high-gate.log`, `audit-prod.json`, `audit-all.json`, `cold-workspace-install.log`, `cold-install-security-test.log`, `bad-integrity.log`, `tests.log`, `integration.log`, `lint.log`, `types.log`, `build-ci-env.log`, `mobile-export.log`, `standalone-resources.log` dan `app-lifecycle-results.json`.
