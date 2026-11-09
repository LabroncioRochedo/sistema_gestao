from pydantic import BaseModel, Field, ConfigDict, AliasPath
from decimal import Decimal


class ItemComandaCreate(BaseModel):
    produto_id: int
    quantidade: int = Field(gt=0)
    comentario: str | None = Field(
        default=None,
        max_length=250
    )

class ItemOutros(BaseModel):
    nome_produto: str
    preco_unitario: int
    quantidade: int

class ItensComandaCreate(BaseModel):
    itens: list[ItemComandaCreate] = Field(min_length=1)
    
class ItemComandaResponse_criar(BaseModel):
    id: int
    comanda_id: int
    produto_id: int
    lote_id: int
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
    produto_id: int | None
    lote_id: int | None
    quantidade: int
    preco_unitario: Decimal
    comentario: str | None
    nome_produto: str

    usuario_nome: str = Field(
        validation_alias=AliasPath("usuario", "nome")
    )

    model_config = ConfigDict(from_attributes=True)