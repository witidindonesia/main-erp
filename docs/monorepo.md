# Panduan workspace ERP

Panduan ini berlaku untuk struktur template saat ini. Langkah instalasi awal tersedia di [README root](../README.md). Riwayat migrasi dan operasional proyek sebelumnya tercantum di [indeks arsip](archive/README.md).

## Struktur dan versi

Workspace menggunakan pnpm dan Turborepo. Paket aplikasi berada di [apps](../apps/), konfigurasi bersama di [packages](../packages/), dan integrasi opsional di [services](../services/README.md). Namespace `@mizu/*` dan modul Go yang ada masih dipertahankan; menggantinya perlu perubahan terkoordinasi dengan aplikasi.

Gunakan Node dari [.nvmrc](../.nvmrc), pnpm dari `packageManager` pada [package.json](../package.json), dan Go sesuai [go.mod](../apps/backend/go.mod). GitHub Actions membaca versi Node dari file yang sama. PostgreSQL untuk development disiapkan secara terpisah.

Pasang dependensi satu kali di root dengan `pnpm install --frozen-lockfile`. Jangan membuat lockfile tambahan per aplikasi. Konfigurasi [.npmrc](../.npmrc) memakai linker `isolated` untuk menjaga pemisahan dependensi web/mobile. [Patch query-string](../patches/query-string@7.1.3.patch) diperlukan untuk kompatibilitas decoder URL; jangan menghapusnya tanpa memperbarui dependensi dan menjalankan tes terkait.

## Environment dan database

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/backend/.env.example apps/backend/.env.local
# Jika memakai aplikasi mobile:
cp apps/mobile/.env.example apps/mobile/.env.local
```

Isi URL database sesuai PostgreSQL lokal. Frontend masih memerlukan konfigurasi database selama route API Next yang ada belum seluruhnya dipindahkan ke Go. Kredensial integrasi hanya perlu diisi untuk fitur yang digunakan.

Sebelum migrasi pada cluster baru, siapkan role `authenticated`, `anon`, dan `service_role` sebagai NOLOGIN jika belum ada. Tinjau migrasi dengan `pnpm db:migrate`, lalu terapkan melalui `pnpm db:migrate:apply`. Buat super admin secara eksplisit lewat `pnpm db:seed db:seed:super-admin` dengan `SUPER_USER_EMAIL` dan `SUPER_USER_PASSWORD` di environment.

Perintah `db:seed:paddy-demo` dan `db:seed:paddy-full` tetap tersedia untuk kompatibilitas, tetapi membawa data dan branding proyek lama. Keduanya bukan langkah setup template standar; gunakan hanya pada database demo yang memang ditujukan untuk itu.

## Perintah dari root

| Perintah | Hasil |
| --- | --- |
| `pnpm dev` | Frontend port 3000 dan API Go port 8080. |
| `pnpm dev:frontend` | Frontend saja. |
| `pnpm dev:backend` | Backend saja. |
| `pnpm dev:mobile` | Expo, dijalankan terpisah. |
| `pnpm build` | Build frontend dan backend. |
| `pnpm lint` | Lint frontend dan pemeriksaan Go. |
| `pnpm check-types` | Typecheck frontend dan mobile. |
| `pnpm test:tooling` | Tes tooling root, kompatibilitas dependensi, dan print worker. |
| `pnpm test` | Tes tooling dan workspace; tes database memerlukan konfigurasi database pengujian. |
| `pnpm test:integration` | Tes backend dengan URL PostgreSQL lokal yang wajib diberikan. |
| `make -C apps/backend generate` | Memperbarui prefix IAM dan manifest route backend. |
| `pnpm db:migrate` / `pnpm db:migrate:apply` | Tinjau / terapkan migrasi Go. |
| `pnpm db:seed <nama-script>` | Menjalankan seeder yang dipilih. |
| `pnpm backend:audit` | Audit dependensi dan provenance source backend. |

Alias `pnpm typecheck` dan `pnpm backend:dev` dipertahankan untuk kompatibilitas. `pnpm dev:legacy-services` merupakan entry lama; gunakan `pnpm dev` dan perintah layanan terpisah untuk setup template. Root tidak menyediakan Makefile; perintah `make` backend harus menyertakan `-C apps/backend`.

## Development dan layanan opsional

Launcher frontend memuat environment sesuai urutan Next: shell, file aplikasi, lalu default `BACKEND_URL=http://127.0.0.1:8080` jika belum diisi. Hindari menetapkan `PORT` global untuk frontend dan backend sekaligus.

Pada perangkat mobile fisik, `localhost` menunjuk perangkat tersebut. Gunakan IP LAN komputer untuk alamat backend dan restart Expo setelah mengubah public environment.

Gateway WhatsApp, bridge NFC, dan print worker tidak otomatis dijalankan oleh `pnpm dev`. Setiap layanan memiliki petunjuk dan contoh environment pada [indeks layanan](../services/README.md). Print worker saat ini memakai adapter mock; gunakan `--sample` atau `--dry-run` untuk pratinjau.

## Verifikasi

```bash
pnpm test:tooling
pnpm lint
pnpm check-types
pnpm test
pnpm build
TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/erp_test pnpm test:integration
```

Siapkan database pengujian terpisah. Runner integrasi menolak URL kosong, host remote, dan query yang mengganti target koneksi. Sesuaikan port, nama database, dan kredensial contoh sebelum menjalankannya.

Workflow CI disimpan di [.github/workflows/ci.yml](../.github/workflows/ci.yml). Tidak ada langkah deployment di workflow tersebut.

## Docker opsional

Image frontend memakai build context root. Bila build memerlukan environment, berikan melalui BuildKit secret dari file di luar repository:

```bash
docker build --secret id=dotenv,src=/absolute/path/frontend-build.env -t erp-web:local .
docker build -t erp-api:local apps/backend
```

Environment runtime diberikan ketika container dijalankan. Perintah di atas hanya membangun image; template tidak menetapkan host, domain, atau target deployment. [Dockerfile root](../Dockerfile) mempertahankan dukungan storage dan Next standalone yang ada.

## Catatan dependensi

Override dependensi, patch, dan snapshot source lokal masih diperlukan oleh workspace saat ini. Jangan menghapusnya hanya karena repository dijadikan template. Bukti dan alasan perubahan sebelumnya tersedia di [catatan dependensi](README.md#catatan-dependensi). Hasil audit di dokumen tersebut berlaku pada tanggal pengujiannya, bukan jaminan status audit saat ini.
