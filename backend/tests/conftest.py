import os

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def credenciais_teste():
    nome = os.getenv("TEST_LOGIN_NOME")
    senha = os.getenv("TEST_LOGIN_SENHA")
    if not nome or not senha:
        pytest.fail("Configure TEST_LOGIN_NOME e TEST_LOGIN_SENHA para a conta do banco de testes.")
    return {"nome": nome, "senha": senha}


@pytest.fixture
def auth_headers(client, credenciais_teste):
    response = client.post("/auth/login", json=credenciais_teste)
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
