# DESIGN.md — M0neyku v2.0

> **Produk:** M0neyku
> **Tipe:** UI/UX Design Specification
> **Platform:** Responsive Web
> **Target pengguna utama:** Gen Z founder / UMKM owner muda
> **Arah visual:** Clean, modern, confident, practical
> **Constraint:** Tidak terlihat seperti “AI slop”, tidak terlalu glossy, tidak terlalu ramai, tidak seperti dashboard enterprise lama

---

# 1. Design Goals

UI M0neyku harus terasa:

* modern;
* ringan;
* cepat;
* jelas;
* premium tapi tetap ramah;
* cocok untuk owner bisnis muda;
* tidak membingungkan;
* tidak terlihat seperti template AI generik.

Desain harus membantu pengguna:

1. cepat paham angka penting;
2. cepat tahu apakah produk untung atau tidak;
3. cepat melakukan simulasi;
4. cepat membaca insight AI;
5. tetap percaya pada angka karena formula transparan.

---

# 2. Design Principles

## 2.1 Decision-first

Yang paling penting selalu muncul lebih dulu:

```text id="my998n"
Status
→ HPP
→ Harga Jual
→ Margin
→ Rekomendasi
→ Aksi
→ Detail
```

---

## 2.2 Clean, not empty

UI harus clean, tapi jangan terasa kosong atau terlalu polos.

Gunakan:

* white space yang cukup;
* hierarchy yang kuat;
* typography yang tegas;
* border halus;
* section yang jelas;
* warna seperlunya.

Hindari:

* glassmorphism berlebihan;
* gradient berat;
* icon terlalu banyak;
* background ramai;
* card bertumpuk berlebihan;
* efek AI-art style.

---

## 2.3 Numbers are the hero

Aplikasi ini adalah product financial decision tool.

Jadi yang menjadi pusat visual adalah:

* angka utama;
* perubahan angka;
* label status;
* cost breakdown;
* recommendation card.

Bukan ilustrasi dekoratif.

---

## 2.4 Gen Z-friendly, not childish

Target Gen Z berarti:

* cepat;
* to the point;
* visual rapi;
* microcopy santai tapi profesional;
* UI terasa “niat” dan modern.

Bukan berarti:

* warna neon;
* emoji berlebihan;
* animasi berlebihan;
* gaya terlalu playful;
* layout seperti landing creator tools random.

---

## 2.5 AI as assistant, not the brand style

AI harus terasa sebagai fitur bantu.

Bukan membuat seluruh desain terlihat seperti “AI app template”.

Gunakan AI section yang:

* structured;
* data-backed;
* simpel;
* berguna.

Bukan bubble chat panjang tanpa struktur.

---

# 3. Brand Personality

Karakter visual M0neyku:

* **Reliable**
* **Sharp**
* **Young**
* **Calm**
* **Useful**
* **Modern**
* **Practical**

Brand tone:

* percaya diri;
* ringkas;
* tidak bertele-tele;
* tidak terlalu formal;
* tetap sopan;
* tidak terdengar seperti “robot AI”.

---

# 4. Audience Style Reference

Target user:

* umur 18–35;
* founder UMKM;
* bisnis minuman/makanan;
* tech-aware;
* familiar dengan mobile apps modern;
* suka UI yang cepat dipahami.

Design taste target:

* suka clean layout;
* suka dashboard modern;
* suka visual jelas;
* tidak suka software jadul;
* tidak suka aplikasi yang “terlalu AI” atau terlalu abstrak.

---

# 5. Visual Direction

## 5.1 Overall look

Arah visual utama:

> **Clean SaaS modern + startup financial dashboard + consumer-grade simplicity**

Harus terasa seperti perpaduan:

* dashboard SaaS modern;
* app bisnis ringan;
* UI yang rapi untuk mobile dan desktop.

Bukan seperti:

* accounting software lama;
* ERP kaku;
* crypto dashboard;
* AI tools landing page berlebihan;
* template no-code generik.

---

## 5.2 Shape Language

Gunakan bentuk yang:

* rounded, tapi tidak terlalu bulat;
* modern;
* stabil;
* ringan.

Recommended:

```text id="za06l6"
Button radius: 12 px
Input radius: 12 px
Card radius: 18 px
Modal radius: 20 px
Badge radius: full rounded / pill
```

---

# 6. Color System

## 6.1 Core Palette

### Primary

```text id="mbewg8"
Primary 700  #10673C
Primary 600  #14804A
Primary 500  #1B9556
Primary 100  #DDF5E7
Primary 50   #EEF9F2
```

### Neutral

