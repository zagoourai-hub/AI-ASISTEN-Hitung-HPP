# Task Tracker — HPP Pintar v2.0

Source PRD: `PRD.md`
Profile/Stack: Next.js + TypeScript, FastAPI + Python, PostgreSQL, OpenAPI
Last Updated: 2026-08-22 02:21 WIB

## Scope Lock

- MVP: Core HPP + Pricing.
- Repository boundary: `frontend/` dan `backend/`.
- One user owns one business; currency MVP IDR.
- HPP uses the latest effective ingredient price and backend Decimal arithmetic.
- AI, inventory, POS, finance, reporting, competitor pricing, dan delivery fee are post-MVP.
- Frontend Phase 0-4 dan Backend Phase 0-4 sudah selesai; handoff frontend dari agent terpisah tercatat pada task rows dan bukti verifikasinya dipertahankan.

## Summary

- Total: 51
- Frontend: 20 (20 completed, 0 pending)
- Backend: 31 (31 completed, 0 pending)
- Completed: 51
- In Progress: 0
- Pending: 0
- Blocked: 0
- Skipped: 0

## Final Checkpoint — 2026-08-22

- Frontend: 20/20 task completed melalui handoff agent frontend; typecheck, lint, production build, dan Playwright evidence tercatat pada tracker.
- Backend: 31/31 task completed; 101 tests, Ruff, Pyright, OpenAPI, Alembic offline, dan live PostgreSQL pilot tercatat pada tracker.
- Dokumentasi ini disinkronkan setelah kedua layer selesai; tidak ada source task baru yang dibuka.

## Phase Gates

| Phase | Gate | Dependencies | Verification |
| --- | --- | --- | --- |
| Phase 0 | Contract, schema, env, error shape, dan API base path terkunci | PRD section 0, 4.2, 4.3 | Review contract; backend schema validation; frontend typecheck |
| Phase 1 | Auth dan satu-business tenant isolation berjalan | Phase 0 | Auth/API tests; cross-business authorization test |
| Phase 2 | Catalog dan recipe version dapat dikelola | Phase 1 | CRUD tests; recipe activation/integrity tests |
| Phase 3 | HPP dan pricing deterministik | Phase 2 | Golden calculation tests; API contract tests; decimal assertions |
| Phase 4 | MVP siap pilot | Phase 3 | Typecheck, lint, build, E2E, accessibility, performance, security checks |

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

## Execution Rules

1. Section `[FE]` dan `[BE]` adalah satu-satunya sumber status atomic task.
2. Tag layer pada setiap row wajib dipertahankan: `FE` atau `BE`.
3. Hanya satu task boleh `in_progress` pada satu waktu.
4. Task berikutnya tidak dimulai sebelum verification task aktif berhasil.
5. Semua perubahan schema production memakai Alembic.
6. AI dan modul ERP post-MVP tidak dibuat pada tracker MVP ini.
