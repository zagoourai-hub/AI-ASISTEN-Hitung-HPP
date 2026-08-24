from uuid import UUID

from sqlalchemy.sql.elements import ColumnElement, SQLCoreOperations


def business_scope_clause(
    business_column: SQLCoreOperations[UUID],
    business_id: UUID,
) -> ColumnElement[bool]:
    return business_column == business_id
