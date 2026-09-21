from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    nome: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    senha: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    cargo: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
