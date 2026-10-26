# Mizu Integration and Security Stabilization Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. User explicitly authorizes local fixes and dependency updates; no Git, commit, push, worktree, deployment or working-database writes.

**Goal:** Fix the three failing integration checks and remediate critical/high advisories while preserving application behavior.

**Architecture:** Preserve the monorepo and business contracts. Complete isolated integration fixtures; handle PostgreSQL RESTRICT conflicts in the reward endpoint. Use compatible security patch releases and an auditable upstream-based local dependency patch where no published fix exists.

**Tech Stack:** Go/pgx, PostgreSQL disposable, Node 24, pnpm 9, Next/Expo.

- [x] Reproduce all three integration failures; inspect actual account/IAM, WA contact guard and FK error paths.
- [x] Make fixture dependencies explicit for IAM role and prior WA contact. Preserve positive assertions and anti-spam guard. Handle both FK violation and RESTRICT violation as HTTP 409. Run targeted checks red/green and full Go integration suite.
- [x] Snapshot manifests/lock and audit all dependencies including development. Verify patched versions against official registry/advisories. Apply compatible targeted upgrades and verify remaining unpatched advisory handling with a regression proof; do not suppress audit findings.
- [x] Run frozen install, full workspace tests, integration tests, lint, types, Next+Go build, Expo exports, standalone resource/HTTP and dev lifecycle smoke. Check SQL/generation drift. Run production and full dependency audit again.
- [x] Fresh focused review; correct important findings. Update local verification report, stop only owned test processes/database, deliver precise remaining limitations.

Hasil dan batasan audit: [laporan verifikasi](../../stabilization-security-verification.md). Satu high node-forge masih tercatat pada raw audit meskipun patch lokal lolos regresi; gate audit tidak dilonggarkan.
