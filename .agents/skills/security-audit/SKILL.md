---
name: security-audit
description: "[ACTIVE] Run authorized, non-destructive web application security audits across Next.js, React, NestJS, Node.js, FastAPI, Python, PostgreSQL, Prisma, SQLAlchemy, Docker, and mixed-stack projects. Use when asked for a security audit or scan, OWASP ZAP, dependency vulnerability review, authentication or authorization review, IDOR or BOLA testing, API or browser-header hardening, secret detection, TLS review, safe vulnerability remediation, regression verification, re-scanning, or a SECURITY-AUDIT.md report. Test only localhost, development, staging, user-owned domains, or targets with explicit security-testing authorization."
---

# Security Audit [ACTIVE]

Audit the real project and its authorized runtime. Work from evidence to root cause, apply only safe fixes, verify them, re-scan, and leave an honest report.

## Non-negotiable safety gate

1. Establish the target before sending any request.
2. Treat localhost and the current development checkout as in scope. Require explicit user authorization for staging, public domains, and any target not clearly local.
3. Refuse third-party targets or unclear ownership. Do not infer authorization from a URL found in source code.
4. Use test accounts, dummy records, and development or staging databases. Never use real personal data as proof.
5. Never run credential brute force, credential stuffing, DoS, DDoS, load or stress tests, destructive requests, persistence, malware, backdoors, data exfiltration, or privilege escalation outside the application's intended authorization boundary.
6. Never run an active scan against production. Run a passive ZAP baseline against production only when the user explicitly authorizes that exact target and confirms the traffic is acceptable.
7. Stop a scan if it changes data unexpectedly, causes instability, leaves the approved scope, or reveals that a GET request has destructive behavior.

Record the authorization basis, environment, target URL, excluded paths, test identity, and data boundary in the report. If authorization remains unclear, perform source-only review and mark DAST `SKIPPED - authorization not established`.

## Modes

- `scan`: inspect and report without changing source files.
- `fix`: run the audit, apply safe isolated fixes, test, and re-scan.
- `report`: refresh evidence and write the report without applying fixes.
- No mode: run the full workflow, including safe fixes. Do not broaden the authorized target.

Do not commit, push, deploy, rotate production credentials, or change external systems unless the user separately requests it.

## Required and optional capabilities

Required:

- source-code and configuration access;
- a shell or terminal.

Optional:

- Docker and the OWASP ZAP image;
- the repository's Node.js or Python package manager;
- project-local `pip-audit`;
- network access to SSL Labs or MDN HTTP Observatory.

Do not fail the whole audit when an optional capability is unavailable. Record one of these exact forms:

```text
OWASP ZAP: SKIPPED - Docker unavailable
Dependency audit: SKIPPED - compatible project-local auditor unavailable
SSL Labs: SKIPPED - public HTTPS domain unavailable
MDN Observatory: SKIPPED - public domain unavailable
```

## Workflow

Follow this sequence:

```text
Authorize scope
-> Detect environment
-> Capture baseline
-> Scan dependencies and source
-> Run safe DAST where applicable
-> Analyze findings
-> Find root causes
-> Apply safe fixes
-> Run regression tests
-> Re-scan
-> Write SECURITY-AUDIT.md
```

### 1. Detect the project and runtime

Inspect repository instructions, `git status --short`, manifests, lockfiles, runtime pins, scripts, environment examples, Docker files, reverse-proxy files, and service directories before choosing commands.

Detect at least:

- frontend: Next.js, React, TypeScript;
- backend: FastAPI, Python, NestJS, Node.js;
- data: PostgreSQL, Prisma, SQLAlchemy, Alembic;
- infrastructure: Dockerfile, Compose, Nginx, Cloudflare or another proxy;
- package manager: `pnpm`, `npm`, Yarn Classic, modern Yarn, `uv`, or `pip`;
- application start and validation commands actually declared by the repository;
- available tools and whether the app is already listening;
- public, authenticated, administrative, upload, streaming, WebSocket, webhook, and AI endpoints.

