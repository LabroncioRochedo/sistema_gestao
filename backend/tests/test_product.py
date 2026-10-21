from fastapi.testclient import TestClient


def test_listar_produtos(
    client: TestClient,
    auth_headers: dict[str, str]
):
    response = client.get(
        "/produtos",
        headers=auth_headers
    )

    assert response.status_code == 200

    produtos = response.json()

    assert produtos[0]["quantidade"] is not None


def test_criar_produto_com_primeiro_lote(
    client, auth_headers
):
    response = client.post(
        "/produtos",
        json={
            "nome": "Arroz 5kg",
            "preco": "29.90",
            "quantidade": 50,
            "data_de_validade": "2027-10-15",
        },
        headers=auth_headers,
    )

    assert response.status_code == 201

    dados = response.json()

    assert dados["nome"] == "Arroz 5kg"
    assert dados["lote"]["quantidade"] == 50
    assert dados["lote"]["data_de_validade"] == "2027-10-15"
    assert dados["lote"]["id"] is not None

    produto_id = dados["id"]

    response = client.post(
        f"/produtos/{produto_id}/lote",
        json={
            "quantidade": 90,
            "data_de_validade": "2027-10-15",
        },
        headers=auth_headers,
    )

    assert response.status_code == 201

    response = client.get(
        f"/produtos/{produto_id}/lote",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()[1]["quantidade"] == 90

    response = client.delete(
        f"/produtos/{produto_id}",
        headers=auth_headers
    )

    assert response.status_code == 200


def test_excluir_produto(
    client: TestClient,
    auth_headers: dict[str, str]
):
    criar = client.post(
        "/produtos",
        json={
            "nome": "Produto para excluir",
            "preco": 10.00,
            "quantidade": 5,
            "data_de_validade": "2027-10-15"
        },
        headers=auth_headers
    )

    assert criar.status_code == 201

    produto_id = criar.json()["id"]

    response = client.delete(
        f"/produtos/{produto_id}",
        headers=auth_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Produto excluído com sucesso"


def test_excluir_produto_inexistente(
    client: TestClient,
    auth_headers: dict[str, str]
):
    response = client.delete(
        "/produtos/999999999",
        headers=auth_headers
    )

    assert response.status_code == 404

    data = response.json()

    assert data["detail"] == "Produto não encontrado"


def test_listar_produtos_sem_token(client: TestClient):
    response = client.get("/produtos")

    assert response.status_code == 401