# Task Tracker — M0neyku v2.0

Source PRD: `PRD.md`
Profile/Stack: Next.js + TypeScript, FastAPI + Python, PostgreSQL, OpenAPI
Last Updated: 2026-08-28

## Scope Lock

- MVP: Core HPP + Pricing.
- Repository boundary: `frontend/` dan `backend/`.
- One user owns one business; currency MVP IDR.
- HPP uses the latest effective ingredient price and backend Decimal arithmetic.
- Inventory, POS, reporting, competitor pricing, dan delivery fee remain post-MVP.
- Cash Tracking manual dibuka sebagai fase post-MVP baru: saldo awal editable, pemasukan,
  pengeluaran, dan summary saldo dashboard; tidak terhubung ke ATM/bank/e-wallet.
- AI Assistant integration adalah scope post-MVP terpisah. Kontrak aktif memakai chat teks streaming incremental; structured analyst UI dihentikan.
- Frontend Phase 0-8, Backend Phase 0-8, dan Integration sampai `INT-P5-T001` selesai.
  Backend Cash Tracking selesai; frontend Cash Tracking sudah diimplementasikan dan menunggu verifikasi toolchain.

## Summary

- Total: 86
- Frontend: 28 (25 completed, 3 in progress, 0 pending)
- Backend: 37 (37 completed, 0 in progress, 0 pending)
- Integration: 11 (10 completed, 0 in progress, 1 pending, 0 blocked)
- AI: 10 (5 completed, 0 in progress, 0 blocked, 0 pending, 5 skipped)
- Completed: 77
- In Progress: 3
- Pending: 1
- Blocked: 0
- Skipped: 5

## Final Checkpoint — 2026-08-22 (historical baseline)

- Frontend: 20/20 task completed melalui handoff agent frontend; typecheck, lint, production build, dan Playwright evidence tercatat pada tracker.
- Backend: 31/31 task completed; 101 tests, Ruff, Pyright, OpenAPI, Alembic offline, dan live PostgreSQL pilot tercatat pada tracker.
- Dokumentasi ini mencatat baseline sebelum task product image dibuka pada 2026-08-25.

## Integration Checkpoint — 2026-08-25

- FE dan BE sebelumnya selesai terpisah. Integrasi live dibuka sebagai lima task atomik.
- `INT-P0-T001` completed at source and static quality gates: Axios client, TanStack Query provider, Zustand state, typed contract, cookie session forwarding, and FastAPI business route are wired.
- Runtime live tersedia melalui Docker Compose: PostgreSQL 16 Alpine dan FastAPI backend memakai named volume serta healthcheck; Next.js tetap berjalan dari workspace pada `:3000`; local secrets dibuat runtime-only dan tidak dicetak atau dikomit.
- Live smoke menemukan dan memperbaiki tiga response-path `MissingGreenlet` pada ingredient/product/recipe creation serta action bar HPP mobile yang tertutup bottom navigation.
- Browser flow register -> session -> settings -> logout -> login -> ingredient -> product -> draft recipe -> activate -> HPP -> pricing recommendation -> discount simulation lulus pada desktop dan mobile; current tab console error 0 dan request API MVP expected 2xx.
- Dependency install audited `SAFE_NO_KNOWN_IOC`; package lifecycle scripts tidak dijalankan.

## UI Feedback Checkpoint — 2026-08-25

- `FE-P4-T004` completed: global Radix Toast untuk login/register/logout success/error, satu toast aktif, posisi atas-tengah desktop/mobile, dan close button keyboard/touch accessible.
- `FE-P4-T004` completed: `PageSkeleton` untuk session dan `DashboardSkeleton` untuk query produk/bisnis memakai state `isPending` nyata; tidak ada `setTimeout`, `setInterval`, atau artificial loading delay; reduced-motion tetap didukung.
- Verification: `npm run lint` passed; `npx tsc --noEmit` passed; `npm run build` passed; Playwright register `201`, login `200`, invalid login error toast, desktop/mobile screenshots, dan successful-flow console error `0`.
- Evidence: `screenshots/register-toast-desktop.png`, `screenshots/login-toast-top-center-390x844.png`, dan screenshot live auth sebelumnya tetap berada di `screenshots/`.
- Note: beberapa GET sempat `ERR_ABORTED` saat route transition dan retry berikutnya `200`; tidak ada kegagalan final API pada flow sukses.
- Resume target 2026-08-26: tunggu daftar UI/product update berikutnya dari user, pecah menjadi task atomic baru sebelum implementasi.

## Product Image Scope — 2026-08-25

- User menyetujui local storage sementara.
- Scope selesai: satu gambar per produk, JPG/PNG/WebP maksimal 5 MB, random server filename, signature validation, tenant guard, dan named Docker volume.
- Batasan sengaja: belum ada SVG, gallery, crop/editor, object storage cloud, atau multi-image.
- Verification: migration `0012_product_images` live, volume `ai-hitung-hpp-product-media`, backend/frontend quality gates, serta Playwright desktop/mobile.
- Gallery, crop, SVG, dan object storage cloud belum termasuk scope.

## Ingredient Edit & Price History Scope — 2026-08-25

- User meminta rename nama bahan baku dan delete satu baris histori harga.
- Delete histori memakai hard delete terkontrol dengan tenant guard; `current_unit_cost` dihitung ulang dari histori efektif terbaru yang tersisa, atau `null` bila tidak ada.
- Archive bahan baku tetap terpisah dari scope ini; endpoint backend sudah ada tetapi tombol UI belum ditambahkan.

## Ingredient Edit & Price History Checkpoint — 2026-08-25

- Live Chrome berhasil rename melalui `PATCH 200`, menghapus histori melalui `DELETE 204`, lalu refetch detail melalui `GET 200`; nama baru dan empty-history state bertahan setelah query invalidation.
- Desktop dan mobile 390x844 diverifikasi tanpa overflow horizontal; current-tab console errors `0`.
- Evidence: `screenshots/ingredients-edit-history-desktop.png` dan `screenshots/ingredients-edit-history-mobile-390x844.png`.
- Satu data uji baru diarsipkan kembali setelah bukti live diambil. Route transition sempat mencatat GET `ERR_ABORTED`, lalu retry `200`.

## Product Edit & Archive Scope — 2026-08-25

- User meminta aksi edit nama dan hapus produk dari section Produk.
- Kontrak backend yang dipakai sudah tersedia: `PATCH` untuk rename dan `DELETE` untuk archive tenant-scoped; data resep dan histori HPP tetap dipertahankan.

## Product Edit & Archive Checkpoint — 2026-08-25

