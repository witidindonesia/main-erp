# Mizu Workspace Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development when explicitly selected. Read the spec and this plan before changing files.

**Goal:** Menata Mizu menjadi workspace frontend, Go, dan mobile dengan instalasi serta perintah root yang konsisten.

**Architecture:** Pemindahan bertahap pada repository Mizu, mempertahankan semua perilaku bisnis. pnpm workspace memiliki frontend, mobile, tooling DB dan adapter; manifest backend menghubungkan satu Go module ke Turborepo.

**Tech Stack:** Node 24, pnpm 9.15.0, Turbo 2.11.10; dependency aplikasi dan Go mengikuti manifest Mizu yang ada.

**Spec:** `docs/superpowers/specs/2026-10-23-mizu-workspace-foundation-design.md`; arah lanjutan: `docs/superpowers/specs/2026-10-22-standard-monorepo-blueprint.md`.

## Global Constraints

- Target: `apps/frontend`, `apps/backend`, `apps/mobile`, `packages/*`, `services/*`.
- Backend database tetap di `apps/backend/database`; SQL serta identitas/checksum migrasi tidak diubah.
- Satu pnpm lockfile root; package dependency aplikasi tidak di-upgrade dalam migrasi struktur.
- `pnpm dev` menjalankan web dan Go; mobile, NFC, WhatsApp, print dan tunnel dijalankan eksplisit.
- Auth, aturan bisnis, branding dan data tidak diubah; migrasi core dilakukan kemudian.
- Source Go tetap memakai module path `nuhabit/backend`; tidak melakukan replace massal import.
- Node 24, pnpm 9.15.0, Turbo 2.11.10; React web/mobile tidak disamakan melalui override global.
- Tidak menjalankan seeder, migrasi apply, provider atau deployment pada target remote selama verifikasi.
- Eksekusi dilakukan langsung secara lokal di folder Mizu. Instruksi pengguna: tidak menjalankan Git, commit, push, atau membuat repository/worktree.

## Review Focus

- Root path berbeda dari relative sibling path: generator/test/storage harus tetap membaca app yang benar.
- React dan native module web/mobile tidak tertukar akibat hoisting workspace.
- Sinyal Ctrl+C dan exit Go/web tidak meninggalkan child process atau memicu NFC/tunnel tak diminta.
- Standalone output, aset, upload volume, env dan working directory runtime konsisten pada layout baru.
- Frozen install, Go import path, SQL checksum dan generated manifest tetap reproducible.

## Task 1: Baseline dan kontrak migrasi

**Files:** manifest saat ini; `.github/workflows/ci.yml`; `.gitlab-ci.yml`; `frontend/scripts/dev.mjs`; generator dan storage Go.

**Interfaces:** consumes checkout Mizu; produces inventaris path aktif, baseline verification dan daftar file sebelum dipindahkan.

- [x] Catat versi tool dan inventaris/hash source serta SQL; langkah Git ditiadakan sesuai instruksi pengguna.
- [x] Instal dependency dengan pnpm 9.15.0 pada baseline; run frontend tests/lint/typecheck/build dan Go unit tests/vet. Simpan log, pisahkan hambatan environment dari kegagalan tes.
- [x] Petakan root references, generator, Docker/CI/deploy, env dan layanan pendamping. Jangan menganggap semua string `backend/` adalah filesystem path.
- [x] Buat pemeriksaan migrasi yang menilai hasil nyata: daftar/hash file sumber, SQL tidak berubah, resolution React per app, dan perintah generator dari CWD baru.

## Task 2: Layout dan dependency workspace

**Files:** move `frontend/` → `apps/frontend/`, `backend/` → `apps/backend/`, `mobile/` → `apps/mobile/`; move bridge/print ke services; create root workspace/config dan `packages/typescript-config`; update package manifests.

**Interfaces:** produces package names `@mizu/frontend`, `@mizu/backend`, `@mizu/mobile`, `@mizu/database`; backend database tetap sibling internal backend.

- [x] Pindahkan source dan file lokal secara utuh tanpa menghapus ignored storage/env; periksa file inventory/hash setelah move.
- [x] Buat workspace root untuk `apps/*`, `apps/backend/database`, `packages/*`, `services/*`. Backend package scripts hanya menjalankan Go/Makefile yang ada.
- [x] Pindahkan kebijakan pnpm override/build ke root; inventarisasi direct/transitive resolved versions dari lockfile asal. Pertahankan direct resolutions yang kompatibel dan catat perubahan transitive akibat deduplikasi/override. Bentuk root lockfile dan uji frozen install sebelum membuang lockfile lama.
- [x] Shared TypeScript config hanya memuat opsi bersama; Next/Expo mempertahankan basis framework masing-masing.
- [x] Bandingkan hasil resolve React/React Native dari CWD tiap app. Perbaiki linker/tracing jika perlu, tanpa menyamakan versi React paksa.

## Task 3: Orkestrasi developer dan build

**Files:** root `package.json`, `turbo.json`, `Makefile`, frontend dev scripts, backend task manifest, mobile scripts, service manifests.

**Interfaces:** produces command contract pada spec; `dev` hanya web+Go, `dev:mobile` menjalankan Expo.

