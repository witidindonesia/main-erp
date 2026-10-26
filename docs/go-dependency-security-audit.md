# Audit keamanan dependency backend Go

**Status terbaru 26 Oktober 2026:** [migrasi seluruh pemakai x/crypto](xcrypto-consumer-migration.md) sudah menghilangkan x/crypto dari graph aplikasi; source, module-only dan binary Linux aplikasi bersih. Hasil merah di bawah adalah rekaman tahap sebelumnya.

Pembaruan lanjutan: [penghapusan source OpenPGP resmi](openpgp-source-removal.md). Source sudah dihapus dan kompatibilitas password teruji; metadata module-only dan API Linux stripped tetap melaporkan satu advisory tanpa fixed range. Detail versi di bawah adalah rekaman tahap audit sebelumnya.

Tanggal: 24 Oktober 2026. Perubahan lokal di Mizu; tanpa Git, commit, push, deployment, atau perubahan database kerja.

## Hasil

`govulncheck@v1.9.0` memakai database resmi `https://vuln.go.dev`, pembaruan tercatat 21 Oktober 2026. Source dan tes dianalisis pada macOS/arm64 serta target Linux/amd64, tanpa ignore atau filter advisory.

| Konfigurasi source + test | Kerentanan pada jalur kode | Hanya paket terimpor | Hanya module | Exit |
| --- | ---: | ---: | ---: | ---: |
| Baseline Go 1.26.0 dari go.mod lama | 33 | 9 | 12 | 3 |
| Baseline Go 1.27.0 lokal | 14 | 4 | 3 | 3 |
| Sesudah perbaikan, Go 1.27.3 macOS | 0 | 0 | 1 | 0 |
| Sesudah perbaikan, Go 1.27.3 Linux | 0 | 0 | 1 | 0 |

Angka antar-toolchain berbeda karena standard library mengikuti compiler yang dipakai, bukan hanya dependency di go.mod. Semua temuan pada kode dan paket yang diimpor sudah diperbaiki. **Bukan klaim seluruh module bebas advisory:** pemeriksaan module-only masih exit 3 dengan satu advisory OpenPGP yang tidak digunakan.

## Perubahan

