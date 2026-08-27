# Laporan Bug

## 2026-08-28 - Fokus tidak berpindah ke field kas invalid

- Status: open
- URL: `http://localhost:3000/`
- Langkah reproduksi transaksi:
  1. Buka Dashboard dan scroll ke section `Catatan Kas`.
  2. Biarkan field `Nominal (IDR)` kosong.
  3. Tekan tombol `Tambah transaksi`.
- Langkah reproduksi saldo:
  1. Isi `Saldo awal (IDR)` dengan `-1`.
  2. Tekan tombol `Simpan saldo`.
- Hasil aktual: kedua pesan error tampil, tetapi fokus tetap pada tombol submit, bukan field invalid.
- Hasil yang diharapkan: fokus berpindah ke field invalid agar pengguna keyboard dapat segera memperbaiki input.
- Bukti: Playwright mobile 390x844 pada `2026-08-27T18:02:53` dan `2026-08-27T18:03:18`; tidak ada request `POST /api/v1/cash-transactions` atau `PATCH /api/v1/cash-balance` saat input invalid. Screenshot: `screenshots/cash-tracking-mobile-validation-errors.png`.
- Catatan: kedua field memakai `aria-invalid`; `Saldo awal` terhubung ke error melalui `aria-describedby`, sedangkan `Nominal` belum memiliki `aria-describedby`.
