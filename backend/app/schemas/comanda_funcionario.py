from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, computed_field


class AnotarProduto(BaseModel):
    model_config = ConfigDict(extra="forbid")
    produto_id: int = Field(gt=0)
    quantidade: int = Field(strict=True, gt=0, le=2147483647)


class AnotarProdutos(BaseModel):
    model_config = ConfigDict(extra="forbid")
    itens: list[AnotarProduto] = Field(min_length=1)


class EncerrarConta(BaseModel):
    itens_ids: list[int] = Field(min_length=1)


class AnotarOutro(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nome: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=250)]
    quantidade: int = Field(strict=True, gt=0, le=2147483647)
    preco_unitario: Decimal = Field(gt=0, max_digits=10, decimal_places=2)


class ItemFuncionarioResponse(BaseModel):
    id: int
    nome: str
    quantidade: int
    preco_unitario: Decimal
    anotado_por: str
    data: datetime


class ContaFuncionarioResponse(BaseModel):
    funcionario_id: int
    itens: list[ItemFuncionarioResponse]

    @computed_field
    @property
    def total(self) -> Decimal:
        return sum((item.preco_unitario * item.quantidade for item in self.itens), Decimal("0.00"))
