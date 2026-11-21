from pydantic import BaseModel, Field, AliasPath, ConfigDict
from datetime import datetime
from decimal import Decimal


class ComandaCreate(BaseModel):
    numero: int = Field(strict=True, ge=1, le=999)
    nome: str = Field(min_length=1, max_length=90)


class ComandaResponse_criar(BaseModel):
    numero: int
    id: int
    usuario_id: int
    status: str

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, AliasPath


class ComandaResponse_listar(BaseModel):
    numero: int
    id: int
    nome: str
    status: str
    data_abertura: datetime
    usuario_nome: str = Field(
        validation_alias=AliasPath("usuario", "nome")
    )

    model_config = ConfigDict(from_attributes=True)

class ComandaResponse_historico(BaseModel):
    id: int
    comentario: str | None
    quantidade: int
    preco_unitario: Decimal
    nome_produto: str
    operacao: str
    data_movimentacao: datetime
    usuario_nome: str = Field(validation_alias="nome_usuario")

    model_config = ConfigDict(from_attributes=True)

class ComandaEncerrada(BaseModel):
    comanda_id: int
    numero: int
    nome: str
    status: str
    data_encerramento: datetime
    anotacoes: list[ComandaResponse_historico]

    model_config = ConfigDict(from_attributes=True)


class ComandaPagamentosResponse_listar(BaseModel):
    id: int
    valor: Decimal
    forma_pagamento: str
    data_pagamento: datetime
    nome_usuario: str