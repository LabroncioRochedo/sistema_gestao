from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Venda(Base):
    __tablename__ = "vendas"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    comanda_id: Mapped[int] = mapped_column(
        ForeignKey("comandas.id"),
        nullable=False,
        unique=True
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False
    )

    valor_total: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    forma_pagamento: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    data_venda: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    comanda: Mapped["Comanda"] = relationship(
        back_populates="venda"
    )

    usuario: Mapped["Usuario"] = relationship()

    itens: Mapped[list["ItemVenda"]] = relationship(
        back_populates="venda",
        cascade="all, delete-orphan"
    )