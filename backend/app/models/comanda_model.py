from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


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

    venda: Mapped["Venda | None"] = relationship(
        back_populates="comanda",
        uselist=False
    )