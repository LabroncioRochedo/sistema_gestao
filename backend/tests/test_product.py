from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_criar_produto():

    response = client.post(
        "/produtos",
        json={
            "nome": "Arroz 5kg",
            "preco": 29.90,
            "quantidade": 50,
            "data_de_validade": "2027-10-15"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["nome"] == "Arroz 5kg"
    assert float(data["preco"]) == 29.90
    assert data["quantidade"] == 50
    assert data["data_de_validade"] == "2027-10-15"

    assert "id" in data

def test_produto_com_preco_invalido():

    response = client.post(
        "/produtos",
        json={
            "nome": "Arroz",
            "preco": -10,
            "quantidade": 10,
            "data_de_validade": "2027-10-15"
        }
    )

    assert response.status_code == 422


def test_produto_com_quantidade_invalida():

    response = client.post(
        "/produtos",
        json={
            "nome": "Arroz",
            "preco": 10.50,
            "quantidade": -5,
            "data_de_validade": "2027-10-15"
        }
    )

    assert response.status_code == 422


def test_produto_sem_nome():

    response = client.post(
        "/produtos",
        json={
            "preco": 10.50,
            "quantidade": 10,
            "data_de_validade": "2027-10-15"
        }
    )

    assert response.status_code == 422

