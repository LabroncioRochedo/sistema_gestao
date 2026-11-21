def test_historico_apos_excluir_e_pagar(client, auth_headers):
    def post(caminho, dados):
        resposta = client.post(caminho, json=dados, headers=auth_headers)
        assert resposta.status_code == 201, resposta.text
        return resposta.json()

    def get(caminho):
        resposta = client.get(caminho, headers=auth_headers)
        assert resposta.status_code == 200, resposta.text
        return resposta.json()

    produto = post("/produtos", {
        "nome": "Suco", "preco": 8, "quantidade": 12, "data_de_validade": "2035-05-10",
    })
    numero = 729
    excluida = post("/comandas", {"numero": numero, "nome": "Primeiro atendimento"})["id"]
    base = f"/comandas/{excluida}"
    itens = post(base + "/itens", {"itens": [
        {"produto_id": produto["id"], "quantidade": 2, "comentario": "sem gelo"},
        {"produto_id": produto["id"], "quantidade": 3},
    ]})
    post(base + "/item/outros", {"nome_produto": "Avulso", "quantidade": 1, "preco_unitario": 4})
    assert client.delete(base + f"/itens/{itens[1]['id']}", headers=auth_headers).status_code == 204
    entradas = get(base + "/historico")
    assert len(entradas) == 4
    assert client.delete(base, headers=auth_headers).status_code == 200
    assert client.delete(base, headers=auth_headers).status_code == 404
    apos_exclusao = get(base + "/historico")
    assert {h["id"] for h in entradas} <= {h["id"] for h in apos_exclusao}
    assert len(apos_exclusao) == 6
    assert get(f"/produtos/{produto['id']}/lote")[0]["quantidade"] == 12

    paga = post("/comandas", {"numero": numero, "nome": "Segundo atendimento"})["id"]
    base = f"/comandas/{paga}"
    post(base + "/itens", {"itens": [{"produto_id": produto["id"], "quantidade": 1}]})
    post(base + "/vender", {"forma_pagamento": "pix"})

    historico = {c["comanda_id"]: c for c in get("/comandas/historico")}
    assert historico[paga]["status"] == "paga"
    assert [h["operacao"] for h in historico[paga]["anotacoes"]] == ["entrada"]
    assert historico[excluida]["status"] == "excluida"
    saidas = [h for h in historico[excluida]["anotacoes"] if h["operacao"] == "saida"]
    assert sorted((h["nome_produto"], h["quantidade"]) for h in saidas) == [
        ("Avulso", 1), ("Suco", 2), ("Suco", 3),
    ]
    assert next(h for h in saidas if h["quantidade"] == 2)["comentario"] == "sem gelo"
    assert not {paga, excluida}.intersection(c["id"] for c in get("/comandas"))