Resolve Node.js package managers in this order: the `packageManager` field, workspace configuration, then a single lockfile. Do not create a second lockfile. If signals conflict, report the conflict and do not run a mutating package-manager command.

For Python, inspect `pyproject.toml`, `uv.lock`, requirements files, the active virtual environment, and existing tool groups. Do not assume `pip-audit`, Ruff, Pyright, mypy, or pytest is installed.

Find the target URL from documented development commands, running listeners, Compose ports, and environment examples. Verify it responds before scanning. A Docker container cannot reach a host application through its own `localhost`; use a container-reachable host such as `host.docker.internal` when supported, and keep the browser-facing URL separately in the report.

### 2. Capture a clean baseline

Before fixing anything:

- preserve unrelated user changes;
- list the in-scope services and endpoints;
- record tool versions and skipped checks;
- run existing security tests when present;
- save initial dependency and ZAP output when available;
- never print full credentials, tokens, cookies, private keys, or sensitive response bodies.

Mask secret evidence, for example `sk-ab...xyz`. Store only the minimum evidence needed to reproduce a finding.

### 3. Audit dependencies with the detected manager

Run read-only audit commands from each relevant service root. A nonzero audit exit caused by findings is scan output, not a tool crash.

| Detected environment | Read-only command |
|---|---|
| pnpm | `pnpm audit --json` |
| npm | `npm audit --json` |
| Yarn 1 | `yarn audit --json` |
| Yarn 2+ | `yarn npm audit --json` |
| uv with project-local pip-audit | `uv run pip-audit --format=json` |
| active Python environment with pip-audit | `python -m pip_audit --format=json` |

Use the repository's equivalent script when one already exists. Do not install `pip-audit` globally or silently add it to the project. If it is absent, mark the check skipped and recommend a project-local dev dependency or an explicitly approved one-off isolated run.

Do not run `npm audit fix --force`, an unreviewed major upgrade, or `pip-audit --fix` automatically. Confirm reachability, affected runtime path, available fixed versions, compatibility, and lockfile impact before changing a dependency.

### 4. Review source and configuration

Trace each control from route or entrypoint through shared middleware, guards, services, repositories, database access, and response serialization. Search every caller before changing a shared security function.

Review these areas:

#### Authentication

- login, logout, password hashing, reset and verification flows;
- JWT signing and validation, algorithm and key handling, expiry, issuer and audience;
- sessions, refresh-token rotation and revocation;
- cookie `Secure`, `HttpOnly`, `SameSite`, path, domain, and expiry;
- account enumeration, authentication bypass, CSRF, rate limiting, and safe lockout behavior.

Do not brute-force credentials. Verify rate limiting with a very small, bounded request count that cannot create load.

#### Authorization

- role and permission checks at the server boundary;
- admin and user separation;
- resource ownership and tenant isolation;
- IDOR, BOLA, mass assignment, and frontend-only authorization.

Use two test users and dummy resources when runtime verification is authorized. Confirm that User A cannot read, update, or delete User B's resource by changing an identifier. Never retrieve real user data as evidence.

#### Input and file handling

- XSS and unsafe HTML rendering;
- SQL, ORM, NoSQL, template, and command injection;
- path traversal, SSRF, open redirects, and unsafe deserialization;
- request schemas, query and path parameters, pagination bounds, and body-size limits;
- upload size, MIME type, file signature, extension, filename, storage path, and serving headers.

#### API and data exposure

- authentication, authorization, request validation, rate limits, and CORS;
- excessive fields, sensitive errors, stack traces, logs, and debug endpoints;
- pagination or expensive-query abuse, webhook verification, replay protection, and idempotency;
- Prisma or SQLAlchemy queries that return sensitive columns or omit ownership predicates;
- PostgreSQL parameterization, least-privilege roles, exposed ports, backups, and migration safety.

#### Secrets

