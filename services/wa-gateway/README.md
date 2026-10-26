# Gateway WhatsApp

Layanan Baileys untuk mengirim pesan dan meneruskan pesan masuk ke aplikasi. Gateway berjalan terpisah dari `pnpm dev` dan menyimpan sesi pada direktori `.session/` secara lokal setelah dijalankan; folder sesi tidak masuk Git.

## Konfigurasi dan menjalankan

Dari root repository, setelah dependensi workspace terpasang:

```bash
cp services/wa-gateway/.env.example services/wa-gateway/.env
```

Isi `WA_GATEWAY_TOKEN` dengan token sendiri dan samakan dengan konfigurasi integrasi gateway pada aplikasi. Lalu jalankan:

```bash
node --env-file=services/wa-gateway/.env services/wa-gateway/src/server.js
```

Jika variabel sudah diekspor ke environment shell, gunakan `pnpm wa-gateway`. `pnpm wa-gateway:pair` merupakan alias kompatibilitas: proses yang sama menampilkan QR di terminal ketika sesi belum terhubung. Scan QR menggunakan akun WhatsApp yang akan dipakai untuk integrasi.

| Variabel | Fungsi/default |
| --- | --- |
| `WA_GATEWAY_TOKEN` | Wajib untuk autentikasi API dan penerusan pesan ke aplikasi. |
| `WA_GATEWAY_PORT` | Port HTTP, default `3471`. Listener utama menggunakan `127.0.0.1`. |
| `APP_INBOUND_URL` | Endpoint pesan masuk, default `http://127.0.0.1:3000/api/wa/inbound`. Sesuaikan jika frontend memakai port lain. |
| `WA_GATEWAY_EXTRA_HOSTS` | Alamat listener tambahan, dipisahkan koma. Kosongkan untuk development lokal. |
| `WA_SESSION_DIR` | Direktori sesi; default `.session` di folder layanan ini. Gunakan path absolut jika mengubahnya. |
| `WA_LOG_LEVEL` | Level log Baileys, default `warn`. |
| `WA_MIN_GAP_MS` / `WA_MAX_GAP_MS` | Rentang jeda antarpesan; default `1500` / `3500` ms. |

Environment lengkap ada di [.env.example](.env.example). File tersebut tidak memuat token siap pakai.

## Pemeriksaan

```bash
curl http://127.0.0.1:3471/health
```

Endpoint health mengembalikan `200` jika WhatsApp terhubung, atau `503` jika belum. `/qr`, `/send`, dan `/send-image` memerlukan header `x-gateway-token`. Menjalankan gateway memulai koneksi WhatsApp; layanan ini tidak diperlukan untuk pengujian tooling root.

Template tidak menyertakan target server maupun konfigurasi PM2 khusus klien. Catatan operasional lama tersedia sebagai [arsip](../../docs/archive/README.md).
