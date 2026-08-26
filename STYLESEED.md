# STYLESEED — M0neyku v2.0

> **Design System Authority for M0neyku**
> Target: F&B UMKM owners & Gen-Z founders in Indonesia.
> Direction: Modern SaaS + Financial Clarity + Clean Startup Dashboard.
> Anti-Slop Policy: Strictly avoid generic AI templates, excessive gradients, random glassmorphism, 3D blobs, or fake chatbot bubbles.

---

## 1. Core Visual Tokens

### 1.1 Color Palette
- **Primary 700:** `#10673C` (Deep Forest)
- **Primary 600:** `#14804A` (Brand Primary)
- **Primary 500:** `#1B9556` (Interactive / Hover)
- **Primary 100:** `#DDF5E7` (Soft badge background)
- **Primary 50:**  `#EEF9F2` (Active nav & table highlight)

### 1.2 Neutrals & Surfaces
- **Neutral 950:** `#111315` (Deepest text)
- **Neutral 900:** `#161A18` (Headings & prominent metrics)
- **Neutral 700:** `#444B47` (Subheadings & table headers)
- **Neutral 500:** `#737B76` (Secondary labels & muted captions)
- **Neutral 300:** `#D5DAD7` (Card & input borders)
- **Neutral 200:** `#E8ECE9` (Subtle dividers)
- **Neutral 100:** `#F3F5F4` (App canvas & container background)
- **Neutral 50:**  `#FAFBFA` (Input backgrounds & card secondary)
- **Surface White:** `#FFFFFF` (Primary card surface)

### 1.3 Semantic States
- **Success:** `#168A4E` (Margin safe, target reached)
- **Warning:** `#C08900` / `#D97706` (Margin warning, price stale)
- **Danger:**  `#C63C3C` / `#DC2626` (Margin critical, cost increase)
- **Info:**    `#2563B8` (Packaging/breakdown secondary)
- **Accent Purple:** `#7C5CFF` (Special variant / highlight)

---

## 2. Typography & Numbers
- **Font Sans:** `Geist Sans`, `Inter`, -apple-system, sans-serif.
- **Font Mono / Numbers:** Tabular figures (`font-variant-numeric: tabular-nums`) for currency (Rp) and percentage values.
- **Scale:**
  - Metric Hero: `2rem` to `2.5rem` (32px - 40px), bold, tight tracking.
  - Heading 1: `1.75rem` (28px), bold.
  - Heading 2: `1.25rem` (20px), semibold.
  - Body: `0.875rem` (14px), regular / medium.
  - Caption / Label: `0.75rem` (12px), semibold / medium uppercase where appropriate.

---

## 3. Geometry & Elevation
- **Border Radius:**
  - Buttons / Inputs: `12px` (`0.75rem`)
  - Cards: `18px` (`1.125rem`)
  - Modals / Sheets: `20px` (`1.25rem`)
  - Badges: `9999px` (Pill)
- **Borders:** `1px solid #E8ECE9` (Subtle, crisp border instead of heavy shadows).
- **Elevation:** Low elevation (`shadow-xs` / `shadow-sm` on cards, `shadow-lg` only for flyouts/modals).

---

## 4. Anti-AI Slop Standards
- No meaningless gradients or rainbow glows.
- No cartoonish 3D AI blobs or robotic icons.
- All numbers and metrics must be realistic, deterministic, and verifiable.
- AI Assistant output must be formatted in structured analyst cards (Ringkasan, Metrik, Status, Rekomendasi), never raw rambling walls of text.
- High contrast, semantic HTML, keyboard accessible (`button`, `a`, `main`, `nav`, `aside`, `header`, `table`).
