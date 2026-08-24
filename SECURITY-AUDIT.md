# Security Audit

## Executive Summary

Audit read-only terhadap checkout development AI Hitung HPP dilakukan pada 2026-08-22 berdasarkan advisory `boto4` dan `reqcrypts` yang diberikan user. Kedua paket tidak ditemukan pada dependency declaration, lockfile, source code, project virtual environment, atau system Python yang diperiksa.

Tidak ada perubahan kode atau dependency yang diperlukan. Tidak ditemukan proses Python aktif, koneksi TCP Python, persistence user, atau startup hook Python mencurigakan pada host saat audit.

**Final Status: PASS WITH WARNINGS**

## Scope

- Target: checkout lokal `/media/nopal-risfana/DATA/project/Web/AI Hitung Hpp`.
- Fokus: backend Python pada `backend/`, dependency declarations, lockfile, project `.venv`, source references, dan indikator runtime lokal.
- Authorization basis: instruksi eksplisit user, `eksekusi sekarang`.
- Excluded: public/staging/production hosts, credential rotation, external systems, destructive cleanup, dan deployment.
- Tidak ada target aplikasi lokal yang sedang listening untuk DAST.

## Environment

- Python system: 3.12.3.
- Project environment: `backend/.venv`, Python 3.12.3; environment tidak menyediakan `pip`, sehingga metadata dist-info digunakan untuk pemeriksaan instalasi.
- Root checkout bukan Git repository; pemeriksaan Git history/status tidak tersedia.
- Docker tidak tersedia.

## Stack Detected

- FastAPI, SQLAlchemy async, Alembic, PostgreSQL/asyncpg, Pydantic, Uvicorn.
- Dependency declaration: `backend/pyproject.toml`.
- Lockfile: `backend/uv.lock`.

## Tools Used

- `rg`, `find`, `pip show`/`pip list` read-only, metadata `dist-info`, process/listener inspection, dan graphify query.
- Project verification: `backend/scripts/verify_backend.sh`.

## Security Score

**100/100 PROVISIONAL** — tidak ada confirmed Critical, High, Medium, atau Low finding. Status provisional karena dependency auditor khusus tidak tersedia dan deployment host tidak termasuk scope.

## Findings Summary

| Finding | Severity | Status |
| --- | --- | --- |
| `boto4` / `reqcrypts` dependency exposure | Critical if installed | Not found |
| Suspicious import/source reference | High | Not found |
| Python process/network indicator | High | Not found |
| Python persistence hook | High | Not found |

## Dependency Vulnerabilities

Pemeriksaan berikut tidak menemukan `boto4` atau `reqcrypts`:

- `backend/pyproject.toml`.
- `backend/uv.lock`.
- Python source, scripts, migrations, tests, dan frontend source di luar `node_modules`.
- Project `.venv` package metadata dan filesystem package names.
- System Python `pip show` dan freeze output.

`Dependency audit: SKIPPED - compatible project-local auditor unavailable` — `pip-audit` tidak terpasang dan tidak diinstal selama audit.

## Source and Runtime Review

Tidak ditemukan referensi advisory package atau indikator berikut pada backend app/scripts/migrations:

- `subprocess`, `os.system`, socket/scanning tools, Telegram/C2, cryptomining/XMRig.
- persistence melalui cron/systemd/autostart.
- dynamic execution (`eval`, `exec`, `compile`, `__import__`) yang mencurigakan.

Runtime sweep juga menemukan tidak ada proses Python/Uvicorn/Gunicorn aktif dan tidak ada koneksi TCP Python. Startup hook project hanya `_virtualenv.pth` standar.

## Verification

`backend/scripts/verify_backend.sh` berhasil:

- 101 tests passed.
- Ruff check passed.
- Ruff format check passed.
- Pyright: 0 errors, 0 warnings, 0 informations.
- OpenAPI export dan JSON validation passed.
- Alembic offline full upgrade dan downgrade check passed.

## OWASP ZAP Results

`OWASP ZAP: SKIPPED - Docker unavailable` — tidak ada target aplikasi lokal yang berjalan untuk passive baseline.

## SSL/TLS Review

`SSL Labs: SKIPPED - public HTTPS domain unavailable`

`MDN Observatory: SKIPPED - public domain unavailable`

## Fixes Applied

Tidak ada fix dependency/source yang diterapkan karena finding tidak terbukti. Tidak menjalankan `pip install`, `pip uninstall`, `pip-audit --fix`, atau package import.

File baru: `SECURITY-AUDIT.md`.

## Remaining Risks

- Audit ini tidak membuktikan kebersihan host deployment, image/container, atau checkout lain.
- Tidak ada hash/C2 dari advisory yang diberikan, sehingga korelasi artefak historis tidak dapat dilakukan.
- Jika paket pernah terpasang pada host lain, ikuti containment dan credential rotation dari advisory; `pip uninstall` saja tidak cukup.

## Recommendations

1. Jalankan audit yang sama pada host/image deployment dari perangkat bersih.
2. Sediakan `pip-audit` di CI melalui environment/toolchain yang disetujui, tanpa `--fix` otomatis.
3. Pertahankan `uv.lock` dan review diff dependency sebelum merge.

## Final Status

**PASS WITH WARNINGS** — tidak ada unresolved Critical/High finding pada checkout dan runtime lokal yang diperiksa. Warning tersisa: dependency auditor dan DAST tidak tersedia, serta deployment host belum diaudit.
