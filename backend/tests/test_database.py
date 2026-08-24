from pathlib import Path

from alembic.config import Config

from app.core.database import async_session_factory, engine
from app.models.base import MONEY_NUMERIC, QUANTITY_NUMERIC, Base


def test_async_database_session_configuration() -> None:
    assert engine.url.drivername == "postgresql+asyncpg"
    assert async_session_factory.kw["expire_on_commit"] is False
    assert dict(Base.metadata.naming_convention).get("pk") == "pk_%(table_name)s"


def test_postgresql_numeric_policy() -> None:
    assert MONEY_NUMERIC.precision == 18
    assert MONEY_NUMERIC.scale == 4
    assert MONEY_NUMERIC.asdecimal is True
    assert QUANTITY_NUMERIC.precision == 18
    assert QUANTITY_NUMERIC.scale == 6


def test_alembic_configuration_points_to_migrations() -> None:
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))

    assert config.get_main_option("script_location") == str(
        Path(__file__).parents[1] / "migrations"
    )
    assert (Path(__file__).parents[1] / "migrations" / "env.py").is_file()
