---
name: analyze-prd
description: Analisis PRD secara menyeluruh. Gunakan saat diminta review PRD, validasi task list, cek kelengkapan PRD, temukan ambiguitas, edge case yang hilang, atau bandingkan PRD dengan implementasi aktual.
allowed-tools: Read Write Bash(find *) Bash(grep *)
argument-hint: "review | validate | gap | all  target: path/to/PRD.md"
---

# PRD Analysis Skill

## Mode Analisis

Skill ini punya 3 mode — gunakan sesuai argumen:

| Argumen | Mode | Keterangan |
|---------|------|-----------|
| `review` | Review PRD | Kelengkapan, ambiguitas, edge case |
| `validate` | Validasi Task List | Atomik, tag, urutan fase |
| `gap` | Gap Analysis | PRD vs implementasi aktual |
| `all` | Semua mode | Jalankan ketiganya sekaligus |

---

## Mode 1: Review PRD (Kelengkapan & Kualitas)

Saat mode `review`, analisis PRD dengan checklist berikut:

### 1.1 Kelengkapan Struktur

Cek apakah PRD memiliki semua section ini:

```
[ ] Overview & tujuan produk
[ ] Target user & persona
[ ] Business model (freemium / subscription / one-time / dll)
[ ] Feature list dengan prioritas (MoSCoW atau fase)
[ ] Tech stack (FE / BE / AI / Infra)
[ ] Task list dengan breakdown atomik
[ ] Non-functional requirements (performa, keamanan, skalabilitas)
[ ] Out of scope (apa yang TIDAK dibangun)
[ ] Success metrics / KPI
[ ] Timeline / milestone
```

### 1.2 Deteksi Ambiguitas

Tandai kalimat/fitur yang ambigu — contoh pola yang harus ditandai:

```
❌ "User bisa melihat data" → siapa user? data apa? format apa?
❌ "Sistem harus cepat" → berapa ms? endpoint mana?
❌ "Dashboard yang informatif" → informasi apa saja?
❌ "Bisa diintegrasikan dengan AI" → provider mana? endpoint apa?
❌ "Notifikasi real-time" → via apa? websocket? SSE? polling?
```

### 1.3 Temukan Missing Edge Case

Untuk setiap fitur utama, tanyakan:

```
- Apa yang terjadi jika input kosong / null?
- Apa yang terjadi jika user tidak punya akses?
- Apa yang terjadi jika network timeout?
- Apa yang terjadi jika data duplikat?
- Apa yang terjadi jika third-party service down?
- Apa yang terjadi jika user concurrent (race condition)?
- Apa yang terjadi jika file upload terlalu besar?
- Apa batas maksimum data? (pagination, rate limit)
```

### 1.4 Deteksi Scope Creep Risk

Tandai fitur yang berpotensi scope creep:

```
⚠️  Fitur yang tidak ada di fase awal tapi implisit dibutuhkan
⚠️  Fitur yang ketergantungannya belum didefinisikan
⚠️  Fitur yang butuh third-party berbayar tanpa estimasi cost
⚠️  Fitur yang butuh data training / dataset eksternal
```

### Output Format Mode Review

```markdown
## PRD Review Report

### ✅ Kelengkapan Struktur
| Section | Status | Catatan |
|---------|--------|---------|
| Overview | ✅ Ada | - |
| Target User | ⚠️ Kurang detail | Tidak ada persona spesifik |
| Tech Stack | ❌ Tidak ada | - |

### 🔴 Ambiguitas Ditemukan
1. **[Baris X]** "..." → Tidak jelas karena ...
   💡 Saran: Ubah menjadi "..."

### 🟡 Missing Edge Case
1. **Fitur Login** → Tidak ada handling untuk akun yang di-suspend
2. **Upload CV** → Tidak ada batas ukuran file yang didefinisikan

### 🟠 Scope Creep Risk
1. **Fitur X** → Implisit butuh fitur Y yang belum ada di PRD

### 📊 Skor Kelengkapan PRD
- Struktur: X/10
- Kejelasan: X/10
- Edge Case Coverage: X/10
- **Total: X/30**
```

---

## Mode 2: Validasi Task List

Saat mode `validate`, cek setiap task di PRD dengan aturan berikut:

### 2.1 Standar Atomik

Setiap sub-task HARUS:

```
✅ Satu file, satu fungsi, atau satu konfigurasi per task
✅ Bisa diselesaikan dalam 1 sesi kerja (< 4 jam)
✅ Punya output yang jelas dan terverifikasi
✅ Tidak ambigu — judul task sudah cukup untuk dikerjakan

❌ "Buat auth module" → terlalu besar, harus dipecah
✅ "Buat file src/modules/auth/auth.module.ts"
✅ "Buat class RegisterDto di src/modules/auth/dto/register.dto.ts"
✅ "Buat method register() di auth.service.ts"
```

### 2.2 Tag Compliance

Setiap task HARUS punya satu tag:

