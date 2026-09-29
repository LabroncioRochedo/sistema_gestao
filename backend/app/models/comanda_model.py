from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.item_comanda_model import ItemComanda
    from app.models.product_model import Produto
    from app.models.user_model import Usuario

class Comanda(Base):
    __tablename__ = "comandas"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="aberta"
    )

    nome: Mapped[str] = mapped_column(
        String(90),
        nullable=False
    )

    data_abertura: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    usuario: Mapped["Usuario"] = relationship()

    itens: Mapped[list["ItemComanda"]] = relationship(
        back_populates="comanda",
        cascade="all, delete-orphan"
    )