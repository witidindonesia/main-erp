# Hasil migrasi fondasi monorepo Mizu

Pembaruan setelah tahap ini: tiga kegagalan integrasi sudah diperbaiki dan pembaruan keamanan sudah diverifikasi. Lihat [laporan stabilisasi dan keamanan](stabilization-security-verification.md) untuk status terbaru; hasil di bawah merupakan rekaman tahap migrasi awal.

Tanggal: 23 Oktober 2026. Implementasi lokal di folder Mizu, mengikuti rencana workspace foundation yang disetujui. Tidak menjalankan perintah Git, commit, push, seeder bisnis, deployment, atau perubahan database kerja. Database verifikasi dibuat khusus di direktori sementara.

## Hasil penataan

```text
mizu/
├── apps/
│   ├── frontend/             # Next.js; termasuk API Next yang masih digunakan
│   ├── backend/              # Go module nuhabit/backend
│   │   └── database/         # SQL, seeder dan tooling database
│   └── mobile/               # Expo member app
├── packages/
│   └── typescript-config/
├── services/
│   ├── wa-gateway/
│   ├── pos-nfc-bridge/
│   └── pos-print-worker/
├── scripts/                  # Env dev dan pemeriksaan tooling
├── docs/
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── turbo.json
```

Satu instalasi root memakai pnpm 9.15.0 dan Node 24.18.0. Turborepo 2.11.10 menjalankan web dan Go melalui `pnpm dev`; Expo dan adapter dijalankan eksplisit. Go diperiksa dengan toolchain 1.27.0; deklarasi module Go 1.26.0 tetap sama.

Dipertahankan: seluruh fitur, branding, aset, SQL, Go module/import path, React web 19.2.4 dan mobile 19.2.3. Source bisnis frontend/mobile serta `go.mod`/`go.sum` tidak berubah. Empat file tes Go hanya memperbaiki pemeriksaan resolusi dependency Node agar tes parity tetap dijalankan dalam workspace.

Direfaktor: path root, workspace manifests, entry dev, konfigurasi TypeScript, generator, tracing standalone, Docker, CI dan skrip deployment. Sebelas skrip seeder/audit database mendapat koreksi path dokumen/input/report; lokasi env backend tetap sama. Workbook COA dibaca tanpa menjalankan seeder atau menulis data.

Diganti: lima lockfile per aplikasi dan `.npmrc` frontend oleh satu lockfile serta konfigurasi root. Tidak ada modul fitur yang dibuang. Backend bisnis Next masih ada dan menjadi pekerjaan tahap transisi berikutnya.

## Pemeriksaan

| Pemeriksaan | Hasil |
| --- | --- |
| `pnpm install --frozen-lockfile` | Lulus; satu root lockfile untuk sembilan workspace projects |
| `pnpm test` | Lulus: 9 tes tooling/lifecycle, seluruh paket tes Go, 5.469 tes web, 11 tes mobile; 10 tes web tetap skip seperti baseline |
| `pnpm lint` | Lulus ESLint, go vet dan gofmt |
| `pnpm check-types` | Lulus web dan mobile secara terpisah dari build |
| `pnpm build` | Lulus build Next dan binary Go API/migrate |
| `make -C apps/backend generate` | Lulus; generated source tetap identik dengan inventaris awal |
| SQL | 619 file byte-identik dengan SHA256 sebelum pemindahan |
| Dependency | 97 resolusi dependency langsung lama dipertahankan; seluruh 1.717 versi paket dan seluruh snapshot lock asal tetap tercakup |
| PostgreSQL disposable | 538 migrasi berhasil diterapkan pada database UTF8 PostgreSQL 18; dry-run berikutnya tidak menemukan migrasi tertunda |
| Dev nyata | Web readiness/login 200, Go health 200, request auth melalui proxy 401 tanpa sesi; Ctrl+C menutup port web dan API milik tes |
| Standalone terisolasi | Readiness/login/static assets 200; PDFKit + Helvetica menghasilkan PDF, Sharp memproses gambar, worker Tesseract dimuat dan WASM core diinisialisasi offline |
| Expo export | Bundle Android dan iOS berhasil; belum mencakup build/install aplikasi native pada perangkat |
| NFC opt-in | `pnpm pos:nfc-bridge:install` mengompilasi addon PC/SC; native binding berhasil dimuat tanpa mengaktifkan pembaca kartu |
| Docker image | Konfigurasi diperiksa statis dan standalone diuji; image belum dibangun karena Docker CLI/daemon tidak tersedia |

