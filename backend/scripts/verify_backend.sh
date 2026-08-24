#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
backend_dir="$(cd -- "$script_dir/.." && pwd)"
temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

if [[ -n "${PYTHON_BIN:-}" ]]; then
  python_bin="$PYTHON_BIN"
elif [[ -x "$backend_dir/.venv/bin/python" ]]; then
  python_bin="$backend_dir/.venv/bin/python"
else
  python_bin="python"
fi

ruff_bin="${RUFF_BIN:-$backend_dir/.venv/bin/ruff}"
pyright_bin="${PYRIGHT_BIN:-$backend_dir/.venv/bin/pyright}"
alembic_bin="${ALEMBIC_BIN:-$backend_dir/.venv/bin/alembic}"

: "${HPP_DATABASE_URL:?HPP_DATABASE_URL must be set for CI verification}"
: "${HPP_SECRET_KEY:?HPP_SECRET_KEY must be set for CI verification}"

cd "$backend_dir"
"$python_bin" -m pytest
"$ruff_bin" check app tests
"$ruff_bin" format --check app tests
"$pyright_bin"
HPP_OPENAPI_OUTPUT="$temp_dir/openapi.json" "$python_bin" scripts/export_openapi.py
test -s "$temp_dir/openapi.json"
"$python_bin" -m json.tool "$temp_dir/openapi.json" >/dev/null
"$alembic_bin" upgrade head --sql > "$temp_dir/upgrade.sql"
"$alembic_bin" downgrade 0011_audit_logs:0010_recommendation_drafts --sql > "$temp_dir/downgrade.sql"
test -s "$temp_dir/upgrade.sql"
test -s "$temp_dir/downgrade.sql"
echo "Backend verification passed"
