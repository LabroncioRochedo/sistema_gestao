from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    nome: str = Field(min_length=3, max_length=100)
    senha: str = Field(min_length=6, max_length=128)