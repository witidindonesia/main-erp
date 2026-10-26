# Verifikasi perbaikan integrasi dan keamanan dependency

Pembaruan 24 Oktober 2026: gate audit high/critical sekarang lulus dengan source perbaikan yang dipin commit dan integrity. Lihat [penyelesaian node-forge](node-forge-audit-resolution.md) untuk hasil dan caveat snapshot PR yang belum di-merge. Catatan patch lokal/red gate di bawah adalah rekaman tahap 23 Oktober, bukan status terkini.

Tanggal: 23 Oktober 2026. Pekerjaan dilakukan lokal setelah migrasi monorepo. Tidak menjalankan perintah Git, commit, push, deployment, atau mengubah database kerja. Semua tes database memakai cluster PostgreSQL disposable milik verifikasi pada port 55439.

## Perbaikan integrasi

Ketiga kegagalan awal direproduksi sebelum perubahan. Seluruh tes pada paket terkait dan seluruh suite integrasi Go kemudian lulus.

| Tes | Akar masalah dan perbaikan |
| --- | --- |
| `TestResendingSameRoleKeepsIamRoles` | Tes mengasumsikan IAM role `finance_staff` sudah di-seed, padahal database hasil migrasi saja belum memilikinya. Fixture sekarang membuat role di dalam transaksi tes. Assertion mempertahankan custom IAM role saat save dengan role yang sama dan menggantinya saat role berubah tetap dipertahankan. Tidak mengubah sinkronisasi role aplikasi. |
| `TestOrderAlerts` | Fixture belum menyiapkan pesan inbound dari penerima, sehingga gateway menolak pengiriman sesuai kebijakan known-contact. Fixture sekarang memasukkan pesan inbound di transaksi tes. Kebijakan anti-spam tidak dilonggarkan; suite WhatsApp termasuk penolakan kontak asing tetap lulus. |
| `TestRewardsAndRedemptions` | DELETE reward yang direferensikan menghasilkan SQLSTATE `23001` dari FK RESTRICT, sedangkan handler hanya mengenali `23503`. Keduanya sekarang menghasilkan HTTP 409 dengan pesan konflik yang sudah ada, tanpa menghapus redemption. |

## Pembaruan dependency

Audit mencakup seluruh workspace, termasuk dependency development. Versi patch diperiksa terhadap registry resmi dan advisory. Tidak melakukan upgrade major framework, mengganti versi React web/mobile, menghapus fitur, menyembunyikan advisory, atau memalsukan nomor versi.

| Dependency | Versi yang dipakai setelah perbaikan |
| --- | --- |
| Next.js, `@next/env`, `eslint-config-next` | 16.4.3 |
| DOMPurify | 3.4.17 |
| Sharp, termasuk transitif gateway WA | 0.35.5 |
| js-yaml major 4 | 4.3.2 |
| brace-expansion pada minimatch 10 / major 4–5 | 5.0.12 |
| shell-quote | 1.12.0 |
| compression | 1.8.2 |
| follow-redirects | 1.16.1 |
| fast-uri major 3 | 3.1.9 |
| undici major 7 | 7.30.1 |
| ip-address major 10 | 10.3.1 |
| proxy-addr | 2.0.8 |
| `@modelcontextprotocol/sdk` | 1.32.1 |
| Vite untuk Vitest web/mobile | 8.2.4 |
| node-forge | 1.4.0 dengan patch lokal tervalidasi |

Vite dinyatakan eksplisit sebagai dev dependency web/mobile karena override range saja masih mempertahankan auto-installed peer 8.2.2 yang rentan. Framework Expo dan versi Vitest tetap dipertahankan. Empat dependency langsung lama yang berubah versi adalah Next, `@next/env`, `eslint-config-next`, dan DOMPurify; pembaruan lain diarahkan melalui root override pada dependency transitif.

### Patch lokal node-forge

[GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) belum memiliki rilis patch upstream. Rilis registry terbaru saat pemeriksaan tetap 1.4.0. Karena itu dipakai hunk produksi dari [usulan upstream PR #1152](https://github.com/digitalbazaar/forge/pull/1152), commit `ceba344`, melalui `pnpm.patchedDependencies` dan file `patches/node-forge@1.4.0.patch`. Ini merupakan patch lokal berdasarkan usulan upstream, bukan klaim rilis resmi atau patch yang telah diterima maintainer.

Patch memeriksa jumlah elemen ASN.1 pada `DigestAlgorithm` bersarang, selain pemeriksaan `DigestInfo` luar yang sudah ada. Tes `scripts/node-forge-security.test.mjs` memakai dependency yang benar-benar di-resolve oleh tooling signing Expo. Tes terlebih dahulu gagal pada paket asli, lalu lulus pada paket terpasang yang dipatch: signature SHA256 yang valid, dengan atau tanpa NULL parameter, tetap diterima; tambahan elemen bersarang ditolak.

Patch dicatat dengan hash pada lockfile dan ikut disalin sebelum instalasi di Dockerfile. Frozen install dan tes regresi patch lulus. Ketika upstream menerbitkan perbaikan, upgrade paket, hapus patch lokal, kemudian ulangi tes regresi dan audit.

## Hasil audit tanpa pengecualian

| Cakupan | Critical | High | Moderate | Low |
| --- | ---: | ---: | ---: | ---: |
| Seluruh workspace sebelum perbaikan | 6 | 29 | 49 | 8 |
| Seluruh workspace setelah perbaikan | 0 | 1 | 27 | 2 |
| Production setelah perbaikan | 0 | 1 | 5 | 1 |

**Satu high yang tersisa adalah node-forge di atas.** Audit registry menilai nomor versi upstream, sehingga tidak mengenali mitigasi lokal yang dibuktikan oleh tes. `pnpm audit` masih keluar dengan status gagal dan gate CI `pnpm audit --prod --audit-level=high` tetap merah. Tidak ada ignore, pengecualian severity, penurunan gate, atau perubahan nomor versi untuk membuat hasil tampak hijau. Jangan menyatakan workspace bebas advisory. Advisory moderate/low yang tersisa berada di luar prioritas critical/high tahap ini.

Advisory braces yang muncul pada laporan migrasi sebelumnya [ditarik pada 23 Oktober 2026](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) dan tidak muncul pada audit registry baru; tidak ditutupi melalui konfigurasi lokal.

## Verifikasi fitur dan build

| Pemeriksaan | Hasil |
| --- | --- |
| Frozen install root | Lulus; patch dan lockfile dapat diterapkan ulang |
| `pnpm test` | Lulus: 10 tes tooling/security/lifecycle, 5.469 tes web, 11 tes mobile dan paket Go unit; 10 tes web tetap skip seperti baseline |
| `pnpm test:integration` | Lulus seluruh suite Go pada database disposable, termasuk tiga tes yang sebelumnya gagal |
| `pnpm lint` | Lulus ESLint, go vet dan gofmt |
| `pnpm check-types` | Lulus web dan mobile |
| `pnpm build` | Lulus Next 16.4.3 dan binary Go; heap build dibatasi 4 GB sesuai konfigurasi Docker/CI |
| Expo export semua platform | Lulus bundle Android/iOS dan static web export |
| Generator dan route manifest | Lulus; hasil tetap identik |
| SQL | Seluruh 619 file tetap identik; tidak menambah/mengubah migrasi |
| Dev web+Go | Readiness/login/health 200; auth melalui proxy 401 tanpa sesi; Ctrl+C menutup port proses milik tes |
| Standalone terisolasi | Readiness/login/static assets 200; PDFKit/font, Sharp, worker Tesseract dan WASM offline lulus |
| Adapter lokal | Native binding NFC dapat dimuat; Sharp transitif Baileys dapat dimuat pada versi 0.35.5 |
| Review independen | Tidak ada temuan critical/high yang memerlukan perubahan kode |

Port web smoke adalah 3001 karena 3000 dipakai proses lain; proses tersebut dibiarkan. Database dan proses aplikasi sementara milik verifikasi dihentikan setelah selesai.

Build masih mengeluarkan diagnostic dynamic-rendering untuk halaman yang memakai cookies dan peringatan tracing storage; build berhasil dan source terkait tidak diubah pada tahap ini. Peringatan peer React dari Swagger UI yang sudah ada tetap terlihat. Typecheck terpisah tetap wajib karena konfigurasi lama `ignoreBuildErrors` masih dipertahankan.

Image Docker/Linux belum dibangun karena Docker CLI/daemon tidak tersedia. Native APK/IPA, OCR lengkap dengan model bahasa, transaksi kartu NFC/printer, pairing WA dan provider eksternal tidak diuji langsung; verifikasi lokal di atas tidak menyatakan cakupan tersebut telah terpenuhi.

Log dan snapshot sumber sebelum perubahan tersedia di `/tmp/mizu-stabilization/`: `integration-red.log`, `integration-targeted-green.log`, `integration-all.log`, `forge-red.log`, `forge-green.log`, `tests.log`, `lint.log`, `types.log`, `build.log`, `mobile-export.log`, `frozen-install.log`, `standalone-resources.log`, `app-lifecycle-results.json`, `audit-before-all.json`, `audit-final-all.json`, `audit-final-prod.json`, dan `preservation.json`.
