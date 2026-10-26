# Remove deprecated OpenPGP source without hiding advisories

User goal: source/module/binary Go audits clean, preserve features and password compatibility, local only without Git/commit/push.

1. Trace all x/crypto consumers and inspect official removal/proxy/advisory.
2. Reproduce OpenPGP package availability; characterize legacy bcrypt/Go-to-JS behavior. Apply official removal source with authentic module path/version/checksum and no scanner changes.
3. Repeat source, module-only, stripped binary, unit/integration/lint/build/parity checks; report exact unresolved constraints rather than claiming false green. Fresh review.

Finding: official commit99e4382b128eecca08735c9604400ba7260a4cdf removes OpenPGP (pseudo-version0.58.1-0.20261009200856-99e4382b128e). All16Go files in bcrypt/blowfish/md4/ripemd160/ocsp identical to0.57.0. Official database GO-2026-5932 still affects all x/crypto versions, no fixed range. Scratch probe using real removed source has0OpenPGPfiles but module-only still exit3. No ignored IDs, module renaming, local replacement, scanner patch, or private advisory database.

The complete zero module-only goal remains unachieved while canonical x/crypto remains necessary and the official advisory has no fixed range. Keep this constraint explicit; do not weaken bcrypt/passwords or Excel/PDF features to change an audit number.