Node dependency yang baru dinyatakan secara eksplisit adalah `@next/env` 16.3.8 dan `dotenv` 17.4.2; keduanya sudah ada sebagai dependency transitif sebelum migrasi. Tambahan versi paket pada lock hanya Turbo dan enam paket binary platform-nya. Shared TypeScript config memakai dependency workspace.

Linker `isolated` dipilih karena percobaan hoisted mencampur tipe React dan resolusi Zod web/mobile, menghasilkan delapan error TypeScript yang tidak ada pada baseline. Cache Next dari layout lama dipindahkan keluar project; build bersih berhasil. Tracing OCR perlu mencakup dependency pada jalur yang dipakai worker, bukan hanya file paket fisik di virtual store.

Saat smoke dev, port 3000 sedang dipakai proses lain. Next memilih 3001; proses lain tersebut dibiarkan. Port 3001 dan 8080 milik tes berhasil ditutup. Pengujian fixture juga membuktikan kegagalan salah satu task menghentikan sibling task dan proses anaknya.

## Pemeriksaan yang belum hijau

`pnpm test:integration` menjalankan tes database, lalu gagal pada tiga tes berikut. Ketiganya direproduksi dengan kode Go asli sebelum migrasi pada database disposable yang sama: 1.421 file Go salinan baseline diverifikasi hash identik dengan inventaris awal. Jadi ketiganya bukan regresi pemindahan folder; tidak ada assertion yang dilonggarkan.

| Tes | Kegagalan |
| --- | --- |
| `TestResendingSameRoleKeepsIamRoles` | Hasil `string_agg` NULL tidak dapat dipindai ke string |
| `TestOrderAlerts` | Pengiriman WA menghasilkan sent=0/failed=1, sedangkan tes mengharapkan sent=1/failed=0 |
| `TestRewardsAndRedemptions` | DELETE reward yang sudah diredeem menghasilkan 500 akibat FK RESTRICT SQLSTATE 23001 |

`pnpm audit --prod --json` melaporkan 25 advisory: 4 critical, 13 high, 6 moderate, 2 low. Ini mencakup dependency dari seluruh workspace. Paket yang dilaporkan antara lain Next, DOMPurify, shell-quote, Sharp, js-yaml dan follow-redirects. Versi aplikasi dipertahankan pada tahap migrasi ini; audit CI tetap menjadi gate dan akan gagal sampai advisory terkait ditangani. Angka advisory merupakan hasil pemeriksaan pada tanggal laporan, bukan penilaian eksploitabilitas setiap fitur.

Build Next masih mempertahankan pengaturan lama `typescript.ignoreBuildErrors`; karena itu typecheck wajib tetap dijalankan sebagai gate terpisah. Native Android/iOS, transaksi hardware NFC/print, pairing WhatsApp, integrasi provider berbayar, Docker Linux dan pipeline CI pada runner remote belum diuji langsung.

## Tahap berikutnya menuju template standar

1. Stabilkan tiga tes integrasi dan lakukan pembaruan keamanan dependency dengan pengujian kompatibilitas tersendiri.
2. Verifikasi image Docker pada Linux dan native mobile pada perangkat/emulator.
3. Ekstrak core reusable: identity, authorization, tenancy, konfigurasi, logging dan API contract. Pindahkan backend bisnis Next ke Go per modul sambil mempertahankan parity tests.
4. Pisahkan modul/branding/data demo Mizu atau Paddy dari core, lalu sediakan bootstrap dan contoh aplikasi minimal untuk project baru.

Panduan harian ada pada [monorepo.md](monorepo.md); arah arsitektur tetap mengikuti blueprint dan spec workspace foundation di `docs/superpowers/`.

Log lengkap, inventaris dan salinan lockfile asal tersedia sementara di `/tmp/mizu-workspace-migration/`. Log utama: `tests-reviewed.log`, `lint-reviewed.log`, `types-reviewed.log`, `build-ocr-resolution.log`, `frozen-reviewed.log`, `integration-utf8.log`, `integration-baseline-reproduction.log`, `standalone-resources.log`, `app-lifecycle-results.json`, `mobile-export.log`, `dependency-audit.json` dan `preservation-final.json`.
