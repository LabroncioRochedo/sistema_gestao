from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class VendaCreate(BaseModel):
    forma_pagamento: str


class ItemVendaResponse(BaseModel):
    id: int
    produto_id: int
    usuario_id: int
    quantidade: int
    preco_unitario: Decimal

    model_config = ConfigDict(from_attributes=True)


class VendaResponse(BaseModel):
    id: int
    usuario_id: int
    valor_total: Decimal
    forma_pagamento: str
    data_venda: datetime
    itens: list[ItemVendaResponse]

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, Field


class VendaDiretaCreate(BaseModel):
    produto_id: int
    quantidade: int = Field(gt=0)
    forma_pagamento: str = Field(min_length=1, max_length=50)