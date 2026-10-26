# Layanan opsional

Layanan di folder ini dijalankan terpisah dari frontend, backend, dan mobile. Tidak ada layanan yang otomatis menyala lewat `pnpm dev`, dan template tidak menyertakan konfigurasi deployment PM2.

| Layanan | Kegunaan | Panduan |
| --- | --- | --- |
| Gateway WhatsApp | OTP, notifikasi, dan penerusan pesan masuk melalui Baileys. | [Setup dan environment](wa-gateway/README.md) |
| POS NFC bridge | Membaca UID kartu dari reader PC/SC dan meneruskannya melalui WebSocket lokal. | [Setup perangkat](pos-nfc-bridge/README.md) |
| POS print worker | Pratinjau tiket dan contoh pemrosesan antrean; adapter printer masih mock. | [Pratinjau dan batasan](pos-print-worker/README.md) |

Pasang dependensi dari root dengan `pnpm install --frozen-lockfile`. Gunakan Node sesuai [.nvmrc](../.nvmrc). Contoh environment tersedia pada setiap layanan; salin menjadi `.env` hanya untuk layanan yang digunakan.

Perintah root `pnpm wa-gateway`, `pnpm pos:nfc-bridge`, dan `pnpm pos:print-worker` membaca environment proses. File `.env` layanan dimuat secara eksplisit dengan perintah `node --env-file=...` di masing-masing panduan; menyalin file saja tidak memuatnya otomatis.

Nama paket `@mizu/*` masih dipertahankan untuk kompatibilitas workspace. Gateway WhatsApp membutuhkan koneksi dan akun WhatsApp; bridge NFC membutuhkan perangkat reader. Mode `--sample` print worker tidak membutuhkan koneksi API atau printer.
