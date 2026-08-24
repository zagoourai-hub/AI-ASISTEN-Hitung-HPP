---
name: nextjs-python
description: Implementasi fullstack Next.js + Python dengan frontend TypeScript dan backend FastAPI, SQLAlchemy 2.x async, Alembic, serta PostgreSQL. Gunakan untuk SaaS, aplikasi web, dashboard, AI tools, REST API, streaming AI, dan background processing pada profile nextjs-python.
allowed-tools: Read Write Bash(npm *) Bash(npx *) Bash(pnpm *) Bash(node *) Bash(uv *) Bash(python *) Bash(pytest *) Bash(alembic *) Bash(ruff *) Bash(pyright *) Bash(docker *)
---

# Next.js + Python

Bangun modular monolith production-ready. Gunakan arsitektur paling sederhana yang memenuhi kebutuhan; jangan mulai dari microservices, Redis, queue, global client state, atau LangChain tanpa kebutuhan nyata.

## Stack Default

- **Frontend:** Next.js stable terbaru, App Router, TypeScript strict, React Server Components, Tailwind CSS, shadcn/ui, Zod, React Hook Form.
- **Backend:** Python, FastAPI, Uvicorn, Pydantic v2, pydantic-settings, SQLAlchemy 2.x async, Alembic, asyncpg, httpx, PyJWT, pwdlib, structlog.
- **Database:** PostgreSQL.
- **Development:** uv, Ruff, Pyright, pytest, pytest-asyncio.
- **Optional:** Redis, ARQ, atau Celery hanya ketika kebutuhan membenarkannya.
- **Container/edge:** Docker; Cloudflare sebagai default edge, Nginx hanya bila platform belum menutup kebutuhan proxy/routing.
- **AI:** provider SDK atau OpenAI-compatible SDK; FastAPI `StreamingResponse`/SSE; LangChain hanya untuk orchestration kompleks.

Gunakan dokumentasi resmi untuk menentukan versi stable terbaru saat membuat atau meng-upgrade project. Jangan menaikkan major version project existing tanpa persetujuan.

## Struktur Default

```text
project/
├── frontend/
│   ├── src/app/
│   ├── src/components/
│   ├── src/lib/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── integrations/
│   │   ├── workers/
│   │   └── utils/
│   ├── migrations/
│   ├── tests/
│   ├── alembic.ini
│   └── pyproject.toml
└── docker/                    # hanya bila container dipakai
```

Pertahankan struktur project existing yang sudah sehat. Jangan memindahkan file hanya untuk menyamakan contoh ini.

Alur utama:

```text
Browser -> Next.js -> FastAPI -> Service -> Repository -> SQLAlchemy -> PostgreSQL
```

Tambahkan Redis, worker, dan AI provider hanya pada sisi FastAPI bila dibutuhkan.

## Frontend

- Gunakan App Router dan React Server Components secara default.
- Tambahkan `"use client"` hanya untuk interaksi, browser API, atau hook client.
- Urutan state: server state -> URL state -> local React state -> Zustand bila benar-benar perlu global client state.
- Gunakan TanStack Query hanya saat client-side server state cukup kompleks; jangan pasang secara default.
- Gunakan React Hook Form + Zod untuk form kompleks. Validasi frontend tidak menggantikan validasi backend.
- Aktifkan TypeScript strict dan hindari `any`; jika terpaksa, batasi scope dan jelaskan alasannya.
- Gunakan Tailwind dan komponen shadcn/ui yang sudah ada; jangan buat sistem komponen duplikat.
- Pertimbangkan generated TypeScript client/types dari OpenAPI agar contract konsisten.
- Sediakan loading, empty, error, success, disabled, hover, active, dan focus state yang relevan serta dukung keyboard dan reduced motion.

## Backend dan API

- Gunakan FastAPI + Uvicorn dengan prefix API `/api/v1`.
- Router menangani HTTP, dependency, validasi, dan response; service menangani business logic/orchestration/transaction; repository menangani query dan persistence.
- Jangan taruh business logic kompleks di router.
- Gunakan Pydantic v2 untuk request/response contract dan manfaatkan OpenAPI bawaan FastAPI.
- Pisahkan SQLAlchemy model, request schema, dan response schema. Jangan mengekspos ORM model sebagai API contract secara sembarangan.
- Gunakan centralized exception handling dan error envelope konsisten untuk validation, authentication, authorization, not found, conflict, rate limit, dan external service error.
- Jangan kirim stack trace, raw SQL error, credential, atau detail internal ke client.
- Gunakan async hanya untuk I/O async. Jangan membuat fungsi async yang hanya melakukan kerja sinkron.

## SQLAlchemy dan PostgreSQL

- Gunakan API SQLAlchemy 2.x: `DeclarativeBase`, `Mapped`, dan `mapped_column`.
- Gunakan `create_async_engine`, `async_sessionmaker`, dan `AsyncSession` dengan URL `postgresql+asyncpg://...`.
- Kelola transaction boundary dengan jelas; commit/rollback berada di service atau unit kerja yang mengoordinasikan operasi.
- Definisikan primary key, foreign key, unique constraint, check constraint, dan index sesuai invariant/query nyata.
- Hindari N+1. Gunakan eager loading seperti `selectinload`/`joinedload` hanya saat relasi memang dibutuhkan.
- Semua perubahan schema production harus melalui Alembic migration.
- Automatic table creation hanya boleh untuk demo/test lokal; jangan mengandalkannya di production.

## Config dan Secret

- Gunakan `pydantic-settings`; semua config berasal dari environment variable.
- Sediakan `.env.example` berisi nama variable dan placeholder aman.
- Jangan commit atau hardcode API key, database password, JWT secret, OAuth secret, provider token, atau credential lain.
- Pisahkan config development, test, dan production tanpa menyimpan secret asli di repository.

## Authentication

- Gunakan PyJWT + pwdlib; pertahankan python-jose bila project existing sudah menggunakannya dengan benar.
- Gunakan Argon2 untuk password hashing dan jangan pernah menyimpan plaintext password.
- Untuk web app, utamakan HttpOnly cookie. Di production atur `HttpOnly`, `Secure`, dan `SameSite` sesuai flow lintas-origin.
- Verifikasi identity, role, dan ownership di server. Jangan percaya `user_id`, role, atau ownership dari frontend.

## HTTP Client

- Gunakan `httpx.AsyncClient` untuk external request async.
- Semua request wajib memiliki timeout dan error handling.
- Reuse client dengan lifecycle yang jelas bila request sering; tutup connection saat shutdown.
- Retry hanya untuk operasi yang aman/idempotent atau memiliki idempotency key, dengan batas yang eksplisit.

## Background Job, Queue, dan Cache

- Jalankan pekerjaan singkat dalam request hanya jika latency dan reliability masih wajar.
- Gunakan ARQ untuk AI processing, email, file processing, report, atau workflow async kecil-menengah.
- Gunakan Celery hanya untuk distributed workers, routing/retry kompleks, atau workload besar.
- Jangan memakai ARQ dan Celery sekaligus tanpa alasan arsitektur yang jelas.
- Gunakan Redis hanya bila perlu untuk queue, cache, rate limiting, temporary state, atau distributed lock; jangan jadikan persistence utama.

## AI dan Streaming

- Prioritas integrasi: provider SDK -> OpenAI-compatible SDK -> LangChain bila orchestration kompleks.
- Untuk OpenRouter atau provider OpenAI-compatible, gunakan OpenAI SDK bila contract-nya sesuai.
- Jangan gunakan LangChain untuk chat/completion sederhana. Pertimbangkan hanya untuk RAG, agent/tool orchestration, retrieval pipeline, atau multi-step chaining yang nyata.
- Stream provider melalui FastAPI `StreamingResponse` atau SSE langsung ke Next.js/browser; jangan buffer seluruh response.
- Tangani client disconnect, cancellation, provider timeout/error, dan cleanup connection.
- Jangan menulis credential atau isi sensitif prompt/response ke log.

## Security