```text id="6r9eve"
Neutral 950  #111315
Neutral 900  #161A18
Neutral 800  #232826
Neutral 700  #444B47
Neutral 600  #5F6762
Neutral 500  #737B76
Neutral 400  #98A09B
Neutral 300  #D5DAD7
Neutral 200  #E8ECE9
Neutral 100  #F3F5F4
Neutral 50   #FAFBFA
White        #FFFFFF
```

### Semantic

```text id="1u3zxa"
Success  #168A4E
Warning  #C08900
Danger   #C63C3C
Info     #2563B8
Purple   #7C5CFF
```

---

## 6.2 Color usage rules

Gunakan warna untuk:

* status;
* CTA utama;
* highlight angka penting;
* active state;
* focus state.

Jangan gunakan banyak warna sekaligus di satu area.

### Rule

```text id="a80jfj"
70% neutral
20% white/surface
10% accent/semantic
```

---

# 7. Typography

## 7.1 Font Recommendation

Primary font:

```text id="3v5v49"
Geist Sans
```

Alternatif:

```text id="kcj3m0"
Inter
```

Untuk angka:

* gunakan tabular numerals;
* weight medium/semibold untuk metric;
* spacing rapat tapi tetap lega.

---

## 7.2 Type Scale

```text id="g7p6fi"
Display XL   56/64
Display L    48/56
H1           40/48
H2           32/40
H3           24/32
H4           20/28
Body L       16/26
Body         14/22
Body S       13/20
Caption      12/18
Metric XL    40/44
Metric L     32/36
Metric M     24/28
```

---

## 7.3 Typography character

Teks harus:

* tegas;
* readable;
* modern;
* tidak terlalu formal;
* tidak terlalu banyak uppercase.

Gunakan uppercase hanya untuk:

* section label kecil;
* status tag tertentu;
* metric mini label jika diperlukan.

---

# 8. Layout System

## 8.1 Grid

### Desktop

* max width content: 1280 px;
* main app content: fluid;
* 12-column grid;
* gap 24 px.

### Tablet

* 8-column grid;
* gap 20 px.

### Mobile

* 4-column grid;
* gap 16 px.

---

## 8.2 Spacing scale

```text id="yxgxpu"
4
8
12
16
20
24
32
40
48
64
80
96
```

Gunakan spacing konsisten.

---

## 8.3 Page padding

```text id="r7v2zz"
Mobile   16 px
Tablet   24 px
Desktop  32 px
Large    40 px
```

---

# 9. Information Architecture — UX Layer

```text id="9i7y34"
Marketing
├── Landing
├── How It Works
├── Features
├── Pricing
├── FAQ
└── Demo Entry

Auth
├── Login
├── Register
├── Forgot Password
└── Reset Password

App
├── Dashboard
├── HPP
│   ├── Product List
│   ├── Product Detail
│   ├── Recipe
│   └── HPP History
├── Ingredients
├── Pricing
├── AI Assistant
├── Finance [Phase 2]
├── Reports [Phase 2]
└── Settings

Admin
├── Overview
├── Users
├── Templates
├── Demo
├── AI Models
├── AI Usage
└── Analytics
```

---

# 10. Navigation Design

## 10.1 Desktop Navigation

Left sidebar:

```text id="vls8zj"
Logo
Dashboard
HPP
Ingredients
Pricing
AI Assistant
Reports
Settings

Plan badge
Profile menu
```

Sidebar style:

* clean;
* icon + label;
* collapse available;
* active item pakai background soft accent;
* tidak terlalu banyak garis.

---

## 10.2 Mobile Navigation

Bottom nav:

```text id="2x7yqp"
Beranda
HPP
AI
Aktivitas
Lainnya
```

Rule:

* maksimal 5 item;
* AI bisa diberi aksen;
* menu tambahan lewat sheet;
* CTA sticky untuk action penting.

---

# 11. Marketing Website Design

## 11.1 Landing Page Structure

Urutan section:

1. Header
2. Hero
3. Problem
4. Interactive mini demo
5. Features
6. AI insight preview
7. Product screenshots
8. Pricing
9. FAQ
10. Final CTA
11. Footer

---

## 11.2 Hero Section

### Goals

Hero harus:

* langsung menjelaskan value;
* terlihat modern;
* menonjolkan CTA;
* tidak penuh buzzword;
* menunjukkan UI asli.

### Layout

Desktop:

```text id="h1pgq3"
Left:
- Badge
- Headline
- Subheadline
- CTA Primary + Secondary
- Supporting trust note
- Mini feature list

Right:
- Main product mockup
- Floating metric card
- Tiny cost breakdown card
```

### Hero copy direction

Badge:

