# Laporan Bug

## 2026-08-28 - Fokus tidak berpindah ke field kas invalid

- Status: fixed
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
- Perbaikan: validasi kini memfokuskan field penyebab error pada kedua form.
- Verifikasi perbaikan: Playwright 2026-08-28 di Dashboard desktop 1440x900 dan mobile 390x844; fokus masing-masing berada pada `opening-balance` dan `cash-amount`, error tampil, console error `0`, tanpa request `POST` atau `PATCH` saat input invalid, dan tanpa overflow horizontal. Bukti: `screenshots/cash-tracking-validation-focus-desktop-1440x900.png` dan `screenshots/cash-tracking-validation-focus-mobile-390x844.png`.

## 2026-08-28 - Komposisi resep mobile sulit dibaca

- Status: fixed
- URL: `http://localhost:3000/products/4df031cf-643a-454e-9a19-2b5a2217079c`
- Langkah reproduksi:
  1. Buat resep dengan bahan Es Batu 200 gram, Gula 20 gram, dan Teh Celup 1 pcs.
  2. Buka detail produk pada viewport 390x844.
  3. Jalankan Hitung HPP.
- Hasil aktual: nilai takaran dan satuan tabel menempel, misalnya `200.000000gram`; floating action bar dapat menutupi nilai HPP pada posisi scroll tertentu.
- Hasil yang diharapkan: kolom takaran dan satuan terbaca terpisah serta konten utama tidak tertutup aksi fixed.
- Bukti: `screenshots/hpp-es-teh-mobile-390x844.png`.
- Perbaikan: kolom takaran dan satuan kini memiliki spacing eksplisit; action bar menjadi in-flow pada mobile dan tetap fixed pada desktop.
- Verifikasi perbaikan: Playwright pada produk `Es Kopi Uji E2E`, desktop 1440x900 dan mobile 390x844. Kolom `20.000000` dan `gram` terbaca terpisah, tidak ada overflow halaman, ringkasan HPP berada di atas action bar, dan console error `0`. Bukti: `screenshots/hpp-mobile-layout-fixed-390x844.png` dan `screenshots/hpp-layout-fixed-desktop-1440x900.png`.
