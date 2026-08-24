from pydantic import BaseModel, ConfigDict, Field


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PageMeta(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    page: int = Field(ge=1)
    page_size: int = Field(default=20, alias="pageSize", ge=1, le=100)
    total: int = Field(ge=0)


class PageResponse[T](BaseModel):
    data: list[T]
    meta: PageMeta
