def test_vender_comanda_registra_itens_e_exclui_comanda(
    client,
    auth_headers
):
    # Criar produto
    response = client.post(
        "/produtos",
        json={
            "nome": "Produto venda",
            "preco": 10.00,
            "quantidade": 50,
            "data_de_validade": "2027-12-31"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    produto_id = response.json()["id"]

    # Abrir comanda
    response = client.post(
        "/comandas",
        json={"nome": "Comanda venda"},
        headers=auth_headers
    )
    assert response.status_code == 201
    comanda_id = response.json()["id"]

    # Adicionar 3 unidades
    response = client.post(
        f"/comandas/{comanda_id}/itens",
        json={
            "produto_id": produto_id,
            "quantidade": 3
        },
        headers=auth_headers
    )
    assert response.status_code in (200, 201)

    # Finalizar venda
    response = client.post(
        f"/comandas/{comanda_id}/vender",
        json={"forma_pagamento": "dinheiro"},
        headers=auth_headers
    )

    assert response.status_code == 201
    venda = response.json()

    assert venda["valor_total"] == "30.00" or float(
        venda["valor_total"]
    ) == 30.00

    assert venda["forma_pagamento"] == "dinheiro"
    assert len(venda["itens"]) == 1
    assert venda["itens"][0]["produto_id"] == produto_id
    assert venda["itens"][0]["quantidade"] == 3

    # Comanda e itens temporários não devem mais existir
    response = client.get(
        f"/comandas/{comanda_id}/itens",
        headers=auth_headers
    )
    assert response.status_code == 404

    # O estoque permanece descontado após a venda
    response = client.get(
        "/produtos",
        headers=auth_headers
    )
    produto = next(
        p for p in response.json()
        if p["id"] == produto_id
    )
    assert produto["quantidade"] == 47

def test_venda_direta(client, auth_headers):

    response = client.post(
        "/produtos",
        json={
            "nome": "Arroz 5kg",
            "preco": 29.90,
            "quantidade": 50,
            "data_de_validade": "2027-10-15"
        },
        headers=auth_headers
    )

    produto_id = response.json()["id"]

    response = client.post(
        "/vendas/direta",
        json={
            "produto_id": produto_id,
            "quantidade": 3,
            "forma_pagamento": "dinheiro",
        },
        headers=auth_headers,
    )

    assert response.status_code == 201