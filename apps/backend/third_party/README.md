# Maintained dependency snapshots

These directories are part of the backend source. Include all of them when moving Mizu to a new repository. They are local maintenance dependencies, not newly published upstream releases.

| Directory | Canonical origin | Purpose |
| --- | --- | --- |
| `compat` | x/crypto `v0.58.1-0.20261009200856-99e4382b128e`; x/net `v0.60.0` | bcrypt, blowfish, MD4, RIPEMD160, OCSP, cryptobyte test helpers and HTML/charset parsing |
| `excelize` | github.com/xuri/excelize/v2 `v2.11.1-0.20261003002531-6258dcebc4e2` | Complete Excelize snapshot with imports redirected to compat |
| `pdfcpu` | github.com/pdfcpu/pdfcpu `v0.16.1` | Complete pdfcpu snapshot, including resources, with imports redirected to compat |

No OpenPGP, SSH or QUIC implementation is copied. x/net is absent from the application graph too: its unused QUIC dependency otherwise reintroduced x/crypto. The private `mizu.local/compat v0.0.0` requirement resolves only to this directory. Excelize and pdfcpu retain their original module identities, with explicit local replacements.

`provenance.json` records the canonical module checksum, go.mod checksum and original SHA256 for 1,117 files. Original licenses and patents are included. Implementations and resources must match the canonical source after only these changes: quoted x/crypto imports to `mizu.local/compat`, quoted x/net/html imports to `mizu.local/compat/html`, and gofmt. Local go.mod/go.sum and UPSTREAM.md files describe the changed graph. Cryptographic algorithms, public dependency APIs and assets are preserved.

## Verify and audit

From the monorepo root:

```sh
pnpm backend:audit
pnpm backend:test
```

The audit downloads pinned canonical origins, verifies module and file checksums, runs `go mod verify`, rejects missing/extra/modified implementation files, and rejects x/crypto anywhere in `go list -m all`. It then installs the pinned, unmodified govulncheck 1.9.0 in a temporary directory and checks:

1. Original canonical packages at package precision, so local ownership does not silently remove their advisory coverage.
2. Application source and tests on the host and Linux/amd64.
3. The application module graph.
4. Actual Linux API and migrator binaries built with CGO disabled and production `-s -w` flags.

The disposable canonical reference still reports historical OpenPGP **module metadata**, but no affected imported packages. It is not shipped or part of the application graph. All application stages must pass without ignores, output filtering, database changes, or disabling stripping. An advisory affecting an imported canonical package fails the audit even if local application scans cannot identify its new import path.

For provenance and graph verification alone, use `go -C apps/backend run ./cmd/dependency-audit -verify-only`. The full audit requires network access to the Go proxy/checksum database and official vulnerability database. Dependency snapshots add maintenance responsibility; a zero audit is not proof that locally owned code can stop receiving security updates.

## Updating the snapshots

Review the canonical upstream release and its advisories first. Download it using `go mod download -json module@version`; retain authentic versions and checksums. Re-copy the selected compat subtrees (including their tests, licenses and any newly required helpers), or the complete Excelize/pdfcpu source and assets. Apply only the documented import substitutions and gofmt. Rebuild the file manifest from the original downloaded bytes, update module metadata and UPSTREAM.md, and tidy all four Go modules.

Check the canonical probe imports in `cmd/dependency-audit` whenever the selected packages or dependency API usage changes. Never regenerate hashes merely to accept an unexplained local algorithm change. Run the complete audit, compat upstream vectors, backend unit/integration tests, password/bcryptjs compatibility, the original-upstream encrypted Excel fixture, PDF tests and Linux build checks. Docker copies the three local manifests before downloading dependencies and copies the complete snapshots before compilation.

When upstream dependencies no longer require x/crypto and their module audits are clean, prefer official dependencies and remove the corresponding local snapshot together with its replacement, provenance entries and maintenance probe imports.
