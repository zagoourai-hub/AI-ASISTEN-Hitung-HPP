---
name: test-live
description: Uji semua fitur web project secara LIVE di Chrome asli (headed) lewat Playwright MCP. Gunakan saat diminta test live, uji fitur di browser beneran, smoke test, regression manual otomatis, atau cek apakah aplikasi jalan end-to-end. Agent navigasi app, klik/isi/submit, screenshot tiap step, lapor bug dengan bukti.
allowed-tools: Read Write Bash(npx *) Bash(npm *) Bash(node *) Bash(curl *) Bash(find *) Bash(cat *)
disable-model-invocation: true
argument-hint: "all | <fitur/halaman tertentu>  (mis. 'all' atau 'alur checkout')"
---

# Test Live — Agentic Browser Testing di Chrome Asli

Agent menjalankan aplikasi web di **Chrome headed (kelihatan)**, lalu **benar-benar memakai** app seperti user: navigasi, klik, isi form, submit, cek hasil. Bukan menjalankan test script statis — ini eksplorasi live yang menemukan bug nyata, dengan bukti screenshot tiap langkah.

> Manual-only (`disable-model-invocation: true`). Skill ini mengendalikan browser & berinteraksi dengan app live — jalankan hanya saat diminta eksplisit.

## Prasyarat (cek di awal, perbaiki otomatis)

```
1. Playwright MCP aktif?       → kalau tidak, beri tahu bigboss aktifkan + /mcp
2. Chrome terpasang?           → kalau belum, jalankan: npx playwright install chrome
3. Dev server jalan?           → cek http://localhost:3000 (atau port project).
                                  Kalau mati, minta bigboss: npm run dev
4. Backend/API jalan?          → fitur yang butuh API perlu backend hidup
5. Database ter-seed?          → butuh data login/uji? sarankan npx prisma db seed
```

Gunakan **mode live Chrome**: Playwright MCP dengan `--browser chrome` (headed), jendela Chrome terbuka & kelihatan saat agent kerja. Kalau `.mcp.json` masih headless, beri tahu bigboss ganti ke `--browser chrome` untuk menonton.

## Alur Kerja

```
1. DISCOVER  → petakan semua fitur/halaman/alur yang bisa diuji
2. PLAN      → susun test scenario (happy path + edge + error)
3. SETUP     → siapkan kredensial uji + data (dari seed/.env)
4. EXECUTE   → buka Chrome, jalankan tiap skenario LANGKAH demi langkah
5. CAPTURE   → screenshot tiap step penting + saat error
6. VERIFY    → cek hasil sesuai harapan (URL, teks, state, network)
7. REPORT    → tabel hasil + bug + bukti screenshot + langkah reproduksi
```

---

## Step 1 — DISCOVER (petakan fitur)

Sebelum menguji, temukan apa yang ADA untuk diuji. Sumber:

```bash
# Routes frontend (Next.js App Router)
find frontend/src/app -name 'page.tsx' -o -name 'route.ts' 2>/dev/null

# Endpoint backend (NestJS controllers)
find backend/src -name '*.controller.ts' 2>/dev/null

# Endpoint AI service
find ai-service -name '*.py' -path '*endpoints*' -o -name 'routes' 2>/dev/null
```

Lalu susun daftar fitur yang bisa diuji, mis:
```
- Auth: register, login, logout, lupa password, refresh session
- Dashboard: load data, filter, pagination
- CRUD <resource>: create, read, update, delete
- Form: validasi, submit sukses, submit gagal
- Navigasi: semua link di navbar/sidebar
- Proteksi route: akses halaman protected tanpa login → redirect
- Alur bisnis utama: (checkout, booking, generate, dll sesuai project)
```

> Mode `all` → uji semua. Mode `<fitur>` → fokus alur yang disebut bigboss.

## Step 2 — PLAN (skenario per fitur)

Untuk tiap fitur, susun skenario uji: **happy path**, **edge case**, **error case**.

```
Fitur: Login
  ✓ Happy : email+password valid → redirect /dashboard, session aktif
  ⚠ Edge  : email valid password salah → pesan error, tetap di /login
  ⚠ Edge  : field kosong → validasi muncul, tombol submit tidak proses
  ⚠ Error : email belum terdaftar → pesan jelas (tidak bocorkan "email tidak ada" untuk security)
```

## Step 3 — SETUP (kredensial & data uji)

- Ambil kredensial uji dari seed data / `.env` (mis. ADMIN seeded). JANGAN pakai kredensial production asli.
- Kalau butuh akun baru, daftar via flow register dulu.
- Data uji: pakai yang dari `prisma db seed`. Kalau kosong, sarankan seed dulu.
- Catat baseline: aplikasi load tanpa error console di awal?

## Step 4 — EXECUTE (jalankan di Chrome live)

