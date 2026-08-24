---
name: test-fix-loop
description: Loop otonom uji-perbaiki fitur web MVP. Gunakan saat diminta test semua fitur lalu auto-fix bug sampai bersih, self-healing, atau loop engineering test-fix. Agent uji live di Chrome → temukan bug/data dummy bermasalah → fix yang aman → re-test → ulang sampai hijau atau batas iterasi. Bug desain/bisnis → stop & tanya.
allowed-tools: Read Write Bash(npx *) Bash(npm *) Bash(node *) Bash(pip *) Bash(python3 *) Bash(curl *) Bash(git *) Bash(find *) Bash(cat *)
disable-model-invocation: true
argument-hint: "all | <fitur tertentu>  (mis. 'all' untuk seluruh MVP)"
---

# Test-Fix Loop — Self-Healing MVP Testing

Orchestrator otonom: uji semua fitur live → temukan bug → perbaiki yang aman → re-test → ulang, sampai semua hijau ATAU batas iterasi. Menggabungkan skill `test-live` (uji) + `debug`/`frontend`/`backend` (fix) dalam loop terkontrol.

> Manual-only. Skill ini mengubah kode secara otonom dalam loop — jalankan hanya saat diminta eksplisit, dan pastikan project sudah di-commit dulu (agar mudah revert).

## ⚠️ Konfigurasi Loop (terkunci)

```
Mode fix        : HYBRID — bug ringan & jelas auto-fix; bug berisiko konfirmasi
Maks iterasi    : 5
Bug desain/bisnis: STOP + lapor + tunggu konfirmasi bigboss
Guard no-progress: stop kalau jumlah bug tidak berkurang 2 iterasi berturut-turut
```

## ✅ Kondisi STOP (semua harus terpenuhi untuk dinyatakan sukses)

Loop dinyatakan **sukses dan berhenti** kalau SEMUA kondisi berikut terpenuhi:

```
□ 1. Semua acceptance criteria lolos via browser test (Playwright live Chrome)
□ 2. Tidak ada console error fatal di browser (warning boleh, error tidak)
□ 3. Tidak ada failed network request untuk flow utama (semua API return 2xx)
□ 4. npm run test:e2e sukses (kalau ada test suite E2E di project)
□ 5. npm run typecheck sukses (npx tsc --noEmit, zero error)
□ 6. npm run build sukses (tidak ada build error)
□ 7. Maksimal 5 iterasi belum terlampaui
```

Verifikasi wajib di akhir SETIAP iterasi sebelum keputusan lanjut/stop:

```bash
# Jalankan berurutan — semua harus hijau
npm run typecheck      # atau: npx tsc --noEmit
npm run build          # pastikan tidak ada build error
npm run test:e2e       # kalau ada di package.json
```

Kalau salah satu dari 7 kondisi belum terpenuhi → **lanjut iterasi** (selama < 5).
Kalau semua terpenuhi → **STOP sukses** ✅.
Kalau iterasi ke-5 habis tapi belum semua terpenuhi → **STOP, lapor kondisi mana yang belum hijau**.

## Prasyarat (cek & siapkan di awal)

```
1. Git bersih?        → sarankan `git commit` dulu sebelum loop (safety net revert)
2. Playwright MCP     → aktif + mode live Chrome (--browser chrome)
3. Dev server         → frontend + backend jalan (npm run dev)
4. Database ter-seed  → data uji tersedia (npx prisma db seed)
5. Chrome             → terpasang (npx playwright install chrome bila perlu)
```

Kalau salah satu tidak siap → beri tahu bigboss, jangan mulai loop.

---

## Alur Loop

```
SEBELUM LOOP:
  - Catat baseline: commit hash sekarang (untuk revert kalau perlu)
  - Discover semua fitur MVP (via skill test-live Step 1)

LOOP (iterasi 1..5):
  ┌─────────────────────────────────────────────────────────┐
  │ 1. TEST    → jalankan test-live ke semua fitur (atau scope)│
  │ 2. TRIAGE  → klasifikasi tiap bug: AUTO | CONFIRM | BLOCK  │
  │ 3. STOP?   → tidak ada bug → KELUAR loop (sukses)          │
  │ 4. FIX     → perbaiki bug AUTO; bug CONFIRM → tanya dulu   │
  │ 5. VERIFY  → re-test HANYA fitur yang baru di-fix          │
  │ 6. GUARD   → cek progress & iterasi                        │
  └─────────────────────────────────────────────────────────┘

SETELAH LOOP:
  - Report akhir: status tiap fitur + fix yang dilakukan + sisa bug
```

---

## Step: TRIAGE (klasifikasi bug)

Tiap bug yang ditemukan `test-live` diklasifikasi:

### 🟢 AUTO — fix langsung (jelas & aman)
- Handler `onClick`/`onSubmit` tidak ter-bind / salah nama
- Import salah / path keliru / typo variabel
- Field hilang di DTO/response, `select` Prisma kurang
- Data dummy/seed kurang atau tidak konsisten → tambah/perbaiki seed
- State tidak update setelah mutation (lupa invalidate query)
- Loading/error state tidak ada
- Validasi Zod/class-validator typo
- Env var kurang di `.env.example`
- Bug yang akar masalahnya tunggal & jelas dari error console/network

