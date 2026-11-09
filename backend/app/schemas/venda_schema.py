from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, AliasPath


class VendaCreate(BaseModel):
    forma_pagamento: str


class ItemVendaResponse(BaseModel):
    id: int
    produto_id: int | None
    quantidade: int
    preco_unitario: Decimal

    model_config = ConfigDict(from_attributes=True)


class VendaResponse_vender(BaseModel):
    id: int
    valor_total: Decimal
    forma_pagamento: str
    data_venda: datetime
    itens: list[ItemVendaResponse]

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, Field


class VendaDiretaCreate(BaseModel):
    produto_id: int
    quantidade: int = Field(gt=0)

class VendaDiretaListaCreate(BaseModel):
    itens: list[VendaDiretaCreate] = Field(min_length=1)
    forma_pagamento: str

class VendaResponse_listar(BaseModel):
    id: int
    valor_total: Decimal
    forma_pagamento: str
    data_venda: datetime
    nome_usuario: str
    nome_venda: str

    model_config = ConfigDict(from_attributes=True)


class ItemVendaResponse_listar(BaseModel):
    id: int
    venda_id: int
    produto_id: int | None
    quantidade: int
    preco_unitario: Decimal
    nome_produto: str
    nome_usuario: str

    model_config = ConfigDict(from_attributes=True)