- [x] Definisikan Turbo build/lint/test/check-types/dev; backend build mengeluarkan `bin/api` dan `bin/migrate`. Hindari cache untuk task yang input/env-nya belum didefinisikan benar.
- [x] Pertahankan alias root yang dipakai sekarang (`backend:dev`, `backend:test`, `db:*`, POS tools) dengan target path/package baru.
- [x] Tambahkan mobile `test` script untuk Vitest dan masukkan `src/lib/loyalty.test.ts` yang sudah tersedia ke verifikasi root; jangan menganggap mobile hanya memerlukan typecheck.
- [x] Uji task graph dev memakai dry-run: tepat frontend dan backend; mobile/adapter tidak dijalankan default.
- [x] Uji lifecycle dev dengan proses lokal terkontrol: satu proses gagal dan Ctrl+C membersihkan seluruh child. Gunakan perintah stub tanpa DB/provider sebelum smoke aplikasi nyata.
- [x] Sediakan env example dan dokumentasikan BACKEND_URL. Uji bahwa nilai shell menang, nilai file env app dipertahankan jika shell kosong, dan default localhost dipakai hanya bila keduanya tidak ada. Fallback tidak menghubungkan database remote.

## Task 4: Path lintas app, generator dan storage

**Files:** backend Makefile, IAM generator/drift tests, frontend assistant/session test, scripts seed preview, Vitest alias dan kode path lain hasil Task 1.

**Interfaces:** consumes layout baru; produces generation dan resource lookup yang sesuai.

- [x] Perbarui hanya referensi path yang berubah akibat root baru. Relative sibling path yang tetap valid tidak perlu ditulis ulang.
- [x] Jalankan `make -C apps/backend generate`, bandingkan route manifest dengan hasil API `-routes` dan periksa output IAM.
- [x] Jalankan tes storage, insights, spa public assets, auth/iam drift dan frontend session-store. Tambah regresi hanya jika menemukan resolusi path yang memang belum diuji.
- [x] Verifikasi file storage lama dan path fallback Go/Next tetap mengarah ke lokasi yang sama. Tidak mengosongkan volume/direktori upload.

## Task 5: Docker, CI dan operasi

**Files:** root Dockerfile/.dockerignore; `apps/frontend/next.config.ts`; backend Dockerfile; GitHub/GitLab CI; tools/deploy scripts; root README/CLAUDE/.gitignore.

**Interfaces:** consumes root lockfile dan layout baru; produces build/deploy configuration yang tetap memakai API/image runtime semula.

- [x] Web image menginstal workspace dari root lockfile, membangun frontend, menyalin standalone output yang benar, static/public dan storage; BuildKit secret tetap tidak tertinggal pada layer.
- [x] Sesuaikan `turbopack.root` dan `outputFileTracingRoot` untuk resolusi workspace. Smoke standalone runtime PDFKit/font, Tesseract worker dan native Sharp; build compile saja tidak cukup membuktikan resource eksternal tersebut tersedia.
- [x] Sesuaikan build context API Go; pertahankan `MIGRATIONS_DIR`, non-root runtime, health/readiness dan storage mount.
- [x] Update CI working directories, cache path dan generator diff; root install dilakukan satu kali per job yang memerlukan JS dependency.
- [x] Update skrip deploy lokal yang memakai source path lama; tidak menjalankannya terhadap server.
- [x] Uji Docker build bila daemon tersedia; selain itu lakukan application build dan catat verifikasi image yang belum tersedia.

## Task 6: Verifikasi akhir dan handoff

**Files:** README, panduan monorepo baru, rencana ini dan laporan hasil pemeriksaan.

**Interfaces:** produces checkout yang dapat direview dengan bukti pemeriksaan dan batasan tersisa.

- [x] Jalankan root frozen install, lint, check-types, test frontend/mobile/Go dan build. Laporkan setiap tes gagal berdasarkan nama beserta status baseline/regresi.
- [x] Jalankan integrasi pada PostgreSQL disposable/lokal bila tersedia. Command integrasi menolak TEST_DATABASE_URL kosong.
- [x] Smoke frontend/API dan Expo bundle bila tool tersedia; jangan menyatakan native Android/iOS telah diuji tanpa build/install nyata.
- [x] Bandingkan inventaris source dan checksum SQL; cek generated output dan active scripts terhadap path lama.
- [x] Fresh reviewer memeriksa seluruh perubahan terhadap spec dan Review Focus; tangani temuan penting, lalu ulangi pemeriksaan yang terdampak.
- [x] Dokumentasikan command baru, versi tool, status backend Next yang masih ada, dan langkah lanjutan ekstraksi core. Perubahan tetap belum di-commit kecuali pengguna meminta integrasi.

## Catatan eksekusi 23 Oktober 2026

Seluruh pekerjaan lokal dan pemeriksaan yang tersedia dijalankan. Checkbox verifikasi menandai pemeriksaan telah dilakukan, bukan seluruh hasil otomatis hijau. Tiga tes integrasi gagal pada kode baseline maupun hasil migrasi; audit dependency melaporkan 25 advisory. Docker tidak tersedia, sehingga image belum diuji. Lihat [laporan verifikasi](../../monorepo-migration-verification.md) untuk hasil, batasan, dan tahap berikutnya.
