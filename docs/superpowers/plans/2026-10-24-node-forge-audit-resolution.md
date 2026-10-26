# Node Forge Audit Resolution Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Local only; no Git/commit/push/deployment. User authorizes completing the security fix and verification without audit exclusions.

**Goal:** Make the unchanged high/critical audit gate pass with a genuinely fixed dependency and preserved Expo signing features.

**Architecture:** Keep Expo and Forge API unchanged. Registry latest1.4.0 and official main1.4.1-0 still lack the fix. Verify immutable PR1152 commit ceba34402e329f0365134f23fe19898756527d65 against the installed locally patched release; all production lib files must match. Pin that actual fixed source tarball with lock integrity rather than invent package metadata or ignore advisories. This is an unmerged source snapshot, not a released upstream fix.

**Tech Stack:** Node24, pnpm9, existing Go/Next/Expo workspace.

- [x] Inspect current registry, official main and PR source; reject sources that lack the fix; compare complete production lib contents.
- [x] Capture failing audit baseline and passing isolated source probe. Replace override with immutable HTTPS source dependency, remove redundant local patch/config and Docker patch COPY, retain original source name/version.
- [x] Verify installed source integrity and RSA regression; exercise Expo certificate/CSR/signature APIs and both dependency consumers. Frozen install must reproduce the pin.
- [x] Run unchanged CI audit command and all-dependency high gate, full tests/integration/lint/types/build, Expo export and standalone runtime checks. Preserve SQL and application source.
- [x] Fresh independent review, document actual audit counts and source snapshot caveat, stop only owned test processes, hand off locally.

Hasil final: [laporan penyelesaian](../../node-forge-audit-resolution.md). Gate CLI high/critical pass; JSON diagnostic/default audit masih mencatat moderate/low. Source yang dipin merupakan PR belum merge, bukan rilis resmi.
