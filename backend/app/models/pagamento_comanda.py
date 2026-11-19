from sqlalchemy import (
    Integer,
    Numeric,
    DateTime,
    ForeignKey,
    String
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database.base import Base


class PagamentoComanda(Base):
    __tablename__ = "pagamentos_comanda"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    comanda_id: Mapped[int | None] = mapped_column(
        ForeignKey("comandas.id"),
        nullable=True,
        index=True
    )

    venda_id: Mapped[int | None] = mapped_column(
        ForeignKey("vendas.id"),
        nullable=True,
        index=True
    )

    nome_usuario: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    valor: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    forma_pagamento: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    data_pagamento: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relacionamentos
    comanda: Mapped["Comanda | None"] = relationship(
        back_populates="pagamentos"
    )

    venda: Mapped["Venda | None"] = relationship(
        back_populates="pagamentos"
    )