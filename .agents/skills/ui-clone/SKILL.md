---
name: ui-clone
description: Tiru UI/UX sedetail mungkin dari referensi (gambar di design/, screenshot, atau URL). Gunakan saat diminta meniru/clone/samakan tampilan dari referensi desain, ekstrak design system, atau bangun UI yang mirip referensi. Ekstrak design token → build → verifikasi via Playwright screenshot loop sampai mirip.
allowed-tools: Read Write Bash(npx *) Bash(npm *) Bash(node *) Bash(find *) Bash(cat *)
argument-hint: "deskripsi target (mis. 'halaman /login dari design/login.png')"
---

# UI Clone — Replikasi Design System dari Referensi

Tiru tampilan & nuansa dari referensi dengan pendekatan **design-system-first**: ekstrak token (warna, tipografi, spacing) dulu, build pakai token itu, lalu verifikasi kemiripan via Playwright screenshot loop. Tujuan: **tiru gaya & sistem desain lalu adaptasi** ke stack standar (Next.js 16 + shadcn/ui + Tailwind v4), bukan sekadar tiru piksel mentah.

> Prasyarat: Playwright MCP aktif + dev server jalan (`npm run dev`). Referensi di folder `design/`.

## Filosofi

Jangan tiru piksel buta. Tiru **sistem**-nya:
- Referensi pixel-perfect itu rapuh (font rendering & spacing responsif beda antar mesin).
- Yang bikin UI "terasa sama" = konsistensi token: palet warna, skala tipografi, ritme spacing, radius, shadow, density.
- Sekali token benar, seluruh halaman otomatis konsisten dan gampang diadaptasi.

## Alur Kerja

```
1. ANALYZE   → baca referensi (vision), bedah jadi design token + struktur layout
2. TOKENIZE  → tulis token ke Tailwind config / CSS vars (sumber kebenaran)
3. BUILD     → susun komponen pakai token + shadcn/ui, ikut struktur referensi
4. CAPTURE   → dev server jalan → Playwright screenshot halaman
5. COMPARE   → sandingkan screenshot vs referensi, daftar selisih konkret
6. REFINE    → perbaiki → screenshot ulang → ulangi (loop)
7. STOP      → mirip secara visual ATAU 3 iterasi → lapor selisih sisa
```

---

## Step 1 — ANALYZE (bedah referensi)

Baca SEMUA gambar di `design/` (vision). Untuk tiap referensi, ekstrak secara eksplisit:

**Design tokens:**
```
Warna     : background, surface/card, primary, secondary, accent, text (primary/muted),
            border, success/warning/error. Catat hex perkiraan + dark/light mode.
Tipografi : font family (sans/serif/mono), skala ukuran (h1→body→caption),
            font-weight per level, line-height, letter-spacing.
Spacing   : ritme dasar (4px? 8px?), padding kartu, gap antar elemen, margin section.
Radius    : sudut tombol, kartu, input (sm/md/lg/full?).
Shadow    : ada elevasi? halus/tegas? berapa layer?
Density   : padat atau lega? (mempengaruhi padding & font-size global)
```

**Struktur & layout:**
```
Layout    : grid/flex, jumlah kolom, sidebar/topbar, container max-width.
Komponen  : daftar komponen yang terlihat (navbar, card, table, form, modal, badge...).
Hierarki  : apa yang dominan, urutan visual, fokus utama.
State     : kalau terlihat — hover, active, disabled, empty state.
Pola      : shadcn/ui mana yang paling cocok per elemen (Button, Card, Input, Table...).
```

Output analisa ini sebagai ringkasan singkat ke bigboss SEBELUM build, biar arah desain disepakati.

## Step 2 — TOKENIZE (token jadi sumber kebenaran)

Tulis token ke konfigurasi, JANGAN hardcode nilai di komponen.

