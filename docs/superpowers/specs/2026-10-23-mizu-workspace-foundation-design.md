# Fondasi workspace Mizu

Tanggal: 23 Oktober 2026  
Status: rancangan migrasi untuk review  
Sumber: Mizu `61a7d22`, blueprint 22 Oktober 2026, dan starter lokal `init-monorepo`.

Pengguna menghendaki struktur Mizu mengikuti organisasi monorepo pada init-monorepo untuk memperbaiki fondasi frontend, backend Go dan mobile. Rancangan ini membatasi tahap pertama pada layout, dependency workspace, perintah developer, build, dan CI. Blueprint ekstraksi Core Template v1 tetap menjadi arah berikutnya.

## Keputusan arsitektur

Gunakan `apps/frontend`, `apps/backend`, `apps/mobile`, `packages`, dan `services` dalam repository Mizu saat ini. Gunakan pnpm workspace dan Turborepo sebagai orkestrasi, mengikuti starter yang diperiksa. Go tetap satu Go module; `package.json` backend hanya mendaftarkan perintah Go ke task graph.

| Pendekatan | Tradeoff | Pilihan |
| --- | --- | --- |
| Menata Mizu bertahap di repository sekarang | Mempertahankan seluruh implementasi dan histori; banyak path build/ops perlu disesuaikan | Rekomendasi untuk permintaan ini |
| Menyalin seluruh Mizu ke init-monorepo | Menghasilkan dua sumber yang harus diselaraskan dan diff awal lebih sulit direview | Tidak dipilih |
| Ekstraksi core bersamaan dengan perpindahan folder | Menggabungkan perubahan bisnis/schema dengan perubahan tooling sehingga regresi lebih sulit dilacak | Tahap terpisah sesuai blueprint |

Keputusan implementasi yang diusulkan: kerja dilakukan langsung dalam checkout Mizu, perubahan tetap belum di-commit agar dapat direview. Checkout saat pemetaan berada pada branch `main`; pelaksanaan di checkout tersebut memerlukan persetujuan pengguna sebelum perubahan aplikasi. Dokumen blueprint yang sudah ada tetap dipertahankan.

## Layout dan pemetaan

```text
mizu/
├── apps/
│   ├── frontend/                  # sebelumnya frontend/
│   ├── backend/                   # sebelumnya backend/, satu go.mod
│   │   └── database/              # SQL, seed dan tooling Node tetap di sini
│   └── mobile/                    # sebelumnya mobile/
├── packages/
│   └── typescript-config/         # hanya opsi umum web dan mobile
├── services/
│   ├── wa-gateway/                # lokasi saat ini dipertahankan
│   ├── pos-nfc-bridge/            # dari tools/pos-nfc-bridge/
│   └── pos-print-worker/          # dari tools/pos-print-worker/
├── tools/                         # deployment dan utilitas operasional
├── docs/
├── scripts/                       # pemeriksaan workspace dan generated files
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── .npmrc
└── Makefile
```

Tidak membuat aplikasi docs Next.js kedua karena dokumentasi Markdown sudah tersedia. Komponen UI tetap di frontend sampai benar-benar ada consumer web kedua. Backend database tetap berdekatan dengan runner migrasi untuk membatasi perubahan path dan menjaga SQL serta checksum migrasi.

## Toolchain dan dependency

- Node 24 digunakan sebagai runtime lokal/CI yang konsisten dengan starter; pin patch yang tersedia dan tervalidasi pada implementasi.
- pnpm tetap 9.15.0 pada tahap penataan ini. Migrasi ke pnpm 11.25.0 adalah perubahan terpisah karena format pengaturan override/build policy berbeda. Kesamaan struktur tidak mengharuskan migrasi package manager dan framework sekaligus.
- Turborepo dipin 2.11.10, versi yang telah diperiksa pada init-monorepo. Konfigurasinya disusun untuk task Mizu, bukan menyalin task starter yang hanya mengenal aplikasi Next.js.
- Pertahankan versi Next, React web, React Native, Expo, TypeScript masing-masing dan Go yang ditetapkan Mizu. Jangan memaksa React mobile 19.2.3 mengikuti patch web 19.2.4 lewat override global.
- Satu lockfile pnpm di root. Override keamanan dan allowlist build dependency frontend dipindahkan ke root agar berlaku pada workspace. Lockfile individual dihapus hanya setelah dependency terkait tercakup dalam root lockfile dan frozen install lulus.
- Bandingkan versi resolved dari seluruh lockfile asal. Mempertahankan manifest range `^` saja tidak membuktikan dependency tidak berubah. Pertahankan direct resolutions yang ada bila kompatibel; perubahan transitive akibat deduplikasi/override dicatat dan diuji sebelum lockfile lama dihapus.
- Workspace mencakup `apps/*`, `apps/backend/database`, `packages/*`, dan `services/*`. Go source tidak menjadi package JavaScript; manifest backend hanyalah adapter task runner.
- Pertahankan layout dependency yang diperlukan serverExternalPackages. Uji resolusi React web/mobile dan native module; bila hoisting menyebabkan versi renderer tertukar, gunakan isolated linker dengan konfigurasi tracing/alias yang diuji, bukan override paksa.
- Shared TypeScript base hanya memuat strictness dan opsi yang kompatibel. Konfigurasi Next dan Expo tetap dipertahankan pada masing-masing app. Tidak memaksakan konfigurasi DOM atau compiler web pada mobile.

## Kontrak perintah root

