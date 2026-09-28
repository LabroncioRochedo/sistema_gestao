from fastapi.testclient import TestClient

def test_adicionar_item_a_comanda(client,auth_headers):
    
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

    item_id = response.json()["id"]

    assert response.status_code == 201

    response = client.post(
        "/comandas",
        json={
            "nome":"jose_12"
        },
        headers=auth_headers
    )

    assert response.status_code == 201

    comanda_id = response.json()["id"]

    response = client.post(
        f"/comandas/{comanda_id}/itens",
        json={
            "produto_id": item_id,
            "quantidade": 20
        },
        headers=auth_headers
    )

    assert response.status_code == 201

    response = client.post(
        f"/comandas/{comanda_id}/itens",
        json={
            "produto_id": item_id,
            "quantidade": 2900
        },
        headers=auth_headers
    )

    assert response.status_code == 400

    response = client.post(
        f"/comandas/95609/itens",
        json={
            "produto_id": item_id,
            "quantidade": 2900
        },
        headers=auth_headers
    )

    assert response.status_code == 404

    response = client.post(
        f"/comandas/{comanda_id}/itens",
        json={
            "produto_id": 1928397348,
            "quantidade": 2900
        },
        headers=auth_headers
    )

    assert response.status_code == 404