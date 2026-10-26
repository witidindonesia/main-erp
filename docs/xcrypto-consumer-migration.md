# Migrasi seluruh pemakai x/crypto

26 Oktober 2026. Seluruh pekerjaan lokal, tanpa commit, push, deployment, atau perubahan database kerja.

`golang.org/x/crypto` dan `golang.org/x/net` kini tidak ada dalam graph module backend, termasuk dependency tidak langsung. Autentikasi dan wholesale memakai bcrypt dari subset kompatibilitas lokal. Excelize dan pdfcpu memakai snapshot source lokal dengan import crypto/HTML diarahkan ke subset tersebut. Source OpenPGP/SSH/QUIC tidak disertakan. Format password, algoritma crypto, API dependency, serta resource Excel/PDF dipertahankan.

Ini menambah ownership source dependency: `apps/backend/third_party` wajib ikut repository baru. Snapshot bukan rilis upstream baru atau alias module untuk mengubah hasil scanner. Asal canonical, checksum module, lisensi dan SHA256 1.117 file dicatat; hanya perubahan import dan gofmt diperbolehkan oleh pemeriksa provenance. Lihat [kontrak pemeliharaan dan pembaruan](../apps/backend/third_party/README.md).

| Gate aplikasi, govulncheck 1.9.0 / database resmi | Hasil |
| --- | --- |
| Source + tes macOS/arm64 | 0 temuan, exit 0 |
| Source + tes Linux/amd64 | 0 temuan, exit 0 |
| Module-only aplikasi dari cmd/api | 0 temuan, exit 0 |
| Binary API Linux/amd64, CGO=0, `-s -w` | 0 temuan, exit 0 |
| Binary migrator Linux/amd64, CGO=0, `-s -w` | 0 temuan, exit 0 |
| Full graph `go list -m all` | Tidak ada x/crypto maupun x/net |

Tidak ada ignore, filter output, versi publik palsu, perubahan database advisory, atau penghilangan flag stripping. `pnpm backend:audit`, Makefile, GitHub CI dan GitLab CI menjalankan pemeriksaan yang sama. Perintah itu juga memverifikasi source snapshot dan menjalankan scan paket **canonical upstream asli** untuk mempertahankan cakupan advisory setelah perpindahan import. Probe canonical yang sementara masih menampilkan satu peringatan metadata OpenPGP historis, dengan nol paket terimpor terdampak dan exit 0. Probe ini bukan dependency aplikasi; angka nol module-only di atas adalah hasil graph aplikasi yang benar-benar dimigrasikan.

Kompatibilitas dibuktikan melalui hash password lama 2a/2b/2y, cost 10, password panjang dan Unicode pada batas 72 byte, serta bcryptjs frontend. Excel terenkripsi yang dibuat memakai Excelize upstream asli berhasil dibaca; password salah ditolak. Tes import/export Excel, PDF, upstream vectors compat, seluruh unit Go, integrasi PostgreSQL pada database disposable, lint/vet/gofmt, dan build native lulus. Download module dari cache kosong serta cross-build Linux dengan layout manifest Docker lulus. Image Docker dan CI remote tidak dijalankan karena pekerjaan lokal dan Docker CLI tidak tersedia.

Pemeriksaan JavaScript ulang menemukan advisory baru Zod dan body-parser. Zod seluruh workspace diperbarui ke 4.6.6 dan body-parser 2.x ke 2.4.0. Shadcn diperbarui ke rilis resmi 4.22.1 yang mendukung Zod 4; pemakai CLI Expo juga diuji melalui schema plugin/MCP yang benar-benar terpasang. Tidak ada package Zod 3 tersisa. Audit pnpm seluruh severity kembali nol. Forge tetap memakai snapshot fix PR yang dipin commit dan SHA512 sebagaimana [laporan sebelumnya](node-forge-audit-resolution.md).

Verifikasi workspace: 5.473 tes frontend lulus (10 skip bawaan), 11 tes mobile, 18 tes tooling, 133 paket tes Go dengan integrasi aktif dan 9 paket tes upstream compat lulus. Typecheck frontend/mobile, lint, checksum keempat module Go, kesamaan manifest route, build produksi frontend/backend dan pembacaan konfigurasi CLI Expo lulus. Smoke `pnpm dev` menghasilkan health/readiness/login 200, tanpa sesi 401, serta port web/Go tertutup setelah Ctrl+C.

Satu pengulangan integrasi paralel sempat deadlock pada tes migrasi SPA yang mengubah DDL global. Runner integrasi, Makefile dan GitLab kini memakai `-p=1` agar paket berbagi database disposable secara serial; seluruh tes tetap dijalankan. Perintah default diuji ulang sesudah perubahan ini. Path module privat juga dibuat valid sebagai `mizu.local/compat`, sehingga `go mod verify` lulus; tidak ada cache hash yang direkayasa.

Review independen tidak menemukan Critical/Important. Catatan minor yang ditunda: daftar import probe canonical masih dipelihara manual. Saat menambah pemakai package dependency lokal, perbarui probe agar advisory package tersebut ikut terpantau; cakupan seluruh import aplikasi saat ini sudah diperiksa reviewer. Peringatan metadata pada probe referensi tidak dihitung sebagai temuan aplikasi karena probe berada di module sementara terpisah dan graph aplikasi telah terbukti bebas x/crypto. Risiko bila pemeliharaan ini terlewat ialah cakupan advisory paket baru yang tidak lengkap.

Untuk mengulang:

```sh
pnpm install --frozen-lockfile
pnpm audit
pnpm backend:audit
pnpm backend:test
TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55439/mizu_migration_utf8 pnpm test:integration
pnpm lint
pnpm check-types
pnpm build
```

Integrasi memerlukan `TEST_DATABASE_URL` yang menunjuk database tes disposable; jangan memakai database kerja. Bukti pemeriksaan lokal tahap ini tersimpan sementara di `/tmp/mizu-crypto-migration/`.
