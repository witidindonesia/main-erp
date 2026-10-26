# Penghapusan source OpenPGP dan batas hasil audit

**Status terbaru 26 Oktober 2026:** [migrasi seluruh pemakai x/crypto](xcrypto-consumer-migration.md) sudah menghilangkan x/crypto dari graph aplikasi; source, module-only dan binary Linux aplikasi bersih. Hasil merah di bawah adalah rekaman tahap sebelumnya.

24 Oktober 2026. Dikerjakan lokal, tanpa Git/commit/push/deployment atau perubahan database kerja.

**Status: penghapusan source selesai, target semua audit nol belum tercapai.** Source dan paket yang diimpor bersih, tetapi module-only serta binary API Linux stripped tetap exit 3 dengan GO-2026-5932. Tidak ada advisory yang diabaikan.

## Perubahan nyata

`golang.org/x/crypto` diperbarui dari 0.57.0 ke pseudo-version resmi:

```text
v0.58.1-0.20261009200856-99e4382b128e
commit 99e4382b128eecca08735c9604400ba7260a4cdf
h1:4PUeQapnhFgX40eHUep8qLkQtrQ1q2WCq4omZd4EToU=
```

Ini [commit penghapusan OpenPGP resmi](https://go.googlesource.com/crypto/+/99e4382b128eecca08735c9604400ba7260a4cdf), terkait [proposal Go #81227](https://github.com/golang/go/issues/81227). Rilis tagged terbaru 0.58.0 masih memuat OpenPGP saat diperiksa; source commit yang dipilih tidak memuat file atau direktori OpenPGP. Pseudo-version ini bukan rilis stabil baru. Identitas module, versi asli, dan checksum tetap autentik; tidak ada replace/fork lokal atau alias mirror untuk menghindari pencocokan advisory.

Seluruh **16 file Go** dalam bcrypt, blowfish, md4, ripemd160 dan ocsp dibandingkan byte demi byte dengan versi lama dan identik. Paket tersebut diperlukan oleh autentikasi, Excelize, dan pdfcpu. Pembaruan upstream membutuhkan x/sync 0.24.0, x/sys 0.49.0, serta x/text 0.43.0. Source bisnis dan format password tidak diubah.

Tes baru membuktikan:

- Paket OpenPGP tidak dapat diimpor menggunakan dependency terpilih dan mode module readonly. Tes gagal pada versi lama, lalu lulus setelah update; penambahan kembali dependency OpenPGP akan terdeteksi.
- Hash bcrypt lama dengan prefix 2a, 2b dan 2y tetap diterima, password salah/hash rusak ditolak.
- Hash baru tetap 2b/cost10, termasuk password lebih dari 72 byte dan Unicode yang terpotong pada batas byte. Hash Go diverifikasi memakai bcryptjs yang benar-benar terpasang pada frontend.
- Login, perubahan password, wholesale, laporan/import Excel, PDF dan seluruh suite Go tetap lulus.

## Mengapa dua audit masih merah

[Advisory resmi GO-2026-5932](https://vuln.go.dev/ID/GO-2026-5932.json) masih mencantumkan semua versi `golang.org/x/crypto` sebagai terdampak, dengan `introduced: 0` tanpa event `fixed`. Tidak ada versi canonical yang dapat keluar dari rentang ini, walaupun source OpenPGP sudah dihapus resmi. Hal itu dibuktikan dalam proyek probe terpisah dan pada module Mizu sesudah pembaruan.

| Pemeriksaan akhir | Hasil | Exit |
| --- | --- | ---: |
| Source + tes macOS/arm64 | 0 kode, 0 paket terimpor, 1 module-only | 0 |
| Source + tes Linux/amd64 | 0 kode, 0 paket terimpor, 1 module-only | 0 |
| Module-only dari cmd/api | 1 GO-2026-5932 | 3 |
| Binary API native | 0 kode/paket, 1 module-only | 0 |
| Binary migrator native | Tidak ada kerentanan | 0 |
| Binary API Linux produksi, -s -w | 1 GO-2026-5932 dari fallback metadata | 3 |
| Binary migrator Linux produksi, -s -w | Tidak ada kerentanan | 0 |

Govulncheck 1.9.0 tidak memperoleh simbol pada API Linux stripped. Source scanner secara eksplisit beralih ke presisi module dan menghasilkan simbol wildcard dari database. Output ini tidak membuktikan OpenPGP ter-link. Output merah tetap dipertahankan; flag stripping produksi dan scanner tidak diubah.

Agar module-only canonical benar-benar nol, diperlukan metadata upstream yang mengakui batas penghapusan, atau penghapusan x/crypto secara nyata dari seluruh dependency fungsional. Mengganti bcrypt saja tidak cukup: Excelize memakai MD4/RIPEMD160 dan pdfcpu memakai OCSP. Migrasi seluruh rantai tersebut merupakan perubahan arsitektur/ownership kriptografi, bukan pembaruan versi biasa. Mengganti nama module, mengubah database scanner, atau menjadikan kode crypto sebagai fork lokal hanya untuk menghilangkan pencocokan advisory tidak diterapkan.

## Verifikasi dan bukti

Unit Go dan seluruh integrasi PostgreSQL lulus; lint/vet/gofmt, build API+migrator native/Linux, checksum module, serta smoke web+Go juga lulus. Health/readiness/login 200, auth tanpa sesi 401, Ctrl+C menutup port tes. Semua source/test lama dan 619 file SQL identik; manifest route API tidak berubah. Database disposable dihentikan setelah pemeriksaan.

Review independen tidak menemukan regresi keamanan/correctness pada perubahan atau tes. Reviewer juga menegaskan bahwa **dua gate merah di atas tetap merupakan syarat penerimaan yang belum terpenuhi**. Tidak menyatakan tugas audit total nol sudah tuntas.

Bukti sementara: `/tmp/mizu-openpgp-resolution/`, terutama `xcrypto-removed.json`, `issue-81227.json`, `upstream-module-audit.log`, `openpgp-red.log`, `password-before.log`, `targeted-final.log`, `unit.log`, `integration.log`, `lint.log`, `build-native.log`, `build-linux.log`, `audit-source.log`, `audit-source-linux.log`, `audit-module.log`, `audit-binary-*.log`, `mod-verify.log`, dan `app-lifecycle-results.json`.

Workflow remote, image Docker/Linux, perangkat mobile dan transaksi hardware tidak dijalankan. Tidak ada perubahan frontend/mobile atau dependency JS pada tahap ini.