```text id="8814jk"
Dibuat untuk UMKM yang ingin hitung untung dengan jelas
```

Headline:

```text id="yv5qen"
Jangan Jual Cuma Modal Feeling.
```

Alternative line:

```text id="xhrm7d"
Hitung HPP, Tentukan Harga, dan Tahu Untung Sebenarnya.
```

Subheadline:

```text id="gfe7ib"
M0neyku membantu kamu menghitung biaya produk, melihat margin, dan mendapatkan rekomendasi harga jual dengan bantuan AI yang transparan.
```

CTA:

```text id="fe2x61"
Coba Demo Gratis
Lihat Cara Kerjanya
```

Trust note:

```text id="gxzjo1"
Tanpa kartu kredit • Data demo tersedia • Formula transparan
```

---

## 11.3 Hero Visual Style

Gunakan mockup UI nyata.

Jangan gunakan:

* ilustrasi AI karakter;
* 3D blob;
* visual abstrak berlebihan;
* robot/otak/neural network icon.

Tambahkan floating cards seperti:

```text id="spj9a7"
HPP per Gelas
Rp13.200

Margin
34%

Rekomendasi
Rp22.000
```

---

## 11.4 Problem Section

Gunakan 3–4 cards.

Contoh:

```text id="o2cl93"
Harga jual ikut kompetitor
Belum tentu margin aman.

Biaya kecil sering terlupakan
Cup, sedotan, listrik, dan overhead ikut memengaruhi untung.

Omzet sering dianggap laba
Padahal belum dikurangi HPP dan biaya operasional.
```

Card style:

* simple;
* icon kecil;
* judul kuat;
* deskripsi singkat;
* tidak banyak ilustrasi.

---

## 11.5 Interactive Demo Section

Mini simulation sederhana.

User bisa ubah:

* harga susu;
* jumlah penggunaan;
* harga jual.

Output langsung:

* HPP;
* profit;
* margin;
* status.

Style:

* card dua kolom desktop;
* stacked mobile;
* form ringkas;
* angka hasil besar dan jelas.

---

## 11.6 Feature Section

Jangan 12 kartu seragam.

Kelompokkan menjadi 3 cluster:

### Hitung dengan benar

* bahan;
* resep;
* overhead;
* varian.

### Ambil keputusan harga

* target margin;
* rekomendasi harga;
* diskon;
* delivery fee.

### Pahami hasilnya

* AI insight;
* formula transparan;
* data quality warning;
* histori HPP.

---

## 11.7 Pricing Section

3 plan cards:

* Demo
* Gratis
* Pro / Segera Hadir

UI rule:

* satu card ditonjolkan;
* badge jelas;
* CTA mudah dipahami;
* jangan membuat card Pro terlihat palsu.

---

# 12. App UI Design

## 12.1 Dashboard

### Goal

Dashboard harus menjawab dalam 5–10 detik:

* produk mana bermasalah;
* apakah margin aman;
* HPP naik atau tidak;
* action berikutnya apa.

### Desktop layout

```text id="3fo16t"
Top header
Alert banner
Primary metrics row
Product insight + cost breakdown
Trend chart + AI insight
Recent activity / quick actions
```

### Mobile order

```text id="gopxba"
Header
Alert
Metrics
Products needing attention
Cost breakdown
Recommendation / AI insight
Trend
Quick actions
```

---

## 12.2 Dashboard Components

### Alert Banner

Contoh:

```text id="6fjw4l"
Margin Kopi Susu M turun di bawah target 40%.
Lihat penyebabnya.
```

### Metric Cards

Contoh:

```text id="gtqerv"
HPP Utama
Rp13.200
+8,5%

Harga Jual
Rp20.000

Laba / Unit
Rp6.800

Margin
34%
Target 40%
```

### Product Attention Card

```text id="m9alvi"
Kopi Susu M
Margin turun 6 poin
Penyebab utama: harga susu naik
[Lihat Detail]
```

---

# 13. Product Detail Screen

## 13.1 Layout

Desktop:

* left: recipe / ingredient table;
* right: sticky summary panel.

Mobile:

* summary dulu;
* tabs;
* recipe cards;
* sticky action.

---

## 13.2 Product Summary Card

Menampilkan:

```text id="1ch0qz"
HPP Penuh
Harga Jual
Laba / Unit
Margin
Target Margin
Status
```

Card ini harus paling dominan secara hierarchy.

---

## 13.3 Recipe Editor

Style:

* clean table desktop;
* card stack mobile;
* inline subtotal;
* warning jika unit belum valid;
* sticky total.

Action:

* tambah bahan;
* ubah qty;
* simpan draft;
* hitung ulang.

