# ERP Monorepo Template

Template pengembangan ERP dengan frontend Next.js, backend Go, aplikasi mobile Expo, dan layanan integrasi opsional. Repository ini menyediakan pemeriksaan otomatis melalui GitHub Actions; tidak memiliki target server atau workflow deployment.

Template berasal dari aplikasi yang sudah ada. Namespace paket `@mizu/*`, modul Go, branding aplikasi, dan seeder khusus proyek masih dipertahankan sampai audit aplikasi selesai. Menggunakan template ini belum otomatis menghasilkan aplikasi tanpa identitas atau data contoh lama.

## Mulai secara lokal

Prasyarat:

- Node.js sesuai [.nvmrc](.nvmrc); gunakan `nvm install` lalu `nvm use` jika memakai NVM.
- pnpm 9.15.0, sesuai `packageManager` di [package.json](package.json).
- Go sesuai [go.mod backend](apps/backend/go.mod).
- PostgreSQL lokal untuk development dan database terpisah untuk pengujian.

Jalankan dari root repository:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env.local
```

Isi `DATABASE_URL` dan `MIGRATE_DATABASE_URL` sesuai database lokal. File [.env.example](.env.example) di root hanya menunjukkan lokasi konfigurasi per aplikasi; konfigurasi runtime tidak dipusatkan di root.

Untuk cluster PostgreSQL baru, siapkan role kompatibilitas migrasi berikut dengan akun administrator database:

```sql
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE anon NOLOGIN;
CREATE ROLE service_role NOLOGIN;
```

Role tersebut cukup dibuat sekali jika belum ada. Selanjutnya:

```bash
pnpm db:migrate                          # tinjau migrasi
pnpm db:migrate:apply                    # terapkan ke database lokal
pnpm db:seed db:seed:super-admin          # set SUPER_USER_EMAIL dan SUPER_USER_PASSWORD
pnpm dev                                # frontend :3000 dan backend :8080
```

Seeder demo khusus proyek dijalankan terpisah, bukan bagian setup template standar. Rincian konfigurasi dan perintah ada di [panduan workspace](docs/monorepo.md).

## Struktur

| Lokasi | Fungsi |
| --- | --- |
| [apps](apps/) | Frontend Next.js, backend Go beserta database tooling, dan mobile Expo. |
| [packages](packages/) | Konfigurasi TypeScript bersama. |
| [services](services/README.md) | Gateway WhatsApp, bridge NFC, dan contoh print worker; dijalankan bila diperlukan. |
| [scripts](scripts/) | Launcher frontend, runner tes integrasi, dan tes tooling/kompatibilitas. |
| [patches](patches/) | Patch dependensi yang diterapkan pnpm saat instalasi. |
| [docs](docs/README.md) | Indeks panduan aktif, referensi modul, dan arsip proyek. |
| [.github](.github/workflows/ci.yml) | Workflow tes, build, dan audit dependensi. |

## Perintah utama

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | Menjalankan frontend dan backend bersama. |
| `pnpm dev:frontend` / `pnpm dev:backend` | Menjalankan satu aplikasi. |
| `pnpm dev:mobile` | Menjalankan Expo secara terpisah. |
| `pnpm build` | Build frontend dan backend. |
| `pnpm lint` / `pnpm check-types` | Pemeriksaan lint dan tipe. |
| `pnpm test:tooling` | Tes launcher, dependensi, dan print worker. |
| `pnpm test` | Tes tooling dan workspace. |
| `pnpm test:integration` | Tes Go dengan `TEST_DATABASE_URL` lokal yang wajib diisi. |
| `pnpm backend:audit` | Pemeriksaan dependensi dan provenance backend. |

`typecheck` dan `backend:dev` tetap tersedia sebagai alias kompatibilitas. Gunakan `check-types` dan `dev:backend` dalam panduan baru.

## CI dan Docker

[GitHub Actions](.github/workflows/ci.yml) berjalan untuk push dan pull request ke `main` atau `development`. Versi Node dibaca dari [.nvmrc](.nvmrc). CI menjalankan tes, pemeriksaan tipe, lint, build frontend, audit dependensi, dan tes integrasi backend dengan PostgreSQL sementara.

[Dockerfile](Dockerfile) dan [.dockerignore](.dockerignore) tetap tersedia untuk membangun image frontend. Backend memiliki Dockerfile sendiri. Keduanya tidak melakukan deployment otomatis; petunjuk build ada di [panduan workspace](docs/monorepo.md#docker-opsional).

## Dokumentasi

Mulai dari [indeks dokumentasi](docs/README.md). Catatan brand, server, dan proses operasional lama dipisahkan sebagai [arsip proyek](docs/archive/README.md), bukan instruksi deployment template.