```
[FE]  → Frontend (Next.js, React, UI)
[BE]  → Backend (NestJS, API, database)
[AI]  → AI Service (FastAPI, LLM, prompt)
[OPS] → DevOps (Docker, CI/CD, Coolify, env)
```

### 2.3 Urutan Fase

Cek logical ordering:

```
✅ Database schema sebelum API endpoint
✅ API endpoint sebelum frontend integration
✅ Auth sebelum protected routes
✅ Docker setup sebelum deployment
✅ Environment config sebelum service yang butuh config itu
```

### 2.4 Dependency Check

Untuk setiap task, cek:

```
- Apakah dependency task sudah ada di fase sebelumnya?
- Apakah ada circular dependency antar task?
- Apakah ada task yang missing (implied tapi tidak ditulis)?
```

### Output Format Mode Validate

```markdown
## Task List Validation Report

### 🔴 Task Tidak Atomik (harus dipecah)
1. **[Fase 1 > Auth]** "Buat auth module" → Terlalu besar
   💡 Pecah menjadi:
   - [BE] Buat file `src/modules/auth/auth.module.ts`
   - [BE] Buat class `LoginDto` di `src/modules/auth/dto/login.dto.ts`
   - [BE] Buat method `login()` di `auth.service.ts`

### 🟡 Task Tanpa Tag
1. **[Fase 2 > Dashboard]** "Setup chart komponen" → Missing tag
   💡 Tambahkan: [FE]

### 🟠 Urutan Fase Bermasalah
1. **[Fase 1]** "Buat endpoint /api/users" muncul sebelum "Buat Prisma schema User"
   💡 Pindahkan Prisma schema ke sebelum endpoint

### 🔵 Task Missing (Implied tapi tidak ada)
1. Tidak ada task untuk setup Docker Compose
2. Tidak ada task untuk setup environment variables (.env.example)

### 📊 Skor Task List
- Atomik: X/10
- Tag Compliance: X/10
- Logical Order: X/10
- Completeness: X/10
- **Total: X/40**
```

---

## Mode 3: Gap Analysis (PRD vs Implementasi)

Saat mode `gap`, bandingkan PRD dengan kode aktual di project:

### 3.1 Cara Baca Implementasi

```bash
# Scan struktur project
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.py" | grep -v node_modules | grep -v .next | grep -v generated

# Cek endpoint yang ada
grep -r "@Get\|@Post\|@Put\|@Patch\|@Delete" backend/src --include="*.ts" -l

# Cek halaman frontend
find frontend/src/app -name "page.tsx" | grep -v node_modules
```

### 3.2 Mapping PRD vs Implementasi

Untuk setiap fitur di PRD, cek status implementasi:

```
✅ Implemented   → Ada di PRD dan ada di kode
⚠️ Partial       → Ada di PRD, sebagian ada di kode
❌ Not Started   → Ada di PRD, tidak ada di kode
🔵 Extra         → Tidak ada di PRD, tapi ada di kode (undocumented)
```

### 3.3 API Contract Validation

Cek apakah endpoint yang diimplementasi sesuai PRD:

```
- Method (GET/POST/PUT/PATCH/DELETE)
- Path (/api/v1/...)
- Request body / params
- Response shape
- Auth requirement (public / protected)
```

### Output Format Mode Gap

```markdown
## Gap Analysis Report

### Feature Coverage

| Fitur | PRD | Implementasi | Status | Catatan |
|-------|-----|-------------|--------|---------|
| Auth - Register | ✅ | ✅ | ✅ Done | - |
| Auth - Login | ✅ | ⚠️ | ⚠️ Partial | JWT belum httpOnly |
| Dashboard | ✅ | ❌ | ❌ Not Started | - |
| Upload CV | ✅ | ❌ | ❌ Not Started | - |

### 🔵 Fitur Undocumented (ada di kode, tidak di PRD)
1. `GET /api/health` → Tidak ada di PRD (OK — health check)
2. `POST /api/admin/reset` → Tidak ada di PRD ⚠️ perlu didokumentasikan

### 📊 Progress Summary
- Total fitur di PRD: X
- Implemented: X (X%)
- Partial: X (X%)
- Not Started: X (X%)
- Undocumented: X
```

---

## Mode: All

Jalankan ketiga mode secara berurutan:
1. **Review** → output PRD Review Report
2. **Validate** → output Task List Validation Report
3. **Gap** → output Gap Analysis Report

Gabungkan semua output dalam satu dokumen markdown dan simpan ke `prd-analysis-report.md` di root project.

---

## Cara Baca PRD

Sebelum analisis, baca file PRD dengan urutan:

1. Cari file PRD di project:
   ```bash
   find . -name "PRD.md" -o -name "prd.md" -o -name "*.prd.md" | grep -v node_modules
   ```
2. Jika ada argumen path → gunakan path tersebut
3. Jika tidak ada → tanya ke user lokasi PRD

## Task

$ARGUMENTS