- Minimum Go, image builder Docker, dan image GitLab menjadi **1.27.3**. GitHub mengambil versi dari go.mod. Compiler lokal global tetap 1.27.0; mekanisme toolchain Go memilih 1.27.3 otomatis saat bekerja pada module ini. Patch standard library mencakup HTTP, TLS, parser MIME dan validasi sertifikat; lihat [riwayat rilis resmi Go](https://go.dev/doc/devel/release#go1.27.3).
- `golang.org/x/net` **0.58.0 → 0.60.0**, versi minimum yang memperbaiki lima advisory HTTP/2 (GO-2026-6603, 6610, 6611, 6612, 6617).
- Excelize **2.11.0 → v2.11.1-0.20261003002531-6258dcebc4e2**. Rilis tagged terbaru 2.11.0 masih rentan saat diperiksa; source memakai commit resmi upstream [6258dcebc4e2a2aed985c38a08098dfd908521d1](https://github.com/qax-os/excelize/commit/6258dcebc4e2a2aed985c38a08098dfd908521d1), sudah memuat enam perbaikan advisory GO-2026-6684, 6685, 6687, 6688, 6689 dan 6695. Ini **pseudo-version upstream, bukan rilis stabil 2.11.1**. Ganti ke rilis stabil aman setelah tersedia dan ulangi pemeriksaan.
- Pembaruan Excelize membutuhkan `mscfb` **1.0.8** dan `efp` **0.0.2**. Dependency aplikasi lainnya dipertahankan. `go mod tidy` menata ulang QR ke blok dependency langsung sesuai pemakaian; tidak menghapus fitur.

Identitas module asli tetap dipertahankan, tanpa fork/replace atau metadata versi buatan. Checksum Excelize di go.sum:

```text
h1:YJqtDi2ShO2fh/qMNO0MyPHXiki9h1OH3i3zGRunGRQ=
```

`go mod verify` lulus. Regresi `TestRejectOversizedSpreadsheetRow` menjalankan **ParseMatrix dan ParseCSVParts yang dipakai aplikasi** pada workbook kecil dengan row 2.147.483.647. Sebelum pembaruan: parser matrix melewati timeout 5 detik, CSV tidak mengembalikan penolakan yang semestinya. Sesudahnya: keduanya menolak dengan ErrMaxRows dalam sekitar 0,01 detik masing-masing. Tes menggunakan subprocess berbatas waktu agar regresi tidak menggantung suite. Tes roundtrip laporan Excel dan parity ExcelJS juga tetap lulus. Source bisnis, route API dan 619 file SQL tidak diubah.

## Advisory yang tetap tercatat

[GO-2026-5932](https://pkg.go.dev/vuln/GO-2026-5932) menyangkut keluarga package `golang.org/x/crypto/openpgp`, yang tidak terawat dan belum memiliki versi perbaikan upstream. Backend memakai x/crypto untuk bcrypt dan kebutuhan kriptografi dependency lain. Graph impor lengkap, termasuk tes (821 path), tidak mengimpor keluarga OpenPGP. Source scan macOS/Linux menyatakan nol paket rentan yang diimpor.

Tidak menghapus bcrypt, mengganti hash password, mengecualikan advisory, atau menyunting database untuk menutupi temuan. Scan module-only sengaja disimpan dengan hasil merah satu advisory. Gate CI menggunakan analisis source dengan tes yang merupakan mode standar govulncheck; gate bukan klaim semua module nol.

## Pemeriksaan binary dan batas presisi

| Artifact | Hasil govulncheck binary |
| --- | --- |
| API native, simbol tersedia | 0 pada kode/paket, 1 module-only; exit 0 |
| Migrator native | Tidak ada kerentanan, exit 0 |
| API Linux produksi `-s -w` | 1 OpenPGP, exit 3, fallback ke presisi module |
| Migrator Linux produksi `-s -w` | Tidak ada kerentanan, exit 0 |
| API Linux diagnostik tanpa stripping | 0 pada kode/paket, 1 module-only; exit 0 |

Pada API Linux produksi, metadata module tersedia tetapi scanner tidak memperoleh simbol. Source resmi scanner (`internal/buildinfo/additions_scan.go` dan `internal/vulncheck/binary.go`) menyatakan binary semacam ini diperiksa memakai semua simbol rentan yang dikenal dari module. Karena itu output tidak membuktikan OpenPGP ter-link. Binary diagnostik dari source, compiler dan module yang sama memiliki **44.704 simbol, nol simbol OpenPGP**; module kedua binary identik. Flag produksi tetap dipertahankan dan output merahnya tidak diabaikan. Keterbatasan scanner ini harus diperhitungkan bila kelak menambah gate audit binary stripped.

## Pemeriksaan ulang

| Pemeriksaan | Hasil |
| --- | --- |
| Audit source + tes macOS/Linux | Exit 0, nol kode/paket rentan |
| Audit module-only | Exit 3, satu OpenPGP tidak diimpor tanpa fix upstream |
| `pnpm backend:audit` | Lulus menjalankan audit Go yang dipin dari root workspace |
| Unit Go `go test ./... -count=1` | Lulus, integration tidak diaktifkan |
| `pnpm test:integration` | Seluruh suite lulus di PostgreSQL disposable |
| `make -C apps/backend lint` | go vet dan gofmt lulus |
| Build API + migrator | Native dan cross-build Linux/amd64 lulus, compiler 1.27.3 |
| `go mod verify` | Semua module terverifikasi |
| Route generator / source / SQL | Route identik, semua source bisnis lama identik, 619 SQL tidak berubah |
| `pnpm dev` smoke | Go health dan web ready/login 200, auth tanpa sesi 401; Ctrl+C menutup port tes |
| pnpm frozen install dan audit JS | Lulus, tidak ada advisory JS; lockfile pnpm identik |
| Review independen | Tidak ada temuan correctness/security yang menghalangi; marker exit tes awal sudah diselaraskan melalui rerun yang lulus |

## Menjalankan kembali

Dari root monorepo:

```bash
pnpm backend:audit
```

Dari apps/backend:

```bash
make audit
# Untuk melihat advisory module yang tidak diimpor:
go run golang.org/x/vuln/cmd/govulncheck@v1.9.0 -test -show verbose ./...
# Mode module-only tidak menerima pola ./...; gunakan entrypoint yang berisi file Go:
cd cmd/api
go run golang.org/x/vuln/cmd/govulncheck@v1.9.0 -scan module
```

GitHub dan GitLab CI kini menjalankan source audit dengan versi scanner yang sama. CI remote dan image Docker/Linux tidak dijalankan karena pekerjaan lokal; cross-build Linux dan audit artifact berjalan lokal, sedangkan smoke HTTP dijalankan pada native macOS. Pengujian web/mobile lengkap dari tahap sebelumnya tidak diulang karena tidak ada perubahan source atau dependency JS; audit dan frozen install JS diulang.

Bukti sementara berada di `/tmp/mizu-go-security/`: snapshot `before/`, baseline audit, `audit-native.log`, `audit-linux.log`, `audit-modules.log`, `audit-command.log`, `xlsx-red.log`, `xlsx-green.log`, `unit.log`, `integration.log`, `lint.log`, `build-native.log`, `build-linux.log`, `mod-verify.log`, `audit-binary-*.log`, `binary-symbol-comparison.json`, `app-lifecycle-results.json`, dan `js-audit.log`.
