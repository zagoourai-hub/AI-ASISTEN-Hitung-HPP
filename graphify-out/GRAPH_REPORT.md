# GRAPH_REPORT: HPP Pintar v2.0 Architecture & Knowledge Graph

**Corpus Analysis:**
- 4 Core Spec & Standard Docs (`PRD.md`, `design/DESIGN.md`, `AGENTS.md`, `CLAUDE.md`)
- 4 UI Mockup References (`design/dashboard.png`, `design/dashboard-produk.png`, `design/dashboard-harga.png`, `design/dashboard-ai-asistan.png`)
- Total Nodes: 28
- Total Edges: 36
- Communities: 4

---

## 1. God Nodes

- **HPP Engine (Costing & Recipe)** (`domain_hpp`): Degree 6 — Central core of product costing connecting inventory, pricing, recipes, and UI
- **Frontend: Next.js App Router + TypeScript Strict** (`arch_frontend_nextjs`): Degree 6 — Main user interaction and rendering layer for all dashboard mockups and API consumption
- **Pricing Engine (Margin & Competitor)** (`domain_pricing`): Degree 5 — Bridges costing calculations with sales transactions and AI recommendations

---

## 2. Surprising Connections

- **AI Intelligence Layer ↔ Finance Engine** (`provides_financial_data_to`): AI operates purely on the outer perimeter, consuming financial engine outputs without domain logic depending on AI.
- **Financial Precision Rule ↔ Frontend Next.js** (`presentation_only_contract`): Authoritative calculations strictly reserved for Python Decimal / PostgreSQL Numeric; Next.js frontend strictly formats presentation string.

---

## 3. Suggested Questions

1. Bagaimana data mengalir dari Inventory (pembelian bahan) sampai ke Rekomendasi AI dan Penetapan Harga?
2. Mengapa arsitektur memisahkan AI sebagai outer layer dan melarang domain finansial bergantung pada AI?
3. Bagaimana kesesuaian antara 4 mockups di design/ dengan spesifikasi teknis di PRD dan AGENTS.md?
