# Monorepo agent guide

## Scope and sources of truth

This repository is an ERP template with Next.js, Go, Expo, and optional Node services. It has GitHub CI, but no deployment target. Existing `@mizu/*` package names, Go module paths, application branding, and demo seeders are retained for compatibility; do not rename them as an incidental cleanup.

Start with [README.md](README.md), [the workspace guide](docs/monorepo.md), and [the documentation index](docs/README.md). Documents listed in [the archive index](docs/archive/README.md) describe historical projects; their server addresses, deployment commands, and status reports are not current template instructions.

Read the nearest applicable `AGENTS.md` before editing:

- [Frontend instructions](apps/frontend/AGENTS.md): consult the installed Next.js version's local documentation before changing frontend code.
- [Mobile instructions](apps/mobile/AGENTS.md): consult the specified Expo version's documentation before changing mobile code.

## Repository map

| Path | Responsibility |
| --- | --- |
| [apps/frontend](apps/frontend/) | Next.js UI, remaining Next API handlers, and proxy to Go. |
| [apps/backend](apps/backend/) | Go modular monolith: entry points in `cmd/`, wiring in `internal/app/`, shared platform code, and domain modules in `internal/modules/`. |
| [apps/backend/database](apps/backend/database/) | SQL migrations, schema tooling, and Node seeders. |
| [apps/mobile](apps/mobile/) | Expo/React Native member application. |
| [packages/typescript-config](packages/typescript-config/) | Shared TypeScript compiler settings. |
| [services](services/README.md) | Optional WhatsApp gateway, PC/SC NFC bridge, and mock print worker. |
| [scripts](scripts/) | Development launcher, integration runner, and tooling regression tests. |
| [patches](patches/) | pnpm dependency patches; required during installation and Docker builds. |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | Tests, build, type checks, and dependency audits. |

## Toolchain and commands

Use Node from [.nvmrc](.nvmrc), pnpm from `packageManager` in [package.json](package.json), and Go from [the backend module](apps/backend/go.mod). Install once at the repository root with `pnpm install --frozen-lockfile`. Keep the single [pnpm lockfile](pnpm-lock.yaml), [workspace definition](pnpm-workspace.yaml), and isolated linker configuration in [.npmrc](.npmrc).

Run commands from the root unless stated otherwise:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Frontend on port 3000 and Go API on port 8080. |
| `pnpm dev:frontend`, `pnpm dev:backend`, `pnpm dev:mobile` | Run one application. |
| `pnpm build` | Build frontend and Go binaries. |
| `pnpm lint` | Frontend lint and backend vet/format checks. |
| `pnpm check-types` | Frontend and mobile TypeScript checks. |
| `pnpm test:tooling` | Root tooling, dependency compatibility, and print-worker tests. |
| `pnpm test` | Tooling and workspace tests. |
| `pnpm test:integration` | Go tests against an explicitly configured local test database. |
| `pnpm backend:audit` | Backend dependency/provenance checks. |
| `make -C apps/backend generate` | Regenerate IAM prefixes and frontend Go-route manifest. |

There is no root Makefile. Prefer `check-types` and `dev:backend`; `typecheck` and `backend:dev` remain compatibility aliases. Use `pnpm dev`, rather than the legacy combined-services launcher, for normal development.

## Implementation boundaries

- Keep business rules in the existing domain modules. Preserve HTTP methods, paths, status codes, response shapes, and permission checks when changing or porting API handlers.
- After backend route or IAM-prefix changes, regenerate the derived files with the command above and inspect the result. Do not manually maintain the generated route manifest.
- Keep framework-specific TypeScript settings within each app and common settings in the shared package. Web/mobile React versions intentionally differ; do not flatten their dependencies.
- Preserve dependency overrides, patch registrations, and [maintained backend source snapshots](apps/backend/third_party/README.md). Change them only with relevant compatibility tests and audit checks.
- Do not add per-app lockfiles, edit `node_modules`, or reintroduce client-specific deployment automation during template maintenance.

## Environment, data, and optional services

The root [.env.example](.env.example) points to app-level configuration. Copy the relevant app's example to its local environment file; do not commit credentials, sessions, uploads, or database dumps.

`pnpm db:migrate` previews migrations; `pnpm db:migrate:apply` applies them. Run seeders explicitly against the intended database. Paddy/demo seed commands import project-specific data and branding; they are not default template setup.

Integration tests require an isolated local PostgreSQL database configured through `TEST_DATABASE_URL`. The root runner rejects empty/remote targets and runs Go packages serially to avoid migration locks. Do not use the backend Makefile's default database without verifying its target.

Services are opt-in and do not start with `pnpm dev`. Their `.env` files require explicit loading as documented in [the service guides](services/README.md). Print-worker `--sample` is offline; `--dry-run` previews jobs without changing status. Normal print processing still uses a mock adapter and marks jobs printed; it is not a physical printer implementation.

## Verification

Run checks appropriate to the change before reporting completion:

- Root/service JavaScript: use Node's test runner, for example `node --test scripts/pos-print-worker.test.mjs`, then `pnpm test:tooling` when shared tooling or dependencies change.
- Frontend/mobile: run the affected Vitest tests through the relevant workspace package, then the applicable lint/type checks.
- Go: run affected package tests and formatting/vet checks; use `pnpm test:integration` when database behavior changes. Tests without a database can skip integration cases, so report that limitation explicitly.
- Documentation/configuration: validate commands, links, and syntax. Do not start live integrations or apply migrations merely to verify prose changes.

Preserve unrelated working-tree changes. Report what changed, which checks actually ran, and any remaining limitations; historical audit reports do not establish today's test or vulnerability status.

<!-- postman-cli:installation:start -->
Postman CLI is installed on this device, and can be used for API Engineering work.
It is not on PATH; run it as /Users/banurusman/.local/bin/postman.
<!-- postman-cli:installation:end -->