- Validasi input di backend dan gunakan query terparameterisasi melalui SQLAlchemy.
- Periksa authentication, authorization, ownership, XSS, CSRF, CORS, SSRF, brute force, upload, rate limit, dan credential leakage sesuai attack surface.
- Development boleh mengizinkan origin spesifik seperti `http://localhost:3000`; production hanya origin yang dikenal.
- Jangan gunakan wildcard CORS bersama credentials.
- Prioritaskan rate limit untuk login, register, password reset, AI chat, upload, dan endpoint mahal. Gunakan Redis-backed limiter bila deployment multi-instance membutuhkannya.

## Logging

- Gunakan structlog untuk production structured logging; built-in logging cukup untuk kebutuhan sederhana.
- Sertakan context yang berguna seperti request/correlation ID tanpa membocorkan data sensitif.
- Jangan log password, API key, access token, refresh token, cookie auth, atau credential.

## Dependencies dan Tooling Python

Gunakan `pyproject.toml` dan uv untuk project baru.

```bash
uv add fastapi "uvicorn[standard]" sqlalchemy alembic asyncpg pydantic pydantic-settings httpx pyjwt "pwdlib[argon2]" structlog
uv add --dev pytest pytest-asyncio ruff pyright
```

Tambahkan `redis` bersama `arq`, atau tambahkan `celery`, hanya saat dipilih. Hapus dependency yang tidak digunakan; jangan menambah package jika standard library atau dependency existing sudah cukup.

Gunakan Ruff untuk lint, format, dan import sorting. Utamakan Pyright untuk type checking; gunakan mypy bila project existing sudah menetapkannya. Gunakan type hint dan hindari `Any` yang tidak perlu.

## Testing dan Verifikasi

- Gunakan pytest + pytest-asyncio untuk backend; pisahkan unit, integration, dan API test bila skala project membutuhkannya.
- Test business logic penting, authorization/ownership, transaction, error path, dan streaming cancellation yang berisiko.
- Mock external provider pada unit test; gunakan database test terisolasi untuk integration test.
- Jalankan pemeriksaan terkecil yang membuktikan perubahan, lalu perluas sesuai risiko:

```bash
cd backend
uv run ruff check .
uv run ruff format --check .
uv run pyright
uv run pytest
```

Jalankan lint, typecheck, test, dan build frontend yang tersedia di `frontend/package.json`.

## Container dan Edge

- Frontend dan backend boleh memiliki Dockerfile masing-masing; gunakan Docker Compose untuk development bila perlu frontend, backend, PostgreSQL, dan Redis.
- Gunakan multi-stage build bila mengurangi image/runtime dependency, image minimal, non-root user bila memungkinkan, dan healthcheck yang relevan.
- Jangan memasukkan development dependency atau secret ke production image.
- Gunakan Cloudflare untuk DNS, TLS, CDN, proxy, dan basic protection.
- Tambahkan Nginx hanya untuk internal reverse proxy, routing khusus, static serving, atau load balancing yang belum ditangani platform deployment.

## Debugging

1. Reproduksi dan cari root cause.
2. Trace semua caller/consumer dari bagian yang akan diubah.
3. Perbaiki shared source yang benar; jangan rewrite seluruh implementasi.
4. Tambahkan atau perbarui satu regression check yang relevan.
5. Jalankan lint, typecheck, test, dan build sesuai scope.

## Keputusan Arsitektur

Jika ada beberapa pendekatan yang benar-benar layak, berikan Opsi A/B, kelebihan, kekurangan, rekomendasi, dan alasan berdasarkan maintainability, scalability, complexity, biaya, security, developer experience, serta operational overhead. Jangan membuat pilihan palsu untuk keputusan yang sudah jelas dari requirement.

## Larangan

- Jangan langsung membuat microservices.
- Jangan menambah Redis, queue, global state, TanStack Query, Nginx, Celery, atau LangChain tanpa kebutuhan.
- Jangan memakai Prisma/NestJS sebagai backend profile ini.
- Jangan mencampur model database dengan API contract.
- Jangan melakukan premature optimization atau menambah dependency tanpa alasan.

## Task

$ARGUMENTS