### 🟡 CONFIRM — lapor rencana fix, tunggu OK
- Fix yang mengubah lebih dari ~3 file
- Fix yang menyentuh auth/guard/security
- Fix yang mengubah skema database (migration)
- Fix yang bisa mengubah behavior fitur lain
- Ada >1 cara fix yang masuk akal (perlu pilihan)

### 🔴 BLOCK — STOP & tunggu bigboss
- Butuh keputusan desain/bisnis (alur tidak jelas, requirement ambigu)
- Butuh kredensial/API key/akses eksternal
- Bug di dependency pihak ketiga
- Konflik dengan PRD atau standar global
- Akar masalah tidak bisa ditentukan dengan percaya diri

> Saat ada bug BLOCK: hentikan loop, laporkan bug + konteks + opsi, tunggu konfirmasi. JANGAN tebak.

## Step: FIX (aturan perbaikan)

- Fix akar masalah, BUKAN gejala. Jangan akali biar test lolos.
- **DILARANG fix dengan melemahkan:** hapus/lewati validasi, matikan guard auth, comment-out fitur yang error, `// @ts-ignore`, longgarkan tipe jadi `any`, skip assertion. Ini membuat test hijau palsu.
- Ikut standar global + skill domain (frontend/backend/ai-service).
- Satu bug → satu fix terfokus. Jangan refactor besar di tengah loop.
- Catat tiap fix: bug apa → file diubah → kenapa.

## Step: VERIFY (re-test fix)

- Setelah fix, **re-test fitur yang baru diperbaiki** lebih dulu (pastikan benar-benar sembuh).
- Lalu di iterasi berikutnya, test-live penuh lagi untuk pastikan fix tidak merusak fitur lain (regression).
- Fix yang ternyata tidak menyelesaikan bug → jangan diulang dengan cara sama; eskalasi ke CONFIRM/BLOCK.

## Step: GUARD (anti loop liar)

Cek di akhir tiap iterasi — URUT:

```
□ Semua 7 kondisi STOP terpenuhi?           → STOP sukses ✅
□ Iterasi >= 5?                              → STOP, lapor kondisi yang belum hijau
□ Jumlah bug sama 2 iterasi beruntun?        → STOP (no-progress), eskalasi ke bigboss
□ Fix bikin kondisi mundur / bug baru?       → revert fix itu, eskalasi ke CONFIRM
□ Semua sisa masalah = BLOCK?               → STOP, lapor (tidak bisa lanjut tanpa bigboss)
□ npm run typecheck / build gagal?          → wajib fix dulu sebelum lanjut iterasi
```

---

## Report

### Saat STOP karena sukses
```
## ✅ Test-Fix Loop Selesai — Semua Hijau

Iterasi: 3/5
Fitur diuji: 18 | Semua PASS

Fix yang dilakukan:
- [Iter 1] Login: handler submit tidak ter-bind → bind onSubmit (auth/login-form.tsx)
- [Iter 1] Dashboard: query tanpa invalidate → tambah invalidateQueries
- [Iter 2] Checkout: seed data produk kosong → tambah 5 produk di seed.ts
- [Iter 2] Profile: avatar field hilang di response → tambah ke select

Status: siap. Disarankan commit + jalankan /test-live regression sekali lagi.
```

### Saat STOP karena BLOCK / batas iterasi
```
## ⚠️ Test-Fix Loop Berhenti — Butuh Konfirmasi

Iterasi: 5/5 (batas tercapai)
Diperbaiki: 6 bug | Sisa: 2

🔴 BLOCK — butuh keputusan bigboss:
1. [Checkout] Flow pembayaran: integrasi Midtrans belum ada API key.
   → Butuh: MIDTRANS_SERVER_KEY di .env
2. [Booking] Aturan double-booking tidak jelas di PRD.
   → Opsi A: tolak overlap | Opsi B: waitlist. Pilih yang mana?

Tidak melanjutkan tanpa konfirmasi. Kode sudah di titik aman (commit <hash>).
```

---

## Mode

- `test-fix-loop all` → loop seluruh fitur MVP.
- `test-fix-loop <fitur>` → loop fokus alur tertentu (mis. `test-fix-loop auth`).
- Selalu HYBRID + maks 5 iterasi (terkunci).

## Larangan

- JANGAN lampaui 5 iterasi.
- JANGAN fix dengan melemahkan validasi/security/menghapus fitur agar test lolos.
- JANGAN lanjut loop kalau ada bug BLOCK — stop & tanya bigboss.
- JANGAN tebak fix untuk bug yang akar masalahnya tidak jelas — eskalasi.
- JANGAN auto-fix yang menyentuh auth/security/migration tanpa konfirmasi (itu CONFIRM).
- JANGAN commit otomatis — serahkan ke bigboss (tapi sarankan commit sebelum mulai).
- JANGAN klaim "hijau" tanpa test-live penuh terakhir tanpa regression.
- JANGAN lanjut kalau guard no-progress menyala — eskalasi, bukan paksa ulang.

## Task

$ARGUMENTS
