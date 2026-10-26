# Audit dependency seluruh workspace bersih

Audit backend Go lanjutan tersedia dalam [laporan govulncheck](go-dependency-security-audit.md), termasuk status OpenPGP module-only yang tidak diimpor.

Tanggal pemeriksaan: 24 Oktober 2026. Perubahan hanya lokal di Mizu; tanpa Git, commit, push, deployment, atau perubahan database kerja.

## Hasil audit

| Cakupan | Sebelum: moderate / low | Sesudah: critical / high / moderate / low |
| --- | ---: | ---: |
| Seluruh workspace, production dan development | 27 / 2 | 0 / 0 / 0 / 0 |
| Production | 5 / 1 | 0 / 0 / 0 / 0 |

`pnpm audit`, `pnpm audit --json` dan `pnpm audit --prod --json` exit 0. CI sekarang menjalankan `pnpm audit` tanpa filter production atau threshold severity. Tidak ada advisory ignore/mute, perubahan metadata versi buatan, atau penurunan gate. Ini adalah hasil registry saat pemeriksaan, bukan jaminan tidak akan ada advisory baru. Audit pnpm mencakup ekosistem JavaScript workspace; bukan pengganti analisis kerentanan Go atau pengujian penetrasi aplikasi.

## Perubahan

| Dependency | Versi yang digunakan | Penanganan |
| --- | --- | --- |
| Quill | quill-next 2.2.6 | Ganti dependency/import dan Snow CSS dengan fork terbitan yang memperbaiki escaping ekspor HTML. |
| decode-uri-component | 0.5.1 | Implementasi decoder aman; patch satu baris query-string 7.1.3 untuk membaca default export ESM. |
| uuid dari Xcode | 11.1.1 | Tetap menyediakan CommonJS dan v4 untuk ID proyek iOS. |
| Hono | 4.13.13 | Perbaikan dalam major yang sama. |
| @hono/node-server | 1.19.17 | Pertahankan major 1. |
| qs | 6.16.1 | Patch parser query. |
| ip-address | 10.7.4 | Perbaikan dalam major yang sama. |
| postcss-selector-parser | 7.1.7 | Patch parser CSS. |
| music-metadata | 11.16.1 | Pertahankan major 11 untuk Baileys/WA. |
| Vitest dan @vitest/ui | 4.1.12 | Selaraskan frontend/mobile dan mocker tanpa migrasi major. |

[Advisory Quill](https://github.com/advisories/GHSA-v3m3-f69x-jf25) belum memiliki rilis resmi perbaikan. Penggantian ke Quill Next didasarkan pada source paket terbitan dan tes yang benar-benar gagal pada Quill lama: formula menghasilkan `img[onerror]`, sedangkan URL video menyuntikkan atribut `onmouseover`. Keduanya menjadi teks/atribut yang di-escape setelah migrasi. Tes juga memverifikasi HTML heading, bold, list dan link, toolbar, callback edit/kosong, serta cleanup komponen. Kontrak HTML editor tetap dipertahankan.

Query-string tetap 7.1.3 karena Expo Router menggunakan namespace CommonJS `parse/stringify`; migrasi langsung ke query-string 10 mengubah API ekspornya. Patch hanya menambahkan `.default` pada import decoder. URL Unicode, spasi, array, input rusak dan roundtrip state/path Expo diuji. Input 2.000 byte persen tidak valid yang sebelumnya melewati timeout 5 detik kini selesai puluhan milidetik dalam subprocess dengan batas waktu. Patch dikunci hash di lockfile dan disalin Dockerfile sebelum frozen install.

Pin node-forge dari tahap sebelumnya tetap menggunakan commit dan SHA512 yang sama; tes RSA/Expo signing tetap aktif. **Source tersebut masih snapshot PR kontributor yang belum di-merge, bukan rilis resmi aman.** Lihat [catatan node-forge](node-forge-audit-resolution.md). Setelah regenerasi lockfile, periksa kembali integrity tarball karena pnpm 9 dapat menghilangkannya; cold install tahap ini memakai checksum yang dipertahankan.

## Verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| Audit default CI dan JSON full/production | Semua severity nol, exit 0 |
| Root frozen install | Lulus |
| Cold install manifest-only + patch, store kosong | Lulus 50,4 detik; install scripts normal |
| Tes kompatibilitas cold install | 6/6: decoder/navigasi, bounded parsing, Xcode UUID, Baileys audio, RSA, Expo signing |
| pnpm test | 15 tooling, 5.473 web, 11 mobile dan paket Go lulus; 10 tes web tetap skip sesuai baseline |
| pnpm test:integration | Seluruh suite Go lulus di PostgreSQL disposable |
| pnpm lint / pnpm check-types | Lulus |
| Expo export --platform all | Android, iOS dan web lulus |
| Generator route dan database | Manifest route identik, 619 file SQL tidak berubah |
| Review independen | Tidak ada temuan correctness/security yang menghalangi |
| pnpm build | Next+Go lulus dengan env database dummy dan heap 4 GB sesuai CI |
| Dev web+Go dan standalone HTTP | Readiness/login/static 200, auth tanpa sesi 401; Ctrl+C menutup port tes |
| Standalone resource | PDFKit/font, Sharp native, Tesseract worker dan WASM offline lulus |

Bukti sementara: `/tmp/mizu-audit-clean/`, termasuk snapshot `before/`, `audit-before.json`, `audit-after.json`, `audit-prod.json`, `audit-final-cli.log`, `quill-red.log`, `decoder-red.log`, `editor-tests.log`, `cold-install.log`, `cold-compatibility.log`, `tests.log`, `tooling-final.log`, `integration.log`, `lint.log`, `types.log`, `build.log`, `expo-export.log`, `standalone-resources.log`, dan `app-lifecycle-results.json`.

Workflow CI remote dan image Docker/Linux belum dijalankan; cold install diuji di macOS. Ekspor mobile tidak membuktikan APK/IPA atau perilaku perangkat fisik. Pairing WA, perangkat NFC/printer, dan OCR dengan model bahasa tidak dijalankan. Pemeriksaan Baileys memproses WAV lokal tanpa koneksi WhatsApp.