Search tracked source, configuration, history indicators, frontend bundles, Docker contexts, examples, and CI files for API keys, JWT secrets, database credentials, access tokens, private keys, and cloud credentials. Check `NEXT_PUBLIC_` and equivalent client-exposed prefixes. Do not print full matches. A committed secret requires rotation; deleting the line alone is not remediation.

#### Browser security

Review `Content-Security-Policy` (CSP), HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame protection, CORS, cache behavior, and cookie flags. Do not add a generic CSP blindly. Inventory application APIs, image hosts, analytics, CDNs, WebSockets, AI streams, and third-party scripts first; otherwise mark CSP changes `MANUAL REVIEW REQUIRED`.

#### Docker and reverse proxy

Review image provenance, non-root users, build secrets, copied `.env` files, `.dockerignore`, public database or cache ports, capabilities, volume permissions, health checks, TLS termination, and forwarded-header trust. Do not change production networking or credentials automatically.

#### AI features

When AI exists, verify that provider keys remain server-side; prompts and uploads are validated and size-limited; expensive and streaming endpoints require authorization and rate limits; disconnects cancel upstream work; token and resource budgets are bounded; prompts, model responses, traces, and logs do not leak sensitive data; and tool execution cannot escape its allowlist.

### 5. Run OWASP ZAP safely

Prefer the stable official Docker image. Do not require ZAP Desktop when Docker works.

Preconditions:

1. Docker responds successfully.
2. Authorization and environment are recorded.
3. The application is healthy at the exact URL.
4. The URL is reachable from the container.
5. Authentication uses a dedicated test account and no credential is placed in command output.
6. The scan excludes logout, delete, billing, webhook-trigger, administrative mutation, and other unsafe paths unless a safe disposable test environment explicitly permits them.

Default to the passive baseline scan:

```bash
mkdir -p security
docker run --rm -v "$PWD/security:/zap/wrk/:rw" -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t <container-reachable-authorized-url> \
  -r zap-report.html -J zap-report.json
```

On PowerShell, create `security` with `New-Item -ItemType Directory -Force security` when needed; `$PWD` is supported by Docker Desktop. On Linux, add `--add-host=host.docker.internal:host-gateway` when the host gateway is not already available.

Use scan modes deliberately:

- baseline: default for passive DAST;
- API scan: only for an authorized OpenAPI, SOAP, or GraphQL contract;
- full active scan: only on localhost, development, or staging with explicit active-scan authorization and disposable data;
- production: never use full or API active scanning.

If fixes will follow, preserve the first reports as `security/zap-report.before.html` and `security/zap-report.before.json`; write final results to `security/zap-report.html` and `security/zap-report.json`. Read the JSON, deduplicate alerts by root cause, and redact tokens, cookies, query values, and sensitive response evidence before quoting it.

ZAP severity is an input, not the final decision. Validate the route, evidence, authentication requirement, exposure, business impact, and false-positive probability.

### 6. Review public HTTPS deployment

Run these checks only for an explicitly authorized public HTTPS hostname, never localhost or a private development address.

- SSL Labs: inspect certificate validity and chain, TLS versions, protocol and cipher support, hostname coverage, and endpoint grades. Prefer cached API results before requesting a fresh assessment. Target A or A+, but never invent a grade.
- MDN HTTP Observatory: inspect CSP, HSTS, content-type protection, referrer policy, frame protections, and related browser headers. Never invent a score or grade.

If automation or network access is unavailable, add:

```text
MANUAL CHECK REQUIRED - SSL Labs: https://www.ssllabs.com/ssltest/
MANUAL CHECK REQUIRED - MDN HTTP Observatory: https://developer.mozilla.org/en-US/observatory
```

### 7. Analyze every finding before fixing

Use this internal record for every distinct root cause:

```text
Finding:
Severity: Critical | High | Medium | Low | Informational
Source:
Affected URL:
Affected File:
Evidence:
Root Cause:
Impact:
Exploitability:
Fix:
Files Affected:
Verification:
Status: Open | Fixed | Accepted | False Positive | Manual Review Required
```

