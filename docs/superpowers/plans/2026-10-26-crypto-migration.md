# Crypto consumer migration implementation plan

> Implement inline using executing-plans; final fresh review.

Goal: source, module-only, and stripped Linux API/migrator audits all0, true x/crypto absence from full graph.
Spec: ../specs/2026-10-26-crypto-migration-design.md
Constraints: Go1.27.3, preserve public APIs/algorithms/assets and every SQL; no Git/commit/push; use owned disposable DB only.

1. RED guard detects any x/crypto module in go list -m all; preserve existing password/Excel/PDF baseline.
2. Copy pinned local compat and two upstream dependency snapshots with original licenses. Rewrite only imports, remove x/crypto/x/net requirements, wire local replacements. Own-module tests preserve upstream vectors.
3. Add runnable upstream provenance and canonical-package vulnerability check. Strengthen source+module and stripped Linux binary audit commands/CI; Docker local deps support.
4. Verify full Go tests/integration, local compatibility/upstream suites, corruption guard, lint, builds, checksum/provenance, audits0, HTTP smoke; final fresh review, documentation.

Review focus: no advisory identity evasion; canonical package vulnerability coverage retained; source hashes+limited rewrites; no missing embedded PDF assets or Excel encryption/PDF revocation behavior; password72byte/Unicode/2a2b2y unchanged; Docker cache/cold local builds; future extra crypto imports fail module guard.
