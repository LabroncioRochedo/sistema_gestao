from pydantic import BaseModel, Field, ConfigDict, AliasPath
from decimal import Decimal


class ItemComandaCreate(BaseModel):
    produto_id: int
    quantidade: int = Field(gt=0)
    comentario: str | None = Field(
        default=None,
        max_length=250
    )

class ItemComandaResponse_criar(BaseModel):
    id: int
    comanda_id: int
    produto_id: int
    usuario_id: int
    quantidade: int
    preco_unitario: Decimal
    comentario: str | None

    model_config = ConfigDict(from_attributes=True)

from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, AliasPath


class ItemComandaResponse_listar(BaseModel):
    id: int
    comanda_id: int
    produto_id: int
    quantidade: int
    preco_unitario: Decimal
    comentario: str | None

    produto_nome: str = Field(
        validation_alias=AliasPath("produto", "nome")
    )

    usuario_nome: str = Field(
        validation_alias=AliasPath("usuario", "nome")
    )

    model_config = ConfigDict(from_attributes=True)