# Backend Go dependency security

Scope: fix Go backend dependency/toolchain advisories locally, preserve business features and SQL, no Git/commit/push/deploy or working database actions.

1. Install govulncheck in scratch, capture native Go1.27.0 and project Go1.26.0 source+test audits and module graph advisory baseline.
2. Reproduce malicious spreadsheet parsing with bounded subprocess, update Excelize to official upstream fixed commit (no patched stable release yet), x/net to fixed v0.60.0 and standardize toolchain/build/CI on Go1.27.3. Preserve real module identities/checksums.
3. Provide repeatable backend audit command and CI checks with pinned scanner version; repeat source+test/Linux and production binary scans. Report unimported OpenPGP advisory honestly; do not drop bcrypt to hide module metadata.
4. Run Go unit/integration, lint, native and Linux production builds, generator consistency and local health/auth smoke. Check source/SQL unchanged; JS audit remains clean. Fresh independent review and evidence report.

Expected: zero vulnerabilities in imported/reachable packages and production binaries; no ignore/exclusion. OpenPGP in x/crypto has no upstream fixed version and is not imported; module-only scan may remain red and must be disclosed. Review focus: upstream Excelize source fixes, pinned Go actual compiler consistency, audit commands execute proper module, no superficial renaming/ignore, continued Excel import/export/auth/HTTP compatibility.