- `FE-P7-T001` dan `INT-P4-T001` selesai: setiap produk aktif memiliki aksi `Kelola` untuk edit nama dan archive dengan confirm, query invalidation, toast feedback, serta modal responsive.
- Live Chrome: rename `PATCH 200`, archive fixture `DELETE 204`, refetch `GET 200`; nama baru bertahan setelah reload dan produk archived tidak tampil di daftar aktif.
- Desktop dan mobile 390x844 diverifikasi tanpa page overflow (`scrollWidth` sama dengan viewport); current-tab console errors `0`.
- Evidence: `screenshots/products-edit-delete-desktop.png` dan `screenshots/products-edit-delete-mobile-390x844.png`.
- Archive adalah soft delete terkontrol; resep dan histori HPP dipertahankan. Fixture `Produk Gambar Playwright` diarsipkan kembali setelah bukti live.
- Route transition sempat mencatat GET `ERR_ABORTED`, lalu retry `200`; tidak ada kegagalan final API pada flow sukses.

## Product Responsive Scope — 2026-08-25

- User meminta section Produk dirapikan untuk mobile, tablet, dan desktop.
- Mobile dan tablet memakai product card agar nama, metrik, Detail, dan Kelola terbaca tanpa horizontal scroll; desktop lebar memakai tabel katalog.

## Product Responsive Checkpoint — 2026-08-25

- `FE-P8-T001` dan `INT-P5-T001` selesai: breakpoint `<xl` memakai kartu, `xl+` memakai tabel, toolbar dan action spacing disesuaikan, serta `scope="col"` ditambahkan pada tabel.
- Live Chrome diverifikasi pada 390x844, 768x900, 1024x900, dan 1440x900; `scrollWidth` selalu sama dengan viewport.
- Modal `Edit & Hapus Produk` terbuka dan tetap berada dalam viewport pada 390, 768, dan 1440; current-tab console errors `0`.
- Evidence: `screenshots/products-responsive-mobile-390x844.png`, `screenshots/products-responsive-tablet-768x900.png`, `screenshots/products-responsive-desktop-1440x900.png`, dan `screenshots/products-responsive-modal-mobile-390x844.png`.
- Build frontend dan route generation `14/14` passed. Route transition masih dapat mencatat GET `ERR_ABORTED` sementara, lalu retry `200`.

## AI Chat Hitung HPP UI Checkpoint — 2026-08-26

- `AI-P0-T009` completed: UI menjadi chat satu kolom terfokus dengan empty suggestions, pertanyaan aktif, jawaban plain text incremental, composer sticky, typing cursor, cancel/retry, rolling idle timeout, serta state error yang memulihkan input.
- Root cause macet diperbaiki pada parser SSE bersama: buffer kini dikonsumsi dari state terbaru ketika beberapa event berada dalam satu network chunk, dan generator berhenti segera saat event `done` tanpa menunggu HTTP EOF.
- Live OpenRouter pada Chrome mobile 390x844 selesai 8,2 detik dengan 6 pertumbuhan teks parsial, HTTP 200, tenant terbaru benar, console error 0, dan tanpa horizontal overflow. Pembatalan request setelah `done` serta request route lama saat navigasi telah diperiksa sebagai `ERR_ABORTED` terkontrol.
- Regression: combined `token` + `done` satu chunk selesai 96 ms; mock socket yang ditahan setelah `done` selesai 201 ms; network error menampilkan retry dan mengaktifkan kembali input; frontend lint/typecheck/build 14/14, backend AI pytest 9/9, Ruff, Pyright 0 errors, dependency scan `SAFE_NO_KNOWN_IOC`, dan `git diff --check` passed.
- Visual/accessibility review lulus pada desktop 1440x900 dan mobile 390x844; semantic article/form/label, keyboard Enter/Shift+Enter, focus-visible, touch target, live region, dan reduced-motion dipertahankan. StyleSeed code score: 88/100.
- Evidence: `screenshots/ai-chat-empty-desktop-1440x900.png`, `screenshots/ai-chat-response-desktop-1440x900.png`, `screenshots/ai-chat-empty-mobile-390x844.png`, `screenshots/ai-chat-streaming-mobile-390x844.png`, dan `screenshots/ai-chat-response-mobile-390x844.png`.

## AI Chat History Checkpoint — 2026-08-27

- `AI-P0-T010` completed: history percakapan sesi berbasis Zustand menampilkan daftar pertanyaan, menyinkronkan jawaban streaming, memulihkan item terpilih, dan mempertahankan item saat Chat baru dibuat. Jawaban kini tampil seperti chat modern dengan paragraf, bold, list, inline code, dan code block React yang aman. State sengaja in-memory agar tidak bocor lintas tenant; persistence database/localStorage belum dibuka.
- Playwright membuktikan dua percakapan tersimpan, Chat baru mempertahankan item pertama, item pertama memulihkan jawaban, tanpa overflow horizontal. Lint/typecheck dan `git diff --check` passed; warning React pada test awal sudah diperbaiki dengan `answerRef` dan tidak muncul pada regression ulang.

## Cash Tracking Scope — 2026-08-27

- User menyetujui Cash Tracking manual sebagai integrasi post-MVP dengan PRD lama.
- Scope: satu saldo awal manual per business yang dapat diedit, satu entity transaksi dengan
  tipe `INCOME`/`EXPENSE`, nominal IDR positif, kategori/catatan teks opsional, edit, delete,
  dan ringkasan dashboard.
- Formula: `closing_balance = opening_balance + total_income - total_expense` pada periode aktif;
  default periode adalah bulan kalender berjalan.
- Tidak ada koneksi ATM, bank, e-wallet, POS, inventory, rekening kas, rekonsiliasi, atau
  profit/loss.
- Status checkpoint: `BE-P8-T001`, `BE-P8-T002`, `FE-P9-T001` sampai `FE-P9-T003`, dan
  `INT-P6-T001` completed. Frontend quality gates dan live desktop/mobile flow lulus;
  backend test suite Cash Tracking sebelumnya tetap mencatat 122 test lulus.

## Cash Tracking Validation Follow-up — 2026-08-28

- Playwright mobile 390x844 mengonfirmasi validasi nominal kosong dan saldo awal negatif
  menahan request mutasi; URL Dashboard/H1 valid, console error `0`, dan tidak ada overflow horizontal.
- Ditemukan aksesibilitas validation-focus: fokus tetap di tombol submit alih-alih field invalid.
  Temuan, langkah reproduksi, bukti request, dan screenshot dicatat di `fix/report-bug.md`.

## Phase Gates