| Perintah | Perilaku |
| --- | --- |
| `pnpm install` | Memasang dependency workspace dari root |
| `pnpm dev` | Menjalankan frontend Next dan backend Go bersama |
| `pnpm dev:frontend` | Hanya frontend |
| `pnpm dev:backend` dan `pnpm backend:dev` | Hanya backend Go; alias lama dipertahankan |
| `pnpm dev:mobile` | Expo; URL API perangkat dikonfigurasi eksplisit |
| `pnpm build` | Build frontend production dan binary Go |
| `pnpm lint` | ESLint frontend dan pemeriksaan Go |
| `pnpm check-types` | Typecheck frontend/mobile; hasil baseline dilaporkan apa adanya |
| `pnpm test` | Tes frontend, mobile yang sudah tersedia, dan Go; integrasi Go lokal tetap memerlukan TEST_DATABASE_URL eksplisit |
| `pnpm test:integration` | Menolak berjalan bila test DB tidak diberikan; memakai database disposable/lokal |
| `pnpm db:migrate` / `pnpm db:migrate:apply` | Perilaku dry-run/apply Go yang ada, tanpa mengubah SQL |
| `pnpm db:seed ...` | Menjalankan tooling database pada workspace-nya; tidak otomatis dijalankan saat dev |
| `pnpm pos:nfc-bridge`, `pnpm pos:print-worker`, `pnpm wa-gateway` | Layanan pendamping secara eksplisit |

Task dev menggunakan strict lifecycle: Ctrl+C menghentikan child process; kegagalan backend/frontend menghentikan pasangan dev agar tidak meninggalkan server yang membingungkan. Backend Go mendapat env dari environment dan file miliknya sesuai precedence yang ada. BACKEND_URL frontend mengikuti precedence shell, file env app sesuai aturan Next, lalu default lokal. Default tidak boleh disuntikkan melalui process env sebelum file app dibaca karena dapat menimpa pilihan pengguna. Ketiga kasus tersebut diuji. Tidak menyalin credential dari frontend ke mobile.

Dev script lama frontend secara otomatis mencoba NFC dan tunnel Cloudflare. Pada standar baru, default dev berisi web dan Go. Kebutuhan tunnel dipertahankan sebagai perintah ops eksplisit, dengan hostname dari konfigurasi pengguna; tidak membuka koneksi remote saat pengujian.

## Dampak path yang harus ditangani

Pemindahan frontend/backend sebagai sibling mempertahankan banyak path `../frontend` dan `../backend`. Referensi yang berawal dari root repository harus diperbarui. Audit harus membedakan path filesystem dengan import Go `nuhabit/backend/...`; import module Go tidak diganti hanya karena direktori dipindahkan.

- Root scripts, Makefile backend, generator IAM/route manifest dan tes drift yang membaca frontend.
- Resolusi storage dan assistant-memory; fallback lokal tetap menunjuk storage frontend yang sama secara relatif. File storage yang sudah ada tidak dihapus.
- Frontend Vitest alias `server-only` saat dependency terpasang dari root workspace.
- Root Dockerfile web: manifest workspace, lockfile root, file tracing, lokasi standalone server, static/public, storage dan pembersihan env pada image.
- `apps/frontend/next.config.ts`: `turbopack.root` dan `outputFileTracingRoot` mengikuti workspace; uji dependency runtime PDFKit, Tesseract dan Sharp di standalone, bukan hanya keberhasilan kompilasi.
- Backend Dockerfile/context dan semua pemanggil build API pada CI/deploy.
- GitHub/GitLab working directory, cache key dan path Go. Build Go mempertimbangkan output non-Next pada cache task.
- Skrip deployment lokal, tools, `.gitignore`, `.dockerignore`, README dan CLAUDE.md. Dokumen historis tidak diganti massal seolah-olah path baru sudah berlaku pada kejadian lama.

Konfigurasi Turbo harus meneruskan env runtime/CI yang dibutuhkan aplikasi tanpa menyimpan hasil build dengan cache key yang mengabaikan env. Untuk tahap migrasi, nonaktifkan cache build/test sampai input dan env yang benar terbukti; jangan mengorbankan correctness demi cache.

## Syarat selesai tahap fondasi

1. Layout baru lengkap; tidak ada source aplikasi hilang dan isi SQL migrasi tidak berubah.
2. Root workspace dan lockfile tunggal dapat diinstal dengan `--frozen-lockfile`.
3. Task graph memuat Go dan frontend pada `pnpm dev`, mobile/adapter tetap eksplisit.
4. Unit test Go dan frontend, lint, typecheck, serta build dijalankan. Kegagalan warisan dipisahkan dari regresi dan dilaporkan dengan nama; tidak diatasi dengan menonaktifkan pemeriksaan.
5. Generator IAM dan route manifest dapat dijalankan dari lokasi baru, menghasilkan output yang sama secara semantik dan tidak memerlukan source pada path lama.
6. Smoke dev memakai database lokal/disposable; tidak mengakses database produksi. Jika PostgreSQL lokal tidak tersedia, laporkan batas runtime yang belum diverifikasi.
7. Web production build menggunakan layout standalone yang sesuai workspace. Image diperiksa bila Docker tersedia; bila tidak, bedakan build aplikasi dan build image yang belum terverifikasi.
8. CI/deploy scripts tidak lagi memakai path source lama pada operasi aktif. Database/schema, branding, dan business logic tidak diubah pada fase ini.

Fondasi ini belum berarti Core Template v1 selesai. Penghapusan backend bisnis Next, pemisahan auth/IAM dari domain, baseline database core dan pelepasan modul industri mengikuti fase berikutnya pada blueprint.
