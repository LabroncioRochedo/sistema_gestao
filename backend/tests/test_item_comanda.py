def test_adicionar_item_a_comanda(client, auth_headers):

    # 1. Criar produto
    response = client.post(
        "/produtos",
        json={
            "nome": "heineken",
            "preco": 9,
            "quantidade": 50,
            "data_de_validade": "2027-10-15"
        },
        headers=auth_headers
    )

    assert response.status_code == 201
    produto_id = response.json()["id"]

    # 2. Criar comanda
    response = client.post(
        "/comandas",
        json={
            "nome": "jose_12"
        },
        headers=auth_headers
    )

    assert response.status_code == 201
    comanda_id = response.json()["id"]

    # 3. Adicionar 20 unidades à comanda
    response = client.post(
        f"/comandas/{comanda_id}/itens",
        json={
            "produto_id": produto_id,
            "quantidade": 20
        },
        headers=auth_headers
    )

    assert response.status_code == 201

    # 4. Conferir os itens da comanda
    response = client.get(
        f"/comandas/{comanda_id}/itens",
        headers=auth_headers
    )

    assert response.status_code == 200
    assert len(response.json()) == 1

    item_id = response.json()[0]["id"]

    assert response.json()[0]["produto_id"] == produto_id
    assert response.json()[0]["quantidade"] == 20

    # 5. Excluir o item
    response = client.delete(
        f"/comandas/{comanda_id}/itens/{item_id}",
        headers=auth_headers
    )

    assert response.status_code == 204

    # 6. Conferir que o item foi removido
    response = client.get(
        f"/comandas/{comanda_id}/itens",
        headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json() == []

    # 7. Adicionar 50 unidades (estoque foi restaurado)
    response = client.post(
        f"/comandas/{comanda_id}/itens",
        json={
            "produto_id": produto_id,
            "quantidade": 50
        },
        headers=auth_headers
    )

    assert response.status_code == 201

    # 8. Tentar adicionar mais do que existe
    response = client.post(
        f"/comandas/{comanda_id}/itens",
        json={
            "produto_id": produto_id,
            "quantidade": 2900
        },
        headers=auth_headers
    )

    assert response.status_code == 400

    # 9. Comanda inexistente
    response = client.post(
        "/comandas/95609/itens",
        json={
            "produto_id": produto_id,
            "quantidade": 1
        },
        headers=auth_headers
    )

    assert response.status_code == 404

    # 10. Produto inexistente
    response = client.post(
        f"/comandas/{comanda_id}/itens",
        json={
            "produto_id": 1928397348,
            "quantidade": 1
        },
        headers=auth_headers
    )

    assert response.status_code == 404