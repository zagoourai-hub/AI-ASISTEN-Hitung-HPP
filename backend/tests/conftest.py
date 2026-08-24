import os

os.environ.setdefault(
    "HPP_DATABASE_URL",
    "postgresql+asyncpg://hpp_user:test_only_password@localhost:5432/hpp",
)
os.environ.setdefault("HPP_SECRET_KEY", "test-only-secret-key-with-32-characters")
