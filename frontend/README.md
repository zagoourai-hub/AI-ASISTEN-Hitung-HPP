# HPP Pintar Frontend

Frontend Next.js App Router untuk MVP Core HPP + Pricing.

Status: FE-P0 sampai FE-P4 selesai melalui handoff frontend agent. Detail atomic task dan bukti verifikasi ada di [`docs/PRD.tasks.md`](../docs/PRD.tasks.md).

## Development

Jalankan development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi.

Backend API berjalan terpisah sesuai konfigurasi environment frontend.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Playwright pilot flow:

```bash
npx playwright test tests/e2e-pilot-flow.spec.ts
```

Evidence screenshot tersimpan di `../screenshots/`.

## Scope

- Frontend menggunakan TypeScript strict, Tailwind CSS v4, dan Lucide Icons.
- Backend authoritative untuk kalkulasi HPP dan Decimal arithmetic.
- AI, inventory, POS, finance, reporting, competitor pricing, dan delivery fee berada di luar MVP.