Rank Critical, High, Medium, Low, then Informational. Adjust scanner severity using exploitability, exposure, required authentication, affected data, business impact, compensating controls, and false-positive probability. Do not merge unrelated findings merely because they share a category.

### 8. Apply only safe fixes

Apply a fix automatically only when the root cause is clear, the change is isolated, business behavior remains intact, relevant callers have been traced, and a test or re-scan can verify it.

Mark `MANUAL REVIEW REQUIRED` instead of editing when a fix involves:

- a major authentication or authorization redesign;
- a destructive or data-loss-risk migration;
- a breaking API contract;
- a CSP whose required resources are not fully known;
- production credentials or secret rotation;
- infrastructure changes that could cause downtime;
- destructive database operations;
- an ambiguous scanner finding.

Do not hide a finding by suppressing a rule unless the report records evidence, owner, expiry or review date, and why the result is a false positive or accepted risk.

### 9. Test and re-scan

Inspect scripts before running them. Never assume script names.

For Node.js or TypeScript, run only relevant existing scripts such as lint, typecheck, unit, integration, and build through the detected package manager. For Python, use existing Ruff, Pyright or mypy, pytest, and project checks; use `uv run` when the repository uses uv. Reuse equivalent tools already present instead of adding new ones.

Add or update the smallest regression test that proves the fixed security boundary. Cover ownership, role separation, invalid input, response redaction, headers, cookie flags, upload rejection, or rate limits as applicable. Avoid load-generating tests.

After fixes:

1. start or confirm the application safely;
2. run focused regression tests and existing validation;
3. repeat the dependency audit;
4. repeat the applicable ZAP scan;
5. compare before and after evidence;
6. leave unresolved and skipped checks visible.

Never close a vulnerability merely because source code changed.

## Security report

Use an existing repository security-report location when one is documented. Otherwise create `SECURITY-AUDIT.md`. Keep raw ZAP reports under `security/` when generated.

Include these sections:

```markdown
# Security Audit

## Executive Summary
## Scope
## Environment
## Stack Detected
## Tools Used
## Security Score
## Findings Summary
## Critical Findings
## High Findings
## Medium Findings
## Low Findings
## Informational Findings
## Dependency Vulnerabilities
## Authentication Review
## Authorization Review
## API Security
## Browser Security
## Secrets Review
## OWASP ZAP Results
## SSL/TLS Review
## Security Headers
## Fixes Applied
## Before vs After
## Manual Review Required
## Remaining Risks
## Recommendations
## Final Status
```

Calculate a transparent, deduplicated score from confirmed unresolved root causes:

```text
score = max(0, 100 - 30*Critical - 15*High - 7*Medium - 2*Low)
```

Informational findings do not reduce the score. Label the score `PROVISIONAL` whenever an applicable scanner or runtime check was skipped, and report coverage as `completed applicable checks / total applicable checks`. Do not use the score to override final status.

Set final status exactly:

- `PASS`: no unresolved Critical or High findings and no Critical or High manual-review uncertainty;
- `PASS WITH WARNINGS`: no unresolved Critical or High findings, but accepted Medium or Low risk, skipped applicable checks, or non-Critical manual review remains;
- `FAIL`: any unresolved Critical or High finding remains.

List each tool as `USED`, `SKIPPED - reason`, `FAILED - reason`, or `MANUAL CHECK REQUIRED`. Separate confirmed findings, false positives, accepted risks, and unverified suspicions. Review reports before committing because scanner output can contain sensitive URLs or evidence.

## Invocation examples

```text
/security-audit
/security-audit scan --target http://localhost:3000
/security-audit fix --target https://staging.example.com --authorized
/security-audit report
```

Finish with the final status, unresolved Critical or High count, files changed, checks run, skipped checks, report path, and exact next manual action.