---

## 13.4 Cost Breakdown

Gunakan:

* horizontal bar;
* progress list;
* angka dan persentase.

Contoh:

```text id="mzg8fo"
Bahan        Rp8.500   64%
Kemasan        Rp900    7%
Tenaga         Rp500    4%
Overhead     Rp3.300   25%
```

---

# 14. Pricing Screen

## 14.1 Main Structure

1. Input parameters
2. Recommendation cards
3. Scenario comparison
4. Action row
5. AI explanation

---

## 14.2 Recommendation Cards

Tiga card:

```text id="wbiiq9"
Hemat
Ideal
Premium
```

Ideal card lebih menonjol.

Isi card:

* harga;
* margin;
* laba/unit;
* status;
* alasan singkat.

---

## 14.3 Scenario Table / Cards

Desktop:

* table.

Mobile:

* card per scenario.

Contoh:

```text id="aa3m8q"
Normal
Diskon 10%
Delivery
Rekomendasi
```

---

# 15. AI Assistant Design

## 15.1 UX Goal

AI assistant harus terasa:

* berguna;
* rapi;
* terstruktur;
* tidak seperti chatbot kosong.

AI harus terlihat seperti:

> analyst panel + conversational helper

Bukan hanya chat biasa.

---

## 15.2 Full Page AI Layout

Desktop:

```text id="wpfm7l"
Left: conversation list
Center: chat + structured result
Right: context panel
```

Mobile:

* chat fullscreen;
* context via bottom sheet / expandable chip;
* conversation list via drawer.

---

## 15.3 AI Result Design

Result block harus menampilkan:

1. summary;
2. status;
3. key metrics;
4. recommendations;
5. formula disclosure;
6. warning;
7. follow-up prompts.

Contoh:

```text id="jrdg09"
Ringkasan
Margin Kopi Susu M turun karena biaya susu meningkat.

Status
Warning

Metrik
HPP +8.5%
Margin 34%
Target 40%

Rekomendasi
Naikkan harga ke Rp22.000
atau kurangi diskon aktif.
```

---

## 15.4 Suggested Prompt Chips

Contoh:

* Kenapa HPP naik?
* Simulasikan diskon 10%
* Bandingkan dengan harga target
* Biaya terbesar apa?
* Jelaskan margin vs markup

---

# 16. Ingredients Screen

## 16.1 Layout

Desktop:

* list/table di kiri;
* detail panel di kanan.

Mobile:

* list view;
* detail via sheet/page.

---

## 16.2 Visual cues

Tampilkan:

* cost/unit;
* last updated;
* warning jika harga lama;
* unit conversion status.

Contoh label:

```text id="mry4fa"
Terakhir diperbarui 14 hari lalu
```

---

# 17. Onboarding UX

## 17.1 Structure

```text id="rjz6gw"
1. Profil usaha
2. Template
3. Bahan & harga
4. Produk & resep
5. Overhead
6. Target margin
7. Hasil pertama
```

---

## 17.2 UX rules

* progress terlihat;
* autosave;
* satu langkah satu fokus;
* jangan tampilkan terlalu banyak field sekaligus;
* hasil awal muncul secepat mungkin.

---

## 17.3 Completion Screen

Setelah onboarding, user langsung melihat:

* HPP pertama;
* 1 rekomendasi harga;
* CTA ke dashboard.

---

# 18. Component System

## 18.1 Core Components

* Button
* Input
* Select
* Textarea
* Modal
* Drawer
* Sheet
* Tooltip
* Badge
* Tabs
* Table
* Card
* Data row
* Empty state
* Error state
* Skeleton
* KPI card
* Recommendation card
* Cost breakdown
* Formula disclosure
* AI result block

---

## 18.2 Card Types

### Metric Card

Untuk angka utama.

### Insight Card

Untuk alert atau AI summary.

### Recommendation Card

Untuk pricing recommendation.

### Action Card

Untuk CTA seperti “Hitung Ulang”.

---

# 19. Motion & Interaction

Motion harus subtle.

Gunakan animasi hanya untuk:

* hover;
* modal/sheet;
* tab switch;
* skeleton loading;
* live recalculation feel.

Hindari:

* animasi berat;
* motion flashy;
* parallax berlebihan;
* floating decoration yang mengganggu.

Transition recommendation:

```text id="83thgt"
150ms–220ms
ease-out
```

---

# 20. Shadows & Borders

Mayoritas UI sebaiknya menggunakan:

* border halus;
* surface bersih;
* shadow ringan.

Recommended:

```text id="hrubgt"
border: 1px solid neutral-200
shadow: small only on modal / dropdown / sticky elements
```

