# Dokumentasi ERP Template

Gunakan panduan aktif di bawah untuk setup template. Dokumen historis dan data referensi dipisahkan melalui indeks agar tidak dianggap sebagai instruksi operasional yang berlaku sekarang.

## Panduan aktif

| Dokumen | Isi |
| --- | --- |
| [README proyek](../README.md) | Pengenalan template, instalasi awal, dan perintah utama. |
| [Workspace](monorepo.md) | Environment, database, development, pengujian, dan build Docker opsional. |
| [Layanan opsional](../services/README.md) | Gateway WhatsApp, bridge NFC, dan print worker. |

## Catatan dependensi

Dokumen ini menjelaskan alasan patch/override dan source yang dipertahankan. Hasil tes atau audit di dalamnya adalah bukti historis pada tanggal yang dicantumkan; jalankan pemeriksaan kembali untuk mengetahui kondisi terbaru.

- [Patch dan audit workspace](workspace-security-audit-clean.md).
- [Resolusi node-forge](node-forge-audit-resolution.md).
- [Migrasi consumer x/crypto](xcrypto-consumer-migration.md).
- [Audit Go sebelumnya](go-dependency-security-audit.md) dan [penghapusan OpenPGP](openpgp-source-removal.md).

## Referensi aplikasi — menunggu audit aplikasi

Dokumen domain berikut tetap tersedia sebagai referensi implementasi. Path, brand, endpoint, dan status fitur di dalamnya belum divalidasi ulang dalam penataan root ini:

- [Arsitektur](ARSITEKTUR-SISTEM.md) dan [konvensi frontend](frontend-conventions.md).
- [POS](pos/), [purchasing](purchasing/), [CRM](crm/), [HRIS](hris/), [inventory](inventory/), [KPI](kpi/), dan [XP](xp-system/).
- [Operasional](ops/) dan [keamanan query database](security/db-query-allowlist.md).
- [Kredit foto produk](product-photos-credits.md).

## Arsip dan data referensi

[Indeks arsip](archive/README.md) mengelompokkan riwayat proyek Paddy/Mizu/Arkiv, epic, rancangan, laporan QA, dan data referensi. Nama folder lama dipertahankan agar tautan yang sudah ada tidak putus sebelum audit aplikasi.

Arsip bukan checklist deployment template, bukan daftar fitur yang sudah diverifikasi saat ini, dan bukan data yang otomatis diimpor pada instalasi baru.
