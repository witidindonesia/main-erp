# POS print worker

Worker ini menyediakan render tiket ke terminal dan contoh pemrosesan antrean API. **Adapter printer fisik belum diimplementasikan.** Mode normal memakai adapter mock dan tetap menandai pekerjaan sebagai tercetak; gunakan mode tersebut hanya pada antrean pengujian.

## Pratinjau tanpa API

Dari root repository:

```bash
pnpm pos:print-worker --sample
```

Mode `--sample` menampilkan satu tiket contoh tanpa menghubungi API, mengubah status pekerjaan, atau mengirim ke printer.

## Pratinjau antrean lokal

```bash
cp services/pos-print-worker/.env.example services/pos-print-worker/.env
```

Isi `POS_PRINT_WORKER_TOKEN` sesuai konfigurasi aplikasi, lalu jalankan:

```bash
node --env-file=services/pos-print-worker/.env services/pos-print-worker/pos-print-worker.mjs --dry-run --once
```

`--dry-run` membaca antrean dan menampilkan tiket tanpa mengubah status pekerjaan, termasuk ketika render gagal. `--once` menghentikan proses setelah satu polling. Tanpa `--once`, pratinjau diulang sesuai interval; tiket pending dapat tampil berulang karena statusnya tidak diubah.

| Variabel | Fungsi/default |
| --- | --- |
| `PRINT_QUEUE_BASE_URL` | Origin aplikasi, default `http://localhost:3000`. |
| `POS_PRINT_WORKER_TOKEN` | Token header `x-pos-print-worker-token`, sesuai konfigurasi aplikasi. |
| `PRINT_QUEUE_STATION` | Filter station; kosong berarti semua station. |
| `PRINT_QUEUE_INTERVAL_MS` | Interval polling, default `3000` ms. |

Jika environment sudah diekspor ke shell, gunakan `pnpm pos:print-worker --dry-run --once`. Mode normal tanpa `--dry-run` mempertahankan alur `mark_printing` → mock → `mark_printed`, atau `mark_failed` ketika ada kesalahan. Hubungkan adapter printer nyata sebelum memakai alur tersebut untuk pencetakan operasional.

Tes CLI dapat dijalankan dengan `node --test scripts/pos-print-worker.test.mjs` dari root. Tes memakai server API sementara di localhost dan tidak membutuhkan database atau printer.
