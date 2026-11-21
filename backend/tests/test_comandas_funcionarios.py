from secrets import token_urlsafe


def test_isolamento_das_comandas_e_estoque(client, auth_headers):
    def criar_funcionario():
        credenciais = {"nome": "Teste " + token_urlsafe(8), "senha": token_urlsafe(16)}
        resposta = client.post("/usuarios/", headers=auth_headers, json=credenciais)
        assert resposta.status_code == 201
        login = client.post("/auth/login", json=credenciais)
        assert login.status_code == 200
        return resposta.json()["id"], {"Authorization": "Bearer " + login.json()["access_token"]}

    ana, sessao_ana = criar_funcionario()
    bia, sessao_bia = criar_funcionario()
    conta_a = f"/comandas-funcionarios/{ana}"
    conta_b = f"/comandas-funcionarios/{bia}"
    outro = {"nome": "Café avulso", "quantidade": 2, "preco_unitario": "3.50"}

    assert client.get(conta_a).status_code == 401
    assert client.get("/usuarios/me", headers=sessao_ana).json()["id"] == ana
    assert client.get("/usuarios/funcionarios", headers=sessao_ana).status_code == 403
    assert client.get(conta_b, headers=sessao_ana).status_code == 403
    assert client.post(conta_b + "/outros", json=outro, headers=sessao_ana).status_code == 403
    assert client.get(conta_a, headers=auth_headers).json()["itens"] == []

    resposta = client.post(conta_b + "/outros", json=outro, headers=auth_headers)
    assert resposta.status_code == 201
    item_b = resposta.json()["itens"][0]["id"]
    assert client.get(conta_b, headers=sessao_bia).json()["total"] == "7.00"
    assert client.post(conta_a + "/outros", json=outro, headers=sessao_ana).status_code == 201
    assert client.delete(conta_b + f"/itens/{item_b}", headers=sessao_bia).status_code == 403
    assert client.delete(conta_a + f"/itens/{item_b}", headers=auth_headers).status_code == 404
    assert client.delete(f"/usuarios/{bia}", headers=auth_headers).status_code == 409

    produto = client.post("/produtos", headers=auth_headers, json={
        "nome": "Teste de estoque", "preco": "2.50", "quantidade": 3, "data_de_validade": "2030-01-01",
    }).json()["id"]
    dados = {"produto_id": produto, "quantidade": 2}
    assert client.post(conta_b + "/produtos", headers=sessao_ana, json=dados).status_code == 403
    resposta = client.post(conta_a + "/produtos", headers=sessao_ana, json=dados)
    assert resposta.status_code == 201 and resposta.json()["total"] == "12.00"
    item_a = resposta.json()["itens"][-1]["id"]
    assert client.post(conta_b + "/produtos", headers=auth_headers, json=dados).status_code == 409
    assert client.delete(conta_a + f"/itens/{item_a}", headers=auth_headers).status_code == 204
    assert client.delete(conta_a + f"/itens/{item_a}", headers=auth_headers).status_code == 404
    assert client.get(f"/produtos/{produto}/lote", headers=auth_headers).json()[0]["quantidade"] == 3
    assert client.post(conta_b + "/produtos", headers=auth_headers, json=dados).status_code == 201

    segundo = client.post("/produtos", headers=auth_headers, json={
        "nome": "Segundo produto", "preco": "1.25", "quantidade": 4, "data_de_validade": "2030-01-01",
    }).json()["id"]

    def estoque(produto_id):
        lotes = client.get(f"/produtos/{produto_id}/lote", headers=auth_headers).json()
        return sum(lote["quantidade"] for lote in lotes)

    lote = {"itens": [{"produto_id": produto, "quantidade": 1}, {"produto_id": segundo, "quantidade": 5}]}
    antes = client.get(conta_a, headers=sessao_ana).json()
    assert client.post(conta_a + "/produtos", headers=sessao_ana, json=lote).status_code == 409
    assert estoque(produto) == 1 and estoque(segundo) == 4
    assert client.get(conta_a, headers=sessao_ana).json() == antes
    lote["itens"][1]["quantidade"] = 2
    envio = client.post(conta_a + "/produtos", headers=sessao_ana, json=lote)
    assert envio.status_code == 201 and envio.json()["total"] == "12.00"
    fechar = {"itens_ids": [item["id"] for item in envio.json()["itens"]]}
    assert client.post(conta_a + "/encerrar", headers=sessao_ana, json=fechar).status_code == 403
    assert client.post(conta_a + "/encerrar", headers=auth_headers,
                       json={"itens_ids": [antes["itens"][0]["id"]]}).status_code == 409
    vendas_antes = client.get("/vendas", headers=auth_headers).json()
    assert client.post(conta_a + "/encerrar", headers=auth_headers, json=fechar).status_code == 204
    assert client.post(conta_a + "/encerrar", headers=auth_headers, json=fechar).status_code == 409
    saldo = client.get(conta_a, headers=sessao_ana).json()
    assert saldo["itens"] == [] and saldo["total"] == "0.00"
    assert estoque(produto) == 0 and estoque(segundo) == 2
    assert client.get("/vendas", headers=auth_headers).json() == vendas_antes
    assert client.post(conta_a + "/outros", headers=sessao_ana, json=outro).status_code == 201
