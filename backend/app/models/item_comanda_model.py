from decimal import Decimal
from typing import TYPE_CHECKING
from datetime import datetime, timezone
from sqlalchemy import ForeignKey, Numeric, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.comanda_model import Comanda
    from app.models.user_model import Usuario
    from app.models.venda_model import Venda
    from app.models.lote_model import Lote

class ItemComanda(Base):
    __tablename__ = "itens_comanda"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    comanda_id: Mapped[int] = mapped_column(
        ForeignKey("comandas.id"),
        nullable=False
    )

    produto_id: Mapped[int | None] = mapped_column(
        ForeignKey("produtos.id"),
        nullable=True
    )

    lote_id: Mapped[int | None] = mapped_column(
        ForeignKey("lotes.id"),
        nullable=True
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False
    )

    comentario: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True
    )

    nome_produto: Mapped[str] = mapped_column(
        String(250),
        nullable=False
    )

    quantidade: Mapped[int] = mapped_column(
        nullable=False
    )

    preco_unitario: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False
    )

    comanda: Mapped["Comanda"] = relationship(
        back_populates="itens"
    )

    data: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    lote: Mapped["Lote"] = relationship()

    produto: Mapped["Produto"] = relationship()

    usuario: Mapped["Usuario"] = relationship()