from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.comanda_model import Comanda
    from app.models.user_model import Usuario
    from app.models.venda_model import Venda

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

    produto_id: Mapped[int] = mapped_column(
        ForeignKey("produtos.id"),
        nullable=False
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False
    )

    comentario: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True
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

    produto: Mapped["Produto"] = relationship()

    usuario: Mapped["Usuario"] = relationship()