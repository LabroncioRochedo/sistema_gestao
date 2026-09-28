from pydantic import BaseModel, Field


class ComandaCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=90)


class ComandaResponse(BaseModel):
    id: int
    usuario_id: int
    status: str