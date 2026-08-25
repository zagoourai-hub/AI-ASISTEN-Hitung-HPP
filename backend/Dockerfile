ARG PYTHON_IMAGE=python:3.12-slim
FROM ${PYTHON_IMAGE}

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN useradd --create-home --uid 10001 appuser

COPY pyproject.toml /tmp/pyproject.toml
RUN python - <<'PY'
import subprocess
import sys
import tomllib

with open("/tmp/pyproject.toml", "rb") as pyproject_file:
    dependencies = tomllib.load(pyproject_file)["project"]["dependencies"]

subprocess.check_call(
    [sys.executable, "-m", "pip", "install", "--no-cache-dir", *dependencies]
)
PY

COPY --chown=appuser:appuser alembic.ini pyproject.toml ./
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser migrations ./migrations
RUN mkdir -p /app/media/products && chown -R appuser:appuser /app/media

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=6 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health', timeout=3)"

CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