Tailwind v4 (CSS-first, `@theme`):
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-background: #0a0a0a;
  --color-surface: #161616;
  --color-primary: #6366f1;
  --color-primary-foreground: #ffffff;
  --color-muted: #a1a1aa;
  --color-border: #27272a;

  --font-sans: "Inter", system-ui, sans-serif;

  --radius-card: 0.75rem;
  --spacing-card: 1.5rem;
}
```

Prinsip:
- Semua warna/spacing/radius lewat token. Komponen pakai `bg-surface`, `rounded-card`, dst.
- Kalau referensi pakai font khusus → setup `next/font` (Google Font / local).
- Dark/light mode: definisikan dua set token kalau referensi punya keduanya.

## Step 3 — BUILD (susun pakai token + shadcn/ui)

- Pakai komponen shadcn/ui sebagai dasar, lalu styling via token (bukan nilai mentah).
- Ikut struktur layout referensi (urutan, grid, hierarki).
- Komponen reusable, < 200 baris, no `any` (ikut skill `frontend`).
- Animasi/transisi kalau referensi menyiratkannya (Motion) — halus, jangan berlebihan.

## Step 4 — CAPTURE (screenshot via Playwright)

Pastikan dev server hidup, lalu screenshot ke `design/.work/`:

```typescript
// scripts/ui-capture.ts
import { chromium } from "playwright";

const ROUTE = process.argv[2] ?? "/";
const OUT = process.argv[3] ?? "design/.work/current.png";
const W = Number(process.argv[4] ?? 1440);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: 900 } });
await page.goto(`http://localhost:3000${ROUTE}`, { waitUntil: "networkidle" });
await page.screenshot({ path: OUT, fullPage: true });
await browser.close();
```

> Atau via Playwright MCP: `browser_navigate` → `browser_take_screenshot`. Screenshot beberapa breakpoint (mobile 390, tablet 768, desktop 1440) kalau referensi responsif.
> Browser belum terpasang → jalankan `npx playwright install chromium` sekali, lalu lanjut.

## Step 5 — COMPARE (selisih konkret)

Sandingkan `design/<page>.png` vs `design/.work/current.png`. Bandingkan per dimensi, tulis selisih SPESIFIK (bukan "agak beda"):

```
Checklist banding:
□ Warna      — background/surface/primary cocok? (sebut elemen yang meleset)
□ Tipografi  — ukuran & weight heading/body sama? font benar?
□ Spacing    — padding kartu, gap, margin section sepadan?
□ Layout     — posisi & proporsi elemen sesuai? alignment?
□ Radius     — sudut tombol/kartu/input sama?
□ Shadow     — elevasi mirip?
□ Komponen   — ada elemen referensi yang belum dibuat / kelebihan?
□ Density    — keseluruhan terasa sama padat/lega?

Contoh output:
- ❌ Heading terlalu kecil: ref ~32px bold, current 24px semibold → naikkan ke text-3xl font-bold
- ❌ Card padding kurang: ref ~24px, current 16px → p-6
- ✅ Warna primary & background sudah cocok
```

## Step 6 & 7 — REFINE (loop) + STOP

- Perbaiki HANYA selisih yang terdaftar → screenshot ulang → bandingkan lagi.
- **Maksimal 3 iterasi** otomatis.
- Berhenti kalau: sudah mirip secara visual, ATAU 3 iterasi tercapai.
- Setelah berhenti, lapor: apa yang sudah cocok, selisih sisa (kalau ada) + kenapa (mis. aset/ikon/gambar asli tidak tersedia, font berbayar).

Target: **visually match (mirip dekat) + sistem desain konsisten**, BUKAN pixel-perfect. Mockup tangan jarang bisa 100% identik.

## Aturan

- Token DULU, baru komponen. Jangan sebar nilai warna/spacing mentah di JSX.
- Hanya layer presentasi — jangan ubah logic/data demi tampilan.
- Screenshot kerja ke `design/.work/` (masukkan ke `.gitignore`). JANGAN timpa referensi asli di `design/`.
- Kalau referensi cuma 1 komponen, clone komponen itu saja — jangan paksa seluruh halaman.
- Aset yang tidak tersedia (logo, foto, ikon custom) → pakai placeholder mirip + beri tahu bigboss, jangan invent aset palsu yang menyesatkan.
- Jangan tiru teks/konten asli kalau itu milik brand lain — fokus ke struktur & gaya, isi pakai konten project.

## Larangan

- JANGAN hardcode warna/spacing di komponen — selalu via token Tailwind/CSS var.
- JANGAN kejar pixel-perfect tanpa henti — maks 3 iterasi lalu lapor.
- JANGAN lanjut tiru tanpa dev server / Playwright MCP — beri tahu cara aktifkan.
- JANGAN gunakan `any`, JANGAN buat komponen > 200 baris.
- JANGAN klaim "sudah sama" tanpa screenshot pembanding — selalu verifikasi visual.

## Task

$ARGUMENTS
