# Remove all x/crypto consumers

User-approved scope: migrate every consumer to achieve unmodified govulncheck module/binary0 without ignores, preserving passwords and all Excel/PDF behavior; local only no Git/commit/push.

Selected implementation decision: local compat module containing only unchanged upstream bcrypt/blowfish/MD4/RIPEMD160/OCSP, cryptobyte for OCSP tests, and x/net HTML parser subset. Minimal import patches in local Excelize/pdfcpu snapshots remove their x/crypto and x/net dependencies. Keep their real module identities and upstream origin versions recorded; these are maintained local patches, not invented public releases.

Alternatives: a version update cannot clear all-version module advisory (already proven); replacing algorithms/libraries would change password/Excel/PDF behavior and carry more risk. A mere module alias would obscure advisory matching without owning/removing source; rejected. Local source migration genuinely omits OpenPGP/SSH/QUIC, keeps exact cryptographic implementations and license, and removes every x/crypto graph edge.

Maintenance contract: verify every local source file against official pinned source after only declared import substitutions; reject additional or changed implementation files. Check canonical upstream packages with govulncheck package scan to retain original-advisory coverage despite local patches, then source/module/binary checks on migrated app. Explicitly document added ownership and update procedure.

Go1.27.3; build Linux CGO0 -s -w unchanged. Docker must copy local module manifests/sources before go mod download. No password rotation/rehash/migrations, no dropped signing, encryption, OCR, or PDF/Excel behavior.
