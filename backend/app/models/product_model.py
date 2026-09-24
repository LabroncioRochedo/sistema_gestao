from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    nome: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    preco: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    quantidade: Mapped[int] = mapped_column(
        nullable=False
    )

    data_de_validade: Mapped[date] = mapped_column(
        Date,
        nullable=True
    )

    imagem_key: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )