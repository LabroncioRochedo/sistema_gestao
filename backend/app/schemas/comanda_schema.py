from pydantic import BaseModel, Field, AliasPath, ConfigDict
from datetime import datetime


class ComandaCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=90)


class ComandaResponse_criar(BaseModel):
    id: int
    usuario_id: int
    status: str

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, AliasPath


class ComandaResponse_listar(BaseModel):
    id: int
    nome: str
    status: str
    data_abertura: datetime
    usuario_nome: str = Field(
        validation_alias=AliasPath("usuario", "nome")
    )

    model_config = ConfigDict(from_attributes=True)