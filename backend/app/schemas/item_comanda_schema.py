from pydantic import BaseModel, Field, ConfigDict
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