def test_abrir_comanda(client, auth_headers):
    response = client.post(
        "/comandas",
        json={
            "nome":"jose_12"
        },
        headers=auth_headers
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["status"] == "aberta"
    assert data["usuario_id"] is not None

def test_abrir_comanda_sem_token(client):
    response = client.post(
        "/comandas",
        json={
            "nome":"jose_11"
        }
    )

    assert response.status_code == 401

def test_listar_comandas(client,auth_headers):
    response = client.get(
        "/comandas",
        headers=auth_headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data[0]["usuario_nome"] == "labroncio"

def test_deletar_comanda_retorna_estoque(
    client,
    auth_headers
):
    # Cria produto
    response = client.post(
        "/produtos",
        json={
            "nome": "Produto teste",
            "preco": 10.00,
            "quantidade": 50,
            "data_de_validade": "2027-12-31"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    produto_id = response.json()["id"]

    # Cria comanda
    response = client.post(
        "/comandas",
        json={"nome": "Comanda teste"},
        headers=auth_headers
    )
    assert response.status_code == 201
    comanda_id = response.json()["id"]

    # Adiciona 20 unidades à comanda
    response = client.post(
        f"/comandas/{comanda_id}/itens",
        json={
            "produto_id": produto_id,
            "quantidade": 20
        },
        headers=auth_headers
    )
    assert response.status_code in (200, 201)

    # Confirma estoque reduzido
    response = client.get(
        "/produtos",
        headers=auth_headers
    )
    produto = next(
        p for p in response.json()
        if p["id"] == produto_id
    )
    assert produto["quantidade"] == 30

    # Exclui a comanda
    response = client.delete(
        f"/comandas/{comanda_id}",
        headers=auth_headers
    )
    assert response.status_code == 200

    # Confirma que a comanda não existe mais
    response = client.get(
        f"/comandas/{comanda_id}/itens",
        headers=auth_headers
    )
    assert response.status_code == 404

    # Confirma que o estoque voltou para 50
    response = client.get(
        "/produtos",
        headers=auth_headers
    )
    produto = next(
        p for p in response.json()
        if p["id"] == produto_id
    )
    assert produto["quantidade"] == 50