Pakai Playwright MCP untuk mengontrol Chrome. Untuk tiap langkah:

```
Tindakan via MCP:
- browser_navigate      → buka URL
- browser_snapshot      → ambil struktur halaman (accessibility tree) untuk tahu elemen
- browser_click         → klik tombol/link
- browser_type          → isi input
- browser_select_option → pilih dropdown
- browser_take_screenshot → bukti visual
- browser_console_messages → tangkap error console
- browser_network_requests → cek API call (status, payload)
```

Aturan eksekusi:
- **Satu skenario penuh dari awal sampai akhir**, jangan loncat-loncat.
- Tunggu elemen muncul (auto-wait) sebelum interaksi — jangan asumsi langsung ada.
- Setelah aksi, **verifikasi hasil** (lihat Step 6) sebelum lanjut.
- Screenshot di: titik awal, setelah aksi penting, dan SAAT ada error/anomali.
- Kalau satu skenario gagal total, lanjut ke skenario berikutnya (jangan berhenti semua).

## Step 5 — CAPTURE (bukti)

Simpan screenshot ke `test-live/.work/` (tambahkan ke `.gitignore`):
```
test-live/.work/
├── login-happy-01-form.png
├── login-happy-02-success.png
├── login-error-01-wrong-pass.png
└── ...
```
Setiap bug WAJIB punya screenshot bukti.

## Step 6 — VERIFY (cek hasil)

Untuk tiap aksi, verifikasi multi-sinyal (jangan cuma "kelihatan oke"):

```
□ URL       → berubah/redirect sesuai harapan?
□ Konten    → teks/elemen yang diharapkan muncul? (mis. "Selamat datang")
□ State     → data tersimpan? list bertambah? badge update?
□ Network   → API call return 2xx? tidak ada 4xx/5xx tak terduga?
□ Console   → tidak ada error JS / warning serius?
□ Visual    → layout tidak rusak, tidak ada elemen overlap/hilang?
```

Klasifikasi tiap skenario: ✅ PASS / ❌ FAIL / ⚠️ WARNING (jalan tapi ada masalah minor).

## Step 7 — REPORT

```
## 🧪 Test Live Report — <project> (<tanggal>)

Lingkungan: Chrome <versi>, localhost:3000, <jumlah> skenario
Ringkasan: ✅ PASS 18  ❌ FAIL 3  ⚠️ WARNING 2

| # | Fitur          | Skenario              | Hasil | Detail                              |
|---|----------------|-----------------------|-------|-------------------------------------|
| 1 | Login          | happy path            | ✅    | redirect /dashboard, session OK     |
| 2 | Login          | wrong password        | ✅    | error message muncul                |
| 3 | Checkout       | submit order          | ❌    | tombol "Bayar" tidak respons (FAIL) |
| 4 | Dashboard      | pagination            | ⚠️    | page 2 lambat (~4s)                 |

### 🐛 Bug Ditemukan

**BUG #1 — [HIGH] Tombol "Bayar" tidak berfungsi**
- Halaman: /checkout
- Langkah reproduksi:
  1. Login sebagai user
  2. Tambah item ke cart → /checkout
  3. Isi data → klik "Bayar"
- Diharapkan: order tersubmit, redirect /success
- Aktual: tidak ada respons, console error: `TypeError: ...`
- Bukti: test-live/.work/checkout-fail-01.png
- Dugaan penyebab: handler onClick tidak ter-bind / API /orders return 500

### Rekomendasi
- [HIGH] Fix handler tombol Bayar (lihat BUG #1)
- [MED] Optimasi query pagination dashboard (N+1?)
```

Untuk tiap bug: severity, halaman, **langkah reproduksi**, expected vs actual, screenshot, dugaan penyebab.

---

## Mode

- `test-live all` → discover + uji SEMUA fitur (smoke test menyeluruh).
- `test-live <fitur>` → fokus alur tertentu (mis. `test-live alur checkout`).
- `test-live regression` → uji ulang fitur yang sebelumnya FAIL setelah diperbaiki.

## Larangan

- JANGAN test pakai kredensial/data production asli — selalu data uji/seed.
- JANGAN lakukan aksi destruktif tak terkontrol di environment yang ada data penting (hapus massal, dll) tanpa konfirmasi.
- JANGAN klaim PASS tanpa verifikasi multi-sinyal (URL + konten + network + console).
- JANGAN berhenti di skenario pertama yang gagal — lanjutkan, kumpulkan semua bug.
- JANGAN perbaiki kode otomatis di skill ini — ini skill UJI. Laporkan bug; perbaikan via skill `debug`/`frontend`/`backend`.
- JANGAN klaim bug tanpa screenshot bukti + langkah reproduksi.
- JANGAN test di Chrome headless kalau diminta "live" — pakai headed (`--browser chrome`).

## Task

$ARGUMENTS
