# Clean all workspace dependency advisories

Scope: local Mizu only; preserve features; no Git, commits, push, deployment or working database changes.

1. Reproduce editor XSS and capture audit baseline; verify actual published replacements.
2. Update compatible patched dependencies. Replace Quill with quill-next after proving XSS fix. Bridge query-string CommonJS to the patched ESM decoder with a one-line package patch. Preserve immutable Forge source and SRI.
3. Require all severities and development dependencies in CI audit. Exercise editor, navigation, UUID, media metadata and existing suites.
4. Verify frozen installation, audits, tests, integration, lint, types, builds, Expo exports and local smoke checks. Fresh final review; document evidence and limits.

Expected: full and production audit zero at all severities; all checks exit zero. Review focus: actual XSS fix rather than advisory identity changes, Metro decoder interoperability, Docker patch availability, immutable Forge integrity, unchanged SQL/business features.