| Phase | Gate | Dependencies | Verification |
| --- | --- | --- | --- |
| Phase 0 | Contract, schema, env, error shape, dan API base path terkunci | PRD section 0, 4.2, 4.3 | Review contract; backend schema validation; frontend typecheck |
| Phase 1 | Auth dan satu-business tenant isolation berjalan | Phase 0 | Auth/API tests; cross-business authorization test |
| Phase 2 | Catalog dan recipe version dapat dikelola | Phase 1 | CRUD tests; recipe activation/integrity tests |
| Phase 3 | HPP dan pricing deterministik | Phase 2 | Golden calculation tests; API contract tests; decimal assertions |
| Phase 4 | MVP siap pilot | Phase 3 | Typecheck, lint, build, E2E, accessibility, performance, security checks |
| Phase 5 | Cash Tracking manual siap diintegrasikan | Phase 4 dan section 4.6 PRD | Migration/API tests, tenant isolation, frontend quality gates, dan Playwright dashboard desktop/mobile |

## [FE] Frontend Tasks

Stack: Next.js App Router + TypeScript strict

| ID | Phase | Layer | Status | Task | Dependencies | Verification | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FE-P0-T001 | Phase 0 | FE | completed | Kunci typed frontend env, API base URL, root layout, dan protected route boundary sesuai `frontend/` | - | Typecheck passed; env in `lib/env.ts`, `html lang="id"` in root layout | Base config locked |
| FE-P0-T002 | Phase 0 | FE | completed | Integrasikan API client dan error handler ke frontend | BE-P0-T002, BE-P0-T005 | Typecheck passed; unified `apiClient` in `lib/api/client.ts` with httpOnly cookie forwarding | Unified client ready |
| FE-P0-T003 | Phase 0 | FE | completed | Buat shared decimal-string money type, IDR formatter, pagination type, dan semantic error parser | FE-P0-T002 | Typecheck passed; formatters in `lib/format.ts`, types in `lib/types/api.ts` | Presentation helper ready |
| FE-P0-T004 | Phase 0 | FE | completed | Siapkan feedback primitives untuk loading, empty, error, success, disabled, focus, dan reduced-motion | FE-P0-T001 | Component typecheck passed; `components/feedback/feedback-states.tsx` | Feedback states ready |
| FE-P1-T001 | Phase 1 | FE | completed | Buat route dan form register dengan validasi field serta handling duplicate/validation error | FE-P0-T001, FE-P0-T003, BE-P1-T004 | Form validation test; keyboard flow; `/register` verified | Auth register ready |
| FE-P1-T002 | Phase 1 | FE | completed | Buat route login/logout dan session-aware navigation untuk dashboard | FE-P0-T001, FE-P0-T003, BE-P1-T005 | Browser smoke test; `/login` and AppShell verified | Session navigation ready |
| FE-P1-T003 | Phase 1 | FE | completed | Buat request dan confirm reset-password flow dengan generic public response | FE-P0-T003, BE-P1-T006 | Form/error-state test; `/reset-password` verified | Reset password ready |
| FE-P1-T004 | Phase 1 | FE | completed | Buat business profile dan pricing settings page untuk IDR, target margin, rounding strategy, dan custom rounding | FE-P0-T004, BE-P1-T007 | Form/API integration; `/settings/business` verified | Business profile ready |
| FE-P2-T001 | Phase 2 | FE | completed | Buat ingredient list/create/edit flow dengan price history dan base unit | FE-P0-T002, FE-P0-T004, BE-P2-T005 | CRUD UI; `IngredientModal` created; `/ingredients` verified | Ingredient catalog ready |
| FE-P2-T002 | Phase 2 | FE | completed | Buat unit conversion editor dengan validasi positive factor dan direct base-unit rule | FE-P2-T001, BE-P2-T005 | Conversion factor validation in `IngredientModal` | Direct conversion ready |
| FE-P2-T003 | Phase 2 | FE | completed | Buat product/category/variant list and form flow termasuk packaging cost, direct cost, selling price, dan target margin | FE-P0-T003, FE-P0-T004, BE-P2-T006 | Form/API integration; `ProductModal` created; `/products` verified | Product & variant ready |
| FE-P2-T004 | Phase 2 | FE | completed | Buat recipe editor dan recipe-version lifecycle UI untuk draft, activate, dan archived | FE-P2-T001, FE-P2-T003, BE-P2-T007 | `RecipeModal` created; item addition/removal verified | Recipe lifecycle ready |
| FE-P3-T001 | Phase 3 | FE | completed | Buat HPP calculation action pada product variant melalui feature API boundary | FE-P2-T004, BE-P3-T003 | Typecheck passed; `calculateVariantHpp` in `lib/api/hpp.ts`, loading and action button in `/products/[id]` | Tidak menghitung HPP authoritative di client |
| FE-P3-T002 | Phase 3 | FE | completed | Buat cost breakdown dan HPP history view dengan price-as-of dan calculation version | FE-P3-T001, FE-P0-T004 | Typecheck/build passed; `CostBreakdown` & `HppHistoryTable` components created | Decimal string presentation only |
| FE-P3-T003 | Phase 3 | FE | completed | Buat price recommendation card dengan target margin, proposed price, rounding, dan draft status | FE-P3-T001, BE-P3-T004 | Typecheck/build passed; `PriceRecommendationCard` & `ScenarioComparisonTable` created with confirmation modal | Apply price tetap aksi eksplisit |
| FE-P3-T004 | Phase 3 | FE | completed | Buat discount simulation form dan hasil net price/margin tanpa mutasi harga | FE-P3-T003, BE-P3-T005 | Typecheck/build passed; `DiscountSimulationForm` with >=100% rejection & loss banner | Client hanya presentation |
| FE-P3-T005 | Phase 3 | FE | completed | Terapkan semantic status, error-code mapping, money formatting, dan focus states pada seluruh flow HPP/Pricing | FE-P3-T001, FE-P3-T002, FE-P3-T003, FE-P3-T004 | Typecheck passed; lint passed (0 errors/warnings); Next.js build (12/12 routes) passed | Semantic error mapping in `lib/api/error-mapper.ts` |
| FE-P4-T001 | Phase 4 | FE | completed | Audit seluruh MVP flow untuk loading, empty, error, success, disabled, hover, focus, responsive, dan reduced motion | FE-P1-T001, FE-P2-T004, FE-P3-T005 | Verified on all routes; prefers-reduced-motion in globals.css; 0 console errors on navigation | All 9 state primitives verified |
| FE-P4-T002 | Phase 4 | FE | completed | Buat Playwright E2E flow register/login → ingredient → product → recipe → HPP → pricing | FE-P4-T001, BE-P4-T001 | 11 desktop & mobile screenshots captured in `screenshots/`; E2E spec in `frontend/tests/e2e-pilot-flow.spec.ts` | Proof in `screenshots/` |
| FE-P4-T003 | Phase 4 | FE | completed | Jalankan frontend typecheck, lint, build, dan perbaiki issue yang ditemukan | FE-P4-T002 | `npx tsc --noEmit` 0 errors, `npm run lint` 0 errors/warnings, `npm run build` 13/13 routes passed | Frontend MVP 100% complete; handoff frontend agent diterima |
| FE-P4-T004 | Phase 4 | FE | completed | Tambahkan global action feedback dan real query-driven loading states untuk auth/session/dashboard | FE-P4-T001, FE-P4-T003, INT-P1-T003 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, dan Playwright auth desktop/mobile passed; success/error toast dan `isPending` skeleton verified; no artificial loading delay | Toast top-center memakai existing Radix UI; evidence disimpan di `screenshots/`; next UI updates menunggu prioritas user |
| FE-P5-T001 | Phase 5 | FE | completed | Tambahkan product image picker, preview, replace/remove, fallback, alt text, dan responsive image presentation pada modal/list/detail | FE-P4-T004, BE-P5-T002, INT-P2-T001 | `npm run lint`, `npx tsc --noEmit`, `npm run build` passed; Playwright modal/list/detail desktop dan mobile passed | Satu gambar per produk; tidak mengubah layout mobile menjadi overflow |
| FE-P6-T001 | Phase 6 | FE | completed | Tambahkan action edit nama bahan baku, detail histori harga, delete histori dengan confirm, invalidation, dan responsive state | FE-P2-T001, BE-P6-T001 | `npm run lint`, `tsc --noEmit`, `npm run build`, `git diff --check`, dan Playwright desktop/mobile passed; rename/delete live flow verified | Evidence in `screenshots/ingredients-edit-history-*.png`; fokus UI pada rename dan delete satu price-history row |
| FE-P7-T001 | Phase 7 | FE | completed | Tambahkan action edit nama dan hapus/archive produk dari daftar Produk dengan confirm, invalidation, feedback, dan responsive state | FE-P2-T003, BE-P7-T001 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, dan Playwright desktop/mobile passed; live PATCH/DELETE/refetch verified | Hapus memakai archive agar resep dan histori HPP tetap aman |
| FE-P8-T001 | Phase 8 | FE | completed | Rapikan section Produk untuk mobile, tablet, dan desktop dengan product card responsive, tabel desktop, toolbar spacing, dan semantic table headers | FE-P7-T001 | `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, serta screenshot Chrome 390/768/1440 passed | Breakpoint `<xl` mengutamakan scanability dan action visibility; `xl+` mempertahankan katalog tabel |
| FE-P9-T001 | Phase 9 | FE | completed | Tambahkan form atur dan edit saldo awal manual pada dashboard dengan validasi IDR non-negatif, feedback, dan query invalidation | FE-P4-T004, BE-P8-T001 | `tsc --noEmit`, ESLint, build passed; live keyboard form flow and success feedback verified | Saldo manual tidak terhubung ke ATM, bank, atau e-wallet |
| FE-P9-T002 | Phase 9 | FE | completed | Tambahkan form pemasukan/pengeluaran, edit, delete confirmation, kategori/catatan opsional, dan feedback memakai primitive existing | FE-P9-T001, BE-P8-T001 | `tsc --noEmit`, ESLint, build passed; live create/edit/delete, validation, confirmation, mutation feedback, and responsive check passed | Satu entity transaksi dengan tipe `INCOME`/`EXPENSE`; tanpa dependency baru |
| FE-P9-T003 | Phase 9 | FE | completed | Tambahkan section `Catatan Kas` pada dashboard dengan filter periode, saldo awal, total income, total expense, net cashflow, closing balance, dan daftar transaksi terbaru | FE-P9-T002, BE-P8-T001 | `tsc --noEmit`, ESLint, Next build 14/14 routes passed; semantic loading/empty/error/success states, desktop/mobile screenshots, and no-overflow check passed | Reuse Card, formatter IDR, TanStack Query, toast, dan dashboard layout existing |

## [BE] Backend Tasks

Stack: FastAPI + Python typed, SQLAlchemy 2.x async, Alembic, PostgreSQL

| ID | Phase | Layer | Status | Task | Dependencies | Verification | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BE-P0-T001 | Phase 0 | BE | completed | Definisikan typed settings, `.env.example`, database URL, cookie flags, CORS, IDR default, dan rate-limit config | - | `pip-audit` no known vulnerabilities; pytest 4 passed; Ruff check/format passed; Pyright 0 errors | Dependency set locked in `backend/uv.lock`; no secrets committed |
| BE-P0-T002 | Phase 0 | BE | completed | Siapkan FastAPI app entrypoint, health endpoint, router registry, dan base path `/api/v1` | BE-P0-T001 | Async API test: 5 passed; Ruff check/format passed; Pyright 0 errors; `/api/v1/health` dan OpenAPI path verified | OpenAPI menjadi source contract |
| BE-P0-T003 | Phase 0 | BE | completed | Siapkan SQLAlchemy async engine/session, DeclarativeBase, migration config, dan PostgreSQL NUMERIC policy | BE-P0-T001 | 8 tests passed; Ruff check/format passed; Pyright 0 errors; asyncpg engine/session and Alembic config verified | Money `NUMERIC(18,4)`; quantity `NUMERIC(18,6)`; production schema via Alembic |
| BE-P0-T004 | Phase 0 | BE | completed | Definisikan shared Decimal helpers, money serialization, domain enums, ID type, dan timestamp policy | BE-P0-T001 | 11 tests passed; Ruff check/format passed; Pyright 0 errors | Decimal rejects float/non-finite values; UTC-aware timestamps; PRD enum contract; IDR money serialization |
| BE-P0-T005 | Phase 0 | BE | completed | Implementasikan error response schema, semantic error codes, exception handlers, dan requestId propagation | BE-P0-T002, BE-P0-T004 | 14 tests passed; Ruff check/format passed; Pyright 0 errors; 4xx/5xx errors sanitized and request ID propagated | Error envelope uses `requestId`; internal exception details are logged server-side only |
| BE-P0-T006 | Phase 0 | BE | completed | Implementasikan shared pagination schema, query bounds, request context, dan tenant-scope dependency skeleton | BE-P0-T002, BE-P0-T004 | 17 tests passed; Ruff check/format passed; Pyright 0 errors; page/page_size bounds and unauthenticated tenant scope verified | Default page 1, page_size 20, maximum 100; tenant context requires authenticated user and business |
| BE-P1-T001 | Phase 1 | BE | completed | Buat User dan AuthSession model/migration dengan unique lowercase email, OWNER role, expiry, dan revoke support | BE-P0-T003, BE-P0-T004 | 20 tests passed; Ruff check/format passed; Pyright 0 errors; Alembic offline upgrade/downgrade SQL generated; constraints inspected | Lowercase email check, unique token hash, OWNER enum, expiry/revoke timestamps; No OAuth |
| BE-P1-T002 | Phase 1 | BE | completed | Buat Business dan BusinessPricingSetting model/migration dengan unique owner, one-to-one setting, IDR, dan default margin | BE-P1-T001 | 22 tests passed; Ruff check/format passed; Pyright 0 errors; Alembic offline upgrade/downgrade SQL generated; constraints inspected | Unique owner and setting; IDR-only; margin `[0,1)`; default margin `0.3000`; default rounding `NEAREST_100` |
| BE-P1-T003 | Phase 1 | BE | completed | Implementasikan password hashing Argon2id, session token lifecycle, cookie policy, dan password-reset token primitives | BE-P1-T001, BE-P0-T005 | 25 tests passed; Ruff check/format passed; Pyright 0 errors; Argon2id, token expiry/revoke, and cookie flags verified | Raw tokens are hashed with SHA-256 for storage and only sent via HttpOnly cookie; pwdlib Context7 match unavailable, installed API inspected directly |
| BE-P1-T004 | Phase 1 | BE | completed | Implementasikan register service/router yang membuat user, business, pricing setting, dan session secara atomik | BE-P1-T002, BE-P1-T003, BE-P0-T005 | 28 tests passed; Ruff check/format passed; Pyright 0 errors; register route, duplicate rollback, cookie, and no-token-body verified | Router -> service -> repository; transaction creates user, business, pricing setting, and auth session |
| BE-P1-T005 | Phase 1 | BE | completed | Implementasikan login, logout, current-session dependency, dan protected route behavior | BE-P1-T003, BE-P1-T004 | 32 tests passed; Ruff check/format passed; Pyright 0 errors; login cookie, generic wrong-password error, protected `/auth/me`, logout revoke/clear-cookie, expired-session rejection verified | Cookie httpOnly/Secure production |
| BE-P1-T006 | Phase 1 | BE | completed | Implementasikan request/confirm reset-password flow dengan one-time expiry dan generic public response | BE-P1-T003, BE-P1-T005, BE-P0-T005 | 38 tests passed; Ruff check/format passed; Pyright 0 errors; request/confirm flow, generic unknown-account response, one-time/expired token, session revocation, rate limit, and Alembic offline upgrade/downgrade verified | Reset token is never returned by HTTP response; delivery adapter remains outside current PRD contract; process-local limiter is documented ceiling |
| BE-P1-T007 | Phase 1 | BE | completed | Implementasikan business ownership dependency dan authorization query guard untuk semua business entity | BE-P1-T002, BE-P1-T005, BE-P0-T006 | 41 tests passed; Ruff check/format passed; Pyright 0 errors; authenticated business dependency, missing-context rejection, business owner/id scope, and pricing-setting business scope verified | Repositories must pass business ID from authenticated context; client-supplied businessId is not trusted |
| BE-P2-T001 | Phase 2 | BE | completed | Buat Ingredient, IngredientPriceHistory, dan IngredientUnitConversion model/migration dengan precision dan positive constraints | BE-P1-T002, BE-P0-T003, BE-P0-T004 | 44 tests passed; Ruff check/format passed; Pyright 0 errors; NUMERIC precision, positive constraints, tenant FK cascade, direct conversion uniqueness, and Alembic offline upgrade/downgrade verified | `current_unit_cost` is nullable presentation cache; effective price remains history source of truth |
| BE-P2-T002 | Phase 2 | BE | completed | Buat ProductCategory, Product, dan ProductVariant model/migration termasuk packaging/direct cost dan target margin | BE-P1-T002, BE-P0-T003, BE-P0-T004 | 48 backend tests passed; Ruff check/format passed; Pyright 0 errors; Alembic offline upgrade/downgrade verified; enum, FK, unique, margin, and non-negative cost constraints inspected | Added `0005_products`; Product status ACTIVE/ARCHIVED; category delete sets product category NULL; CRUD remains BE-P2-T006 |
| BE-P2-T003 | Phase 2 | BE | completed | Buat RecipeVersion dan RecipeItem model/migration dengan version uniqueness, item uniqueness, dan lifecycle enum | BE-P2-T001, BE-P2-T002, BE-P0-T003 | 51 backend tests passed; Ruff check/format passed; Pyright 0 errors; Alembic `0006_recipes` offline upgrade/downgrade verified; lifecycle, FK, uniqueness, and positive quantity constraints inspected | Recipe status DRAFT/ACTIVE/ARCHIVED; ingredient FK uses RESTRICT to preserve recipe history |
| BE-P2-T004 | Phase 2 | BE | completed | Buat Overhead model/migration dengan MANUAL_PER_UNIT dan non-negative per-unit amount | BE-P1-T002, BE-P0-T003, BE-P0-T004 | 53 backend tests passed; Ruff check/format passed; Pyright 0 errors; Alembic `0007_overheads` offline upgrade/downgrade verified; allocation enum, tenant FK, uniqueness, and non-negative amount inspected | Monthly allocation ditunda; all overhead rows are calculation-active in MVP |
| BE-P2-T005 | Phase 2 | BE | completed | Implementasikan ingredient CRUD, price history, unit conversion service/repository/router dengan tenant scope | BE-P2-T001, BE-P1-T007, BE-P0-T005 | 59 backend tests passed; Ruff check/format passed; Pyright 0 errors; Alembic `0008_ingredient_archive` offline upgrade/downgrade verified; pagination, validation, tenant scope, price normalization, and archive behavior tested | Effective price remains history source of truth; delete archives ingredient to preserve cost history |
| BE-P2-T006 | Phase 2 | BE | completed | Implementasikan category/product/variant CRUD service/repository/router dengan target margin validation | BE-P2-T002, BE-P1-T007, BE-P0-T005 | 64 backend tests passed; Ruff check/format passed; Pyright 0 errors; OpenAPI product/category/variant paths verified; duplicate, archive, margin, frontend payload, and tenant-scope tests passed | IDR decimal values use Decimal at service/model boundary; product delete archives to preserve recipe/cost references |
| BE-P2-T007 | Phase 2 | BE | completed | Implementasikan recipe draft/edit/activate service/repository/router dengan atomic single-active transition | BE-P2-T003, BE-P2-T005, BE-P2-T006, BE-P1-T007 | 68 backend tests passed; Ruff check/format passed; Pyright 0 errors; Alembic `0006_recipes` offline upgrade/downgrade verified with partial unique active index; draft/edit, item/unit validation, tenant scope, and single-active transition tested | Activation locks variant and archives prior active version; database unique index backs concurrency safety |
| BE-P2-T008 | Phase 2 | BE | completed | Tambahkan domain integrity tests untuk ingredient, product, recipe, overhead, delete/archive, dan tenant boundaries | BE-P2-T004, BE-P2-T005, BE-P2-T006, BE-P2-T007 | 72 backend tests passed; Ruff check/format passed; Pyright 0 errors; archive/reference edges, partial active recipe index, and tenant-scoped catalog/recipe query tests passed | Archive preserves cost history; cross-business queries are rejected by repository scope |
| BE-P3-T001 | Phase 3 | BE | completed | Implementasikan effective-price resolver dan direct unit-normalization service berdasarkan `effective_at` | BE-P2-T005, BE-P2-T007 | 75 backend tests passed; Ruff check/format passed; Pyright 0 errors; latest `effective_at`, price-as-of cutoff, missing price, direct/reverse conversion, invalid unit, Decimal cost, and tenant errors tested | `EffectivePriceResolver` is the single source for historical price and base-unit normalization |
| BE-P3-T002 | Phase 3 | BE | completed | Implementasikan HPP domain calculation service untuk ingredient, packaging, direct, dan manual overhead cost | BE-P2-T004, BE-P2-T007, BE-P3-T001 | 78 backend tests passed; Ruff check/format passed; Pyright 0 errors; golden Decimal formula, final quantization, inactive recipe, tenant overhead, allocation, and variant mismatch tests passed | Formula: ingredient + packaging + direct + manual per-unit overhead; calculation version `hpp-v1` |
| BE-P3-T003 | Phase 3 | BE | completed | Buat ProductCostVersion persistence dan HPP calculation/history API dengan priceAsOf dan calculationVersion | BE-P3-T002, BE-P1-T007, BE-P0-T005, BE-P0-T006 | 83 backend tests passed; Ruff check/format passed; Pyright 0 errors; Alembic `0009_cost_versions` offline upgrade/downgrade verified; calculation persistence, camelCase decimal response, pagination, immutable history, and tenant/active-recipe guards tested | Cost history is append-only; product/recipe references use `RESTRICT` to protect audit records |
| BE-P3-T004 | Phase 3 | BE | completed | Implementasikan cost-plus margin recommendation service/API dan rounding strategy NONE/NEAREST_100/CUSTOM | BE-P3-T003, BE-P2-T006 | 90 backend tests passed; Ruff check/format passed; Pyright 0 errors; Alembic `0010_recommendation_drafts` offline upgrade/downgrade verified; formula, three rounding strategies, invalid margin, draft status, scenario, and no-mutation tests passed | Recommendation remains DRAFT and never writes `selling_price` |
| BE-P3-T005 | Phase 3 | BE | completed | Implementasikan discount simulation service/API tanpa mutasi selling price dan dengan invalid net-price guard | BE-P3-T004, BE-P0-T005 | 95 backend tests passed; Ruff check/format passed; Pyright 0 errors; Decimal net price/profit/margin/loss, override price, >=100% rejection, zero-price guard, tenant scope, and no-mutation tests passed | Simulation is read-only and does not persist or modify selling price |
| BE-P3-T006 | Phase 3 | BE | completed | Tambahkan golden scenario, OpenAPI schema assertions, semantic error coverage, dan calculation audit record | BE-P3-T003, BE-P3-T004, BE-P3-T005 | 97 backend tests passed; Ruff check/format passed; Pyright 0 errors; Alembic `0011_audit_logs` offline downgrade verified; golden HPP, OpenAPI alias/path, semantic error, immutable cost, and actor/request audit assertions passed | HPP calculation audit stores actor, action, entity, entity ID, timestamp, and request ID |
| BE-P4-T001 | Phase 4 | BE | completed | Jalankan security tests untuk session, password reset, tenant isolation, IDOR, rate limit, dan error leakage | BE-P1-T006, BE-P1-T007, BE-P3-T006 | 22 security/domain tests passed; session/cookie, reset token one-time and rate limit, tenant/IDOR scope, error sanitization, and archive boundary verified | No cross-business access observed; no internal error detail or raw token leaked |
| BE-P4-T002 | Phase 4 | BE | completed | Jalankan edge-case tests untuk empty recipe, missing price, invalid unit, duplicate data, concurrent activation, dan archive references | BE-P2-T008, BE-P3-T006 | 40 edge-case/domain tests passed; empty recipe, missing price, invalid unit, duplicate data, activation transition, and archive/reference boundaries verified | Validation and historical references remain protected |
| BE-P4-T003 | Phase 4 | BE | completed | Verifikasi pagination, query performance, p95 target, timeout handling, dan database conflict behavior pada dataset pilot | BE-P3-T003, BE-P3-T005 | 101 backend tests passed; live ephemeral PostgreSQL 16 pilot dataset 100 products, 100 variants, 100 ingredients, 10 overheads; HPP calculation p95 11.60 ms and HPP history p95 8.30 ms (<500 ms); timeout config/504 sanitization and database conflict behavior verified; Alembic full offline upgrade/downgrade passed | Live p95 executed against an ephemeral PostgreSQL 16 runtime; auth transaction boundary fixed after real DB smoke caught SQLAlchemy autobegin conflict; temporary runtime removed |
| BE-P4-T004 | Phase 4 | BE | completed | Lengkapi migration/backup-restore runbook, structured logging, requestId, OpenAPI export, dan CI verification command | BE-P4-T001, BE-P4-T002, BE-P4-T003 | 101 backend tests passed; Ruff check/format and Pyright 0 errors; JSON structured formatter and requestId log/response parity tested; OpenAPI export validated; `scripts/verify_backend.sh` passed; Alembic full offline upgrade/downgrade generated | Runbook in `docs/backend-runbook.md`; no external provider required for CI verification |
| BE-P5-T001 | Phase 5 | BE | completed | Tambahkan product image metadata, Alembic migration, media directory config, dan named Docker volume tanpa menyimpan binary pada response katalog | BE-P4-T004 | Migration `0012_product_images` applied in Docker; `product_media` mounted at `/app/media`; full pytest, Ruff, dan Pyright passed | Binary tetap di volume lokal; katalog hanya mengembalikan `image_url` |
| BE-P5-T002 | Phase 5 | BE | completed | Implementasikan upload/delete/serve image API dengan auth tenant scope, size/MIME/signature validation, random filename, dan sanitized error | BE-P5-T001, BE-P1-T007 | Storage tests untuk signature/size/path passed; live PUT/GET/DELETE image `200/200/204`; payload signature palsu live `422`; cache-busting version image verified | Allowlist JPG/PNG/WebP, maksimal 5 MB, SVG ditolak |
| BE-P6-T001 | Phase 6 | BE | completed | Tambahkan delete price-history API/service/repository dengan tenant guard, recompute current cache, not-found handling, dan regression tests; pertahankan PATCH rename existing | BE-P2-T005, BE-P3-T001, BE-P4-T004 | Full pytest passed; Ruff check/format passed; Pyright 0 errors; OpenAPI delete path and current-cache recomputation regression verified | Hard delete hanya untuk histori harga yang dipilih; HPP tetap menolak bila tidak ada effective price |
| BE-P7-T001 | Phase 7 | BE | completed | Konfirmasi dan regression-check kontrak PATCH rename serta DELETE archive produk dengan tenant guard | BE-P2-T006, BE-P4-T002 | Existing `ProductService.update_product` dan `archive_product`, route OpenAPI, tenant-scoped repository, dan archive regression test sudah tersedia; tidak perlu migration | DELETE produk adalah archive terkontrol, bukan hard delete |
| BE-P8-T001 | Phase 8 | BE | completed | Buat `CashBalance` one-to-one per business dan `CashTransaction` dengan migration Alembic, schema, repository, service, CRUD API, tenant guard, dan period summary | BE-P4-T004, BE-P1-T007 | 122 backend tests passed; Ruff check/format and Pyright 0 errors; OpenAPI paths, Decimal serialization/validation, tenant queries, Alembic offline upgrade/downgrade verified | `INCOME`/`EXPENSE`; opening balance non-negative; closing balance = opening balance + income - expense; tidak ada integrasi eksternal |
| BE-P8-T002 | Phase 8 | BE | completed | Tambahkan domain/security regression tests untuk saldo manual, transaksi, summary, pagination, edit/delete, audit log, dan cross-business isolation | BE-P8-T001 | Cash-specific contract/domain tests passed; full pytest 122 passed; constraint, audit, date range, pagination, and cross-business isolation checks covered | Hard delete transaksi manual terkontrol; HPP history tidak bergantung pada transaksi kas |

## [AI] OpenRouter Integration Tasks

Stack: FastAPI + `httpx` + OpenRouter Chat Completions SSE + Next.js client stream

| ID | Phase | Layer | Status | Task | Dependencies | Verification | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI-P0-T001 | Post-MVP | AI/BE | completed | Tambahkan typed OpenRouter env, default `openrouter/free`, server-side provider service, auth-protected `/api/v1/ai/stream`, bounded prompt, timeout, error mapping, dan cancellation-safe SSE | BE-P4-T004 | 6 focused pytest passed; Ruff/Pyright passed; OpenAPI path registered; provider key tidak pernah masuk response/log | Tidak menambah SDK; `httpx` existing dipakai; API key hanya backend env |
| AI-P0-T002 | Post-MVP | AI/FE | completed | Hubungkan halaman AI Assistant ke POST SSE dengan incremental answer, loading/disabled, error, cancel, retry, dan accessible live region | AI-P0-T001, FE-P4-T004 | Frontend lint, typecheck, dan build passed; browser unconfigured state verified under AI-P0-T003 | Menghapus submit mock yang tidak melakukan request |
| AI-P0-T003 | Post-MVP | AI/FE/BE | skipped | Verifikasi integrasi OpenRouter structured output secara live pada Chrome desktop/mobile dan cek URL, network, console, response stream, no-overflow, serta screenshot | AI-P0-T001, AI-P0-T002 | Dihentikan oleh keputusan user 2026-08-25 | Structured analyst UI diganti chat streaming biasa pada AI-P0-T009 |
| AI-P0-T004 | Post-MVP | AI/BE | skipped | Ubah kontrak AI menjadi structured analyst analysis yang tervalidasi dari konteks bisnis: periode, summary margin/HPP, metrik delta, penyebab utama, rekomendasi berurutan, insight, dan sumber data | AI-P0-T003 | Dihentikan oleh keputusan user 2026-08-25 | Snapshot DB tenant tetap dipertahankan; JSON schema output dihapus pada AI-P0-T009 |
| AI-P0-T005 | Post-MVP | AI/FE | skipped | Render structured AI analysis menjadi analyst cards responsif sesuai referensi: header, source badge, summary, metric cards, causes, priority recommendations, insight, loading/error/empty state | AI-P0-T004 | Dihentikan oleh keputusan user 2026-08-25 | Diganti jawaban chat teks rapi tanpa analyst cards |
| AI-P0-T006 | Post-MVP | AI/FE | skipped | Ganti skeleton loading AI dengan vertical process timeline yang melacak tahap persiapan konteks, analisis, dan penyusunan rekomendasi sampai response selesai/error | AI-P0-T002 | Dihentikan oleh keputusan user 2026-08-25 | Timeline dan icon proses dihapus karena menambah persepsi lag/stuck |
| AI-P0-T007 | Post-MVP | AI/FE | skipped | Hentikan loading AI secara deterministik saat SSE provider idle/terputus; tampilkan error retryable dan cegah request lama mengunci input | AI-P0-T002, AI-P0-T006 | Diserap AI-P0-T009 | Fixed total timeout diganti rolling idle timeout yang reset setiap chunk |
| AI-P0-T008 | Post-MVP | AI/FE/BE | completed | Cegah jawaban lama/tidak relevan dengan snapshot data tenant terbaru per request, cache bypass, stale-response guard, dan penghapusan konteks demo hardcoded | AI-P0-T001, AI-P0-T002 | AI pytest 9/9, Ruff, Pyright 0 errors, frontend lint/typecheck/build 14/14, backend container healthy; live authenticated SSE tenant baru memuat nama bisnis snapshot terbaru, `analysis`, `done`, dan `no-store`; tenant uji dihapus | Request hanya menyimpan pertanyaan aktif; snapshot DB tenant dibatasi 20 row per kelompok; konteks/percakapan demo lama dihapus |
| AI-P0-T009 | Post-MVP | AI/FE/BE | completed | Perbaiki UI section AI Chat Hitung HPP dan ganti structured analyst/timeline menjadi chat teks streaming incremental seperti ChatGPT dengan typing cursor, rolling idle timeout, cancel/retry, dan jawaban teks rapi | AI-P0-T008 | Frontend lint/typecheck/build 14/14; backend AI pytest 9/9, Ruff, Pyright 0 errors; live OpenRouter mobile 390x844 HTTP 200, 6 partial updates, selesai 8,2 detik, tenant benar, console 0, no overflow; combined-event regression 96 ms; held-socket-after-done 201 ms; error/retry passed; desktop/mobile screenshots; StyleSeed 88/100 | Tanpa dependency baru; parser SSE mengonsumsi buffer terbaru dan berhenti pada `done`; snapshot DB tenant serta SSE security dipertahankan; test tenant dihapus |
| AI-P0-T010 | Post-MVP | AI/FE | completed | Tambahkan history chat sesi berbasis Zustand: daftar percakapan, pemulihan item, sinkronisasi jawaban streaming, dan Chat baru tanpa menghapus history | AI-P0-T009 | Playwright: 2 history items, Chat baru mempertahankan item pertama, selection memulihkan jawaban, no overflow; lint/typecheck dan `git diff --check` passed | In-memory session state sengaja dipilih; maksimal 20 item; persistence database/localStorage belum dibuka |

## [INT] Frontend–Backend Integration Tasks

Stack: Next.js App Router + TypeScript strict + React Hook Form + TanStack Query + Zustand + Axios + FastAPI `/api/v1`

| ID | Phase | Layer | Status | Task | Dependencies | Verification | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| INT-P0-T001 | Integration | FE/BE | completed | Kunci shared Axios API client, typed API contract, TanStack Query provider, Zustand client state, dan runtime API boundary | FE-P0-T002, BE-P0-T002, BE-P0-T005 | Dependency audit `SAFE_NO_KNOWN_IOC`; frontend `tsc`, ESLint, production build 13/13; backend 101 pytest, Ruff, Pyright; OpenAPI business path passed | Use httpOnly cookie forwarding; no client token storage |
| INT-P0-T002 | Integration | FE | completed | Hubungkan auth/session dan seluruh form auth/settings memakai React Hook Form; hapus fallback mock/offline redirect | INT-P0-T001, FE-P1-T004, BE-P1-T005 | RHF/TanStack Query source connected; live register/session/settings/logout/login browser flow passed with httpOnly cookie; no mock/offline redirect | Runtime verified with Docker PostgreSQL + FastAPI |
| INT-P1-T001 | Integration | FE | completed | Hubungkan ingredient, product, variant, recipe, dan conversion CRUD memakai TanStack Query mutations/invalidation | INT-P0-T002, FE-P2-T004, BE-P2-T007 | Live browser created ingredient, product, draft recipe, activated recipe, and reloaded API-backed lists; PostgreSQL persistence verified; service response eager-load regressions fixed | Tenant-scoped API responses preserved |
| INT-P1-T002 | Integration | FE | completed | Hubungkan HPP history, pricing recommendation, discount simulation, dashboard, dan reports ke API server state | INT-P1-T001, FE-P3-T005, BE-P3-T005 | Live browser HPP/history, dashboard, pricing recommendation, and discount simulation passed with backend Decimal responses; reports remains roadmap because no MVP aggregate endpoint exists | No client-side authoritative calculation; reports intentionally post-MVP |
| INT-P1-T003 | Integration | FE/BE | completed | Verifikasi MVP end-to-end live dengan PostgreSQL, console/network checks, responsive smoke, dan full quality gates | INT-P1-T002, BE-P4-T003, FE-P4-T003 | Docker Compose PostgreSQL/backend healthy; API/Next health 200; Alembic `0011_audit_logs` head; browser desktop/mobile evidence; current-tab console 0 errors; backend 101 pytest/Ruff/Pyright; frontend tsc/ESLint/build 13/13; `git diff --check` passed | Integration MVP gate passed; reports/AI remain out of MVP scope |
| INT-P2-T001 | Integration | FE/BE | completed | Hubungkan binary image upload, query invalidation, dan alur create/edit/detail product image dengan typed API contract | FE-P5-T001, BE-P5-T002 | Live create `POST 201` + image `PUT 200`, list/detail `GET 200`, replace `PUT 200`, remove `DELETE 204`; list/detail invalidation verified | Jika upload gagal setelah product tersimpan, UI memberi retryable feedback |
| INT-P2-T002 | Integration | FE/BE | completed | Jalankan backend tests, frontend lint/typecheck/build, dan Playwright Chrome desktop/mobile untuk upload, replace, remove, auth, network, console, serta screenshots | INT-P2-T001 | Full backend pytest/Ruff/Pyright; frontend lint/tsc/build; Playwright desktop/mobile screenshots; final console errors `0` | Evidence: `screenshots/product-image-desktop.png`, `screenshots/product-image-mobile-390x844.png`, dan `screenshots/product-image-list-desktop.png`; satu route-transition GET sempat `ERR_ABORTED` lalu retry `200` |
| INT-P3-T001 | Integration | FE/BE | completed | Verifikasi live rename ingredient dan delete price history di Chrome desktop/mobile dengan network, console, persistence, dan screenshot evidence | FE-P6-T001, BE-P6-T001 | Live `POST 201` fixture, `PATCH 200`, price-history `DELETE 204`, refetch `GET 200`, refresh persistence, mobile no-overflow, console errors `0`, dan screenshots passed | Test ingredient diarsipkan setelah verifikasi; route-transition GET `ERR_ABORTED` retry `200` |
| INT-P4-T001 | Integration | FE/BE | completed | Verifikasi live edit nama dan archive produk di Chrome desktop/mobile dengan network, console, persistence, dan screenshot evidence | FE-P7-T001, BE-P7-T001 | Live `PATCH 200`, archive `DELETE 204`, refetch `GET 200`, refresh persistence, mobile no-overflow, console errors `0`, dan screenshots passed | Test product diarsipkan setelah verifikasi; route-transition GET `ERR_ABORTED` retry `200` |
| INT-P5-T001 | Integration | FE/BE | completed | Verifikasi responsive section Produk di Chrome mobile, tablet, dan desktop termasuk action modal, overflow, console, dan screenshot evidence | FE-P8-T001, BE-P7-T001 | Live 390x844, 768x900, 1024x900, 1440x900; modal dialog bounds valid; page no-overflow; console errors `0`; screenshots passed | Product API read/refetch `200`; route-transition abort bersifat sementara dan retry berhasil |
| INT-P6-T001 | Integration | FE/BE | completed | Integrasikan Cash Tracking API ke dashboard, invalidation setelah saldo/transaksi berubah, dan verifikasi live create/edit/delete/summary pada desktop dan mobile | FE-P9-T003, BE-P8-T002 | Ephemeral backend migrated to `0013_cash_tracking`; register `201`, balance `200`, create `201`, edit `200`, delete `204`, summary/list refetch `200`; dashboard URL/H1 valid, console error `0`, mobile overflow `false`, persistence and screenshots passed. Initial reload `ERR_ABORTED` requests were followed by successful cash responses. | Tidak ada koneksi ATM/bank/e-wallet; evidence di `screenshots/cash-tracking-*.png`; port `8000` existing service lama tidak dipakai karena tidak memuat route cash |

## Execution Rules

1. Section `[FE]`, `[BE]`, dan `[INT]` adalah sumber status atomic task.
2. Tag layer pada setiap row wajib dipertahankan: `FE`, `BE`, atau `FE/BE`.
3. Hanya satu task boleh `in_progress` pada satu waktu.
4. Task berikutnya tidak dimulai sebelum verification task aktif berhasil.
5. Semua perubahan schema production memakai Alembic.
6. AI dan modul ERP tetap di luar MVP core; AI hanya dikerjakan pada section `[AI]` setelah task dibuka eksplisit.
