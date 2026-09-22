from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class ProdutoCreate(BaseModel):

    nome: str = Field(
        min_length=1,
        max_length=100
    )

    preco: Decimal = Field(
        gt=0
    )

    quantidade: int = Field(
        ge=0
    )

    data_de_validade: date