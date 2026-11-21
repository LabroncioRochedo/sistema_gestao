
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    ForeignKey,
    String,
    DateTime,
    Numeric,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class HistoricoItemComanda(Base):
    __tablename__ = "historico_itens_comanda"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    comanda_id: Mapped[int] = mapped_column(
        ForeignKey("historico_comandas.comanda_id"),
        index=True,
        nullable=False
    )

    nome_produto: Mapped[str] = mapped_column(
        String(250),
        nullable=False
    )

    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True
    )

    quantidade: Mapped[int] = mapped_column(
        nullable=False
    )

    preco_unitario: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    operacao: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    comentario: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True
    )

    data_movimentacao: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    nome_usuario: Mapped[str] = mapped_column(String(100))
