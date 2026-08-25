from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator

PromptText = Annotated[str, Field(min_length=1, max_length=2_000)]


class AIStreamRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: PromptText

    @field_validator("prompt")
    @classmethod
    def normalize_prompt(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("prompt must not be blank")
        return normalized
