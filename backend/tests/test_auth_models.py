from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import CheckConstraint, ForeignKeyConstraint, UniqueConstraint

from app.models import AuthSession, PasswordResetToken, User
from app.models.base import Base
from app.utils.types import UserRole


def test_user_model_enforces_auth_invariants() -> None:
    users = Base.metadata.tables[User.__tablename__]
    checks = {
        constraint.name
        for constraint in users.constraints
        if isinstance(constraint, CheckConstraint)
    }
    uniques = {
        constraint.name
        for constraint in users.constraints
        if isinstance(constraint, UniqueConstraint)
    }

    assert users.c.email.unique is True
    assert "ck_users_email_lowercase" in checks
    assert "uq_users_email" not in uniques or users.c.email.unique is True
    assert User.__table__.c.role.default is not None
    assert UserRole.OWNER.value == "OWNER"


def test_auth_session_model_supports_expiry_revoke_and_cascade() -> None:
    sessions = Base.metadata.tables[AuthSession.__tablename__]
    foreign_keys = [
        constraint
        for constraint in sessions.constraints
        if isinstance(constraint, ForeignKeyConstraint)
    ]

    assert sessions.c.token_hash.unique is True
    assert sessions.c.expires_at.nullable is False
    assert sessions.c.revoked_at.nullable is True
    assert foreign_keys[0].ondelete == "CASCADE"


def test_password_reset_token_model_supports_one_time_expiry_and_cascade() -> None:
    reset_tokens = Base.metadata.tables[PasswordResetToken.__tablename__]
    foreign_keys = [
        constraint
        for constraint in reset_tokens.constraints
        if isinstance(constraint, ForeignKeyConstraint)
    ]

    assert reset_tokens.c.token_hash.unique is True
    assert reset_tokens.c.expires_at.nullable is False
    assert reset_tokens.c.used_at.nullable is True
    assert foreign_keys[0].ondelete == "CASCADE"


def test_auth_migration_is_registered_as_first_revision() -> None:
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    scripts = ScriptDirectory.from_config(config)

    revisions = list(scripts.walk_revisions("base", "heads"))
    assert [revision.revision for revision in revisions] == [
        "0013_cash_tracking",
        "0012_product_images",
        "0011_audit_logs",
        "0010_recommendation_drafts",
        "0009_cost_versions",
        "0008_ingredient_archive",
        "0007_overheads",
        "0006_recipes",
        "0005_products",
        "0004_ingredients",
        "0003_password_reset",
        "0002_business",
        "0001_auth_session",
    ]
