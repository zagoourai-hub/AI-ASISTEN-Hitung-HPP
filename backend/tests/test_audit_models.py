from pathlib import Path
from typing import cast

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import ForeignKeyConstraint

from app.models import AuditLog
from app.models.base import Base


def test_audit_log_has_required_calculation_fields_and_indexes() -> None:
    audits = Base.metadata.tables[AuditLog.__tablename__]
    foreign_keys = [
        constraint
        for constraint in audits.constraints
        if isinstance(constraint, ForeignKeyConstraint)
    ]
    indexes = {index.name for index in audits.indexes}

    assert {
        "actor_id",
        "action",
        "entity_type",
        "entity_id",
        "request_id",
        "created_at",
    } <= set(audits.c.keys())
    assert next(iter(foreign_keys[0].elements)).ondelete == "RESTRICT"
    assert "ix_audit_logs_entity" in indexes
    assert "ix_audit_logs_request" in indexes


def test_audit_migration_is_latest_and_reversible() -> None:
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    revisions = list(ScriptDirectory.from_config(config).walk_revisions("base", "heads"))
    latest = revisions[0]

    assert latest.revision == "0013_cash_tracking"
    assert cast(str, latest.down_revision) == "0012_product_images"