Jangan semua card memakai shadow besar.

---

# 21. Empty States

Harus terasa membantu, bukan kering.

Contoh:

```text id="h69mze"
Belum ada produk.
Mulai dari template atau buat produk pertama kamu.

[Pilih Template]
[Buat Produk]
```

---

# 22. Error States

Pesan error harus menjawab:

* apa yang gagal;
* apakah data aman;
* apa yang bisa dilakukan.

Contoh:

```text id="v77r4e"
Analisis AI gagal dimuat, tapi data HPP kamu tetap aman.
[Coba Lagi]
[Lihat Perhitungan]
```

---

# 23. Loading States

Gunakan skeleton, bukan spinner full screen di semua tempat.

Local interaction seperti simulasi cukup:

* inline loading;
* skeleton result card;
* shimmer.

---

# 24. Copywriting Style

Tone:

* jelas;
* singkat;
* tidak menghakimi;
* tidak terlalu formal;
* tidak terlalu hype.

Contoh copy yang baik:

* Margin produk ini di bawah target.
* Biaya susu naik Rp1.200 per gelas.
* Hasil ini belum memasukkan biaya tenaga kerja.
* Coba bandingkan dengan rekomendasi harga.

Hindari:

* Untung maksimal dijamin.
* AI ini tahu harga terbaik.
* Bisnis Anda sedang buruk.
* Hasil pasti benar 100%.

---

# 25. Anti “AI Slop” Rules

Agar desain tidak terlihat seperti AI slop:

* jangan gunakan ilustrasi generik robot/AI;
* jangan gunakan gradient ramai;
* jangan terlalu banyak badge;
* jangan terlalu banyak font weight campur;
* jangan penuhi layar dengan chip;
* jangan pakai icon random terlalu banyak;
* jangan gunakan copy terlalu banyak jargon AI;
* jangan gunakan mockup berlebihan;
* jangan gunakan layout “template startup 2024” yang terlalu generik.

Sebaliknya:

* fokus pada data;
* UI clean;
* hierarchy jelas;
* typography kuat;
* spacing matang;
* cards fungsional;
* status yang masuk akal.

---

# 26. Screen Inventory

## Marketing

* Landing
* Pricing
* FAQ
* Demo Entry

## Auth

* Login
* Register
* Forgot Password
* Reset Password

## App

* Dashboard
* Product List
* Product Detail
* Recipe Editor
* Cost History
* Ingredient List
* Ingredient Detail
* Pricing Simulator
* AI Assistant
* Settings

## Demo

* Guided Tour
* Session Banner
* Quota State
* Completion Screen

## Admin

* Overview
* Users
* Templates
* Demo Config
* AI Models
* AI Usage
* Analytics

---

# 27. Responsive Priorities

## Mobile first priorities

Yang harus terlihat langsung:

* CTA di landing;
* HPP;
* margin;
* rekomendasi harga;
* alert;
* action utama.

Grafik kompleks dan tabel besar berada setelah informasi inti.

---

# 28. Accessibility

Checklist:

* [ ] Kontras AA
* [ ] Focus state jelas
* [ ] Touch target minimal 44px
* [ ] Input punya label
* [ ] Status tidak hanya warna
* [ ] Chart punya summary text
* [ ] Keyboard navigation untuk komponen utama
* [ ] Dialog focus trapped
* [ ] Error mudah dipahami

---

# 29. Design QA Checklist

* [ ] Landing terasa clean dan modern
* [ ] Hero tidak terlihat seperti template AI generik
* [ ] Angka utama dominan
* [ ] CTA jelas
* [ ] HPP dan margin terlihat tanpa buka accordion
* [ ] Product detail mudah dipahami di mobile
* [ ] Recommendation cards punya hierarchy jelas
* [ ] AI result terstruktur, bukan chat panjang
* [ ] Dashboard tidak padat
* [ ] Tidak ada visual yang terasa norak atau terlalu “AI”
* [ ] Desain cocok untuk Gen Z tapi tetap profesional

---

# 30. Final Design Direction

Ringkasan arah desain final:

> **M0neyku harus terlihat seperti financial product modern untuk founder muda — clean, smart, practical, dan terpercaya.**

Kata kunci final:

```text id="jpv7v0"
Clean
Modern
Sharp
Calm
Confident
Useful
Gen Z-friendly
Data-first
Not AI-slop
```

Jika ingin dipecah ke tahap implementasi berikutnya, urutan paling ideal:

1. design system / tokens;
2. landing page;
3. dashboard;
4. product detail;
5. pricing screen;
6. AI assistant;
7. onboarding;
8. admin.
