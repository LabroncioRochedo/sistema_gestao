import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "@/services/api";

type Produto = {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
};

type ItemComanda = {
  id: number;
  produto_id: number;
  produto_nome?: string;
  nome_produto?: string;
  quantidade: number;
  preco_unitario?: number;
  preco?: number;
};

type Comanda = {
  id: number;
  nome: string;
  status: string;
  usuario_nome?: string;
};

export default function DetalhesComanda() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [itens, setItens] = useState<ItemComanda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const [fechando, setFechando] = useState(false);

  const [mostrarAdicionar, setMostrarAdicionar] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState("1");
  const [busca, setBusca] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    if (!id) return;

    try {
      const token = await SecureStore.getItemAsync("token");
      const [resComanda, resItens, resProdutos] = await Promise.all([
        api.get<Comanda>(`/comandas/${id}`, { headers: { Authorization: `Bearer ${token}`, }, }),
        api.get<ItemComanda[]>(`/comandas/${id}/itens`, { headers: { Authorization: `Bearer ${token}`, }, }),
        api.get<Produto[]>("/produtos", { headers: { Authorization: `Bearer ${token}`, }, }),
      ]);

      setComanda(resComanda.data);
      setItens(resItens.data);
      setProdutos(resProdutos.data);
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro?.response?.data?.detail ??
          "Não foi possível carregar os dados da comanda."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const total = useMemo(() => {
    return itens.reduce((soma, item) => {
      const preco = Number(item.preco_unitario ?? item.preco ?? 0);
      return soma + preco * item.quantidade;
    }, 0);
  }, [itens]);

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(busca.toLowerCase())
  );

  async function adicionarItem() {
    if (!produtoSelecionado) {
      Alert.alert("Selecione um produto", "Escolha um produto da lista.");
      return;
    }

    const qtd = Number(quantidade);

    if (!Number.isInteger(qtd) || qtd < 1) {
      Alert.alert("Quantidade inválida", "Informe um número inteiro maior que zero.");
      return;
    }

    if (qtd > produtoSelecionado.quantidade) {
      Alert.alert(
        "Estoque insuficiente",
        `Disponível: ${produtoSelecionado.quantidade} unidades.`
      );
      return;
    }

    setAdicionando(true);

    try {
      const token = await SecureStore.getItemAsync("token");
      await api.post(`/comandas/${id}/itens`, {
        produto_id: produtoSelecionado.id,
        quantidade: qtd,
      }, { headers: { Authorization: `Bearer ${token}`, }, });

      setProdutoSelecionado(null);
      setQuantidade("1");
      setBusca("");
      setMostrarAdicionar(false);
      await carregarDados();
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro?.response?.data?.detail ??
          "Não foi possível adicionar o produto."
      );
    } finally {
      setAdicionando(false);
    }
  }

  function confirmarRemocao(item: ItemComanda) {
    Alert.alert(
      "Remover item",
      `Deseja remover ${item.produto_nome ?? item.nome_produto ?? "este produto"}? O estoque será devolvido.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => removerItem(item),
        },
      ]
    );
  }

  async function removerItem(item: ItemComanda) {
    setRemovendoId(item.id);

    try {
      const token = await SecureStore.getItemAsync("token");
      await api.delete(`/comandas/${id}/itens/${item.id}`, { headers: { Authorization: `Bearer ${token}`, }, });
      await carregarDados();
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro?.response?.data?.detail ??
          "Não foi possível remover o item."
      );
    } finally {
      setRemovendoId(null);
    }
  }

  function confirmarFechamento() {
    Alert.alert(
      "Fechar comanda",
      `Deseja fechar esta comanda e registrar a venda de ${formatarMoeda(total)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Fechar comanda",
          onPress: fecharComanda,
        },
      ]
    );
  }

  async function fecharComanda() {
  if (!formaPagamento) {
    Alert.alert(
      "Forma de pagamento",
      "Selecione uma forma de pagamento."
    );
    return;
  }

  setFechando(true);

  try {
    const token = await SecureStore.getItemAsync("token");

    await api.post(
      `/comandas/${id}/vender`,
      {
        forma_pagamento: formaPagamento,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    Alert.alert("Sucesso", "Comanda fechada e venda registrada.", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  } catch (erro: any) {
    console.log("ERRO:", erro?.response?.data);

    Alert.alert(
      "Erro",
      erro?.response?.data?.detail ??
        "Não foi possível fechar a comanda."
    );
  } finally {
    setFechando(false);
  }
}

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function nomeDoItem(item: ItemComanda) {
    return item.produto_nome ?? item.nome_produto ?? `Produto #${item.produto_id}`;
  }

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.textoCarregando}>Carregando comanda...</Text>
      </View>
    );
  }

  if (!comanda) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erroTitulo}>Comanda não encontrada</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const aberta = comanda.status?.toLowerCase() === "aberta";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.tela}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        refreshControl={undefined}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>‹ Comandas</Text>
        </TouchableOpacity>

        <View style={styles.cabecalho}>
          <View style={styles.cabecalhoTexto}>
            <Text style={styles.titulo}>{comanda.nome}</Text>
            <Text style={styles.subtitulo}>Comanda #{comanda.id}</Text>
          </View>
          <View style={[styles.status, aberta ? styles.aberta : styles.fechada]}>
            <Text style={[styles.statusTexto, aberta ? styles.abertaTexto : styles.fechadaTexto]}>
              {comanda.status}
            </Text>
          </View>
        </View>

        {comanda.usuario_nome ? (
          <Text style={styles.responsavel}>
            Responsável: {comanda.usuario_nome}
          </Text>
        ) : null}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total da comanda</Text>
          <Text style={styles.totalValor}>{formatarMoeda(total)}</Text>
          <Text style={styles.totalItens}>
            {itens.length} {itens.length === 1 ? "item" : "itens"} lançados
          </Text>
        </View>

        <View style={styles.secaoCabecalho}>
          <Text style={styles.secaoTitulo}>Produtos lançados</Text>
          {aberta && (
            <TouchableOpacity
              style={styles.botaoAdicionar}
              onPress={() => setMostrarAdicionar((valor) => !valor)}
            >
              <Text style={styles.botaoAdicionarTexto}>
                {mostrarAdicionar ? "Cancelar" : "+ Adicionar"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {mostrarAdicionar && aberta && (
          <View style={styles.formulario}>
            <Text style={styles.formTitulo}>Adicionar produto</Text>

            <TextInput
              style={styles.input}
              placeholder="Buscar produto..."
              placeholderTextColor="#9CA3AF"
              value={busca}
              onChangeText={setBusca}
            />

            <Text style={styles.label}>Selecione um produto</Text>
            {produtosFiltrados.length === 0 ? (
              <Text style={styles.semProduto}>Nenhum produto encontrado.</Text>
            ) : (
              <View style={styles.listaProdutos}>
                {produtosFiltrados.map((produto) => {
                  const selecionado = produtoSelecionado?.id === produto.id;
                  const semEstoque = produto.quantidade <= 0;

                  return (
                    <TouchableOpacity
                      key={produto.id}
                      disabled={semEstoque}
                      style={[
                        styles.produtoOpcao,
                        selecionado && styles.produtoSelecionado,
                        semEstoque && styles.produtoIndisponivel,
                      ]}
                      onPress={() => setProdutoSelecionado(produto)}
                    >
                      <View style={styles.produtoOpcaoInfo}>
                        <Text style={styles.produtoNome}>{produto.nome}</Text>
                        <Text style={styles.produtoDetalhe}>
                          {formatarMoeda(produto.preco)} · Estoque: {produto.quantidade}
                        </Text>
                      </View>
                      <Text style={selecionado ? styles.marcado : styles.selecionar}>
                        {semEstoque ? "Sem estoque" : selecionado ? "Selecionado" : "Selecionar"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={styles.label}>Quantidade</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={quantidade}
              onChangeText={setQuantidade}
              placeholder="Ex.: 2"
              placeholderTextColor="#9CA3AF"
            />

            {produtoSelecionado && (
              <Text style={styles.disponivel}>
                Disponível: {produtoSelecionado.quantidade} unidades
              </Text>
            )}

            <TouchableOpacity
              style={[styles.botaoPrimario, adicionando && styles.desativado]}
              onPress={adicionarItem}
              disabled={adicionando}
            >
              <Text style={styles.botaoPrimarioTexto}>
                {adicionando ? "Adicionando..." : "Adicionar à comanda"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {itens.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>Nenhum produto lançado</Text>
            <Text style={styles.vazioTexto}>
              Adicione produtos para começar a registrar o consumo.
            </Text>
          </View>
        ) : (
          <View style={styles.listaItens}>
            {itens.map((item) => {
              const preco = Number(item.preco_unitario ?? item.preco ?? 0);
              const subtotal = preco * item.quantidade;

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemNome}>{nomeDoItem(item)}</Text>
                    <Text style={styles.itemDetalhe}>
                      {item.quantidade} × {formatarMoeda(preco)}
                    </Text>
                  </View>

                  <View style={styles.itemDireita}>
                    <Text style={styles.subtotal}>
                      {formatarMoeda(subtotal)}
                    </Text>
                    {aberta && (
                      <TouchableOpacity
                        onPress={() => confirmarRemocao(item)}
                        disabled={removendoId === item.id}
                      >
                        <Text style={styles.remover}>
                          {removendoId === item.id ? "Removendo..." : "Remover"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {aberta ? (
          <>
            <View style={styles.pagamentoCard}>
              <Text style={styles.pagamentoTitulo}>
                Forma de pagamento
              </Text>

              <View style={styles.opcoesPagamento}>
                {[
                  { valor: "dinheiro", nome: "Dinheiro" },
                  { valor: "pix", nome: "Pix" },
                  { valor: "debito", nome: "Débito" },
                  { valor: "credito", nome: "Crédito" },
                ].map((opcao) => {
                  const selecionada = formaPagamento === opcao.valor;

                  return (
                    <TouchableOpacity
                      key={opcao.valor}
                      style={[
                        styles.opcaoPagamento,
                        selecionada && styles.opcaoPagamentoSelecionada,
                      ]}
                      onPress={() => setFormaPagamento(opcao.valor)}
                    >
                      <Text
                        style={[
                          styles.opcaoPagamentoTexto,
                          selecionada && styles.opcaoPagamentoTextoSelecionada,
                        ]}
                      >
                        {opcao.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.botaoFechar,
                (fechando || itens.length === 0) && styles.desativado,
              ]}
              onPress={confirmarFechamento}
              disabled={fechando || itens.length === 0}
            >
              <Text style={styles.botaoFecharTexto}>
                {fechando ? "Fechando..." : "Fechar comanda"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.avisoFechada}>
            <Text style={styles.avisoFechadaTexto}>
              Esta comanda já foi encerrada.
            </Text>
          </View>
        )} 
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    pagamentoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 22,
  },

  pagamentoTitulo: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },

  opcoesPagamento: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  opcaoPagamento: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },

  opcaoPagamentoSelecionada: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },

  opcaoPagamentoTexto: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },

  opcaoPagamentoTextoSelecionada: {
    color: "#2563EB",
  },
  flex: { flex: 1 },
  tela: { flex: 1, backgroundColor: "#F8FAFC" },
  conteudo: { padding: 18, paddingBottom: 40 },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  textoCarregando: { color: "#6B7280", marginTop: 10 },
  erroTitulo: { color: "#111827", fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  link: { color: "#2563EB", fontWeight: "bold" },
  voltar: { color: "#2563EB", fontSize: 16, marginBottom: 20 },
  cabecalho: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cabecalhoTexto: { flex: 1 },
  titulo: { fontSize: 27, color: "#111827", fontWeight: "bold" },
  subtitulo: { color: "#6B7280", marginTop: 4 },
  responsavel: { color: "#6B7280", marginTop: 10, fontSize: 13 },
  status: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 10 },
  aberta: { backgroundColor: "#DCFCE7" },
  fechada: { backgroundColor: "#E5E7EB" },
  statusTexto: { fontSize: 12, fontWeight: "bold", textTransform: "capitalize" },
  abertaTexto: { color: "#15803D" },
  fechadaTexto: { color: "#4B5563" },
  totalCard: {
    backgroundColor: "#1D4ED8",
    borderRadius: 16,
    padding: 20,
    marginTop: 22,
    marginBottom: 24,
  },
  totalLabel: { color: "#DBEAFE", fontSize: 14 },
  totalValor: { color: "#FFFFFF", fontSize: 30, fontWeight: "bold", marginTop: 5 },
  totalItens: { color: "#DBEAFE", fontSize: 12, marginTop: 6 },
  secaoCabecalho: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  secaoTitulo: { fontSize: 18, color: "#111827", fontWeight: "bold" },
  botaoAdicionar: { backgroundColor: "#2563EB", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 9 },
  botaoAdicionarTexto: { color: "#FFFFFF", fontWeight: "bold", fontSize: 13 },
  formulario: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 15, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 18 },
  formTitulo: { color: "#111827", fontSize: 17, fontWeight: "bold", marginBottom: 12 },
  input: { height: 46, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 9, paddingHorizontal: 12, color: "#111827", backgroundColor: "#FFFFFF", fontSize: 15 },
  label: { color: "#374151", fontSize: 13, fontWeight: "600", marginTop: 14, marginBottom: 8 },
  listaProdutos: { gap: 8, marginTop: 2 },
  produtoOpcao: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 9, padding: 11, backgroundColor: "#FFFFFF" },
  produtoSelecionado: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  produtoIndisponivel: { opacity: 0.45 },
  produtoOpcaoInfo: { flex: 1, marginRight: 8 },
  produtoNome: { color: "#111827", fontWeight: "600" },
  produtoDetalhe: { color: "#6B7280", fontSize: 12, marginTop: 4 },
  marcado: { color: "#2563EB", fontSize: 12, fontWeight: "bold" },
  selecionar: { color: "#6B7280", fontSize: 12 },
  semProduto: { color: "#6B7280", paddingVertical: 12 },
  disponivel: { color: "#15803D", fontSize: 12, marginTop: 7 },
  botaoPrimario: { backgroundColor: "#2563EB", borderRadius: 9, height: 48, justifyContent: "center", alignItems: "center", marginTop: 16 },
  botaoPrimarioTexto: { color: "#FFFFFF", fontWeight: "bold" },
  desativado: { opacity: 0.5 },
  vazio: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  vazioTitulo: { color: "#111827", fontSize: 15, fontWeight: "bold" },
  vazioTexto: { color: "#6B7280", textAlign: "center", marginTop: 6, lineHeight: 20 },
  listaItens: { gap: 10 },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", padding: 14, flexDirection: "row", alignItems: "center" },
  itemInfo: { flex: 1, marginRight: 10 },
  itemNome: { color: "#111827", fontSize: 15, fontWeight: "bold" },
  itemDetalhe: { color: "#6B7280", fontSize: 12, marginTop: 5 },
  itemDireita: { alignItems: "flex-end" },
  subtotal: { color: "#111827", fontWeight: "bold", fontSize: 15 },
  remover: { color: "#DC2626", fontSize: 12, fontWeight: "600", marginTop: 8 },
  botaoFechar: { height: 54, backgroundColor: "#15803D", borderRadius: 11, justifyContent: "center", alignItems: "center", marginTop: 24 },
  botaoFecharTexto: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  avisoFechada: { marginTop: 22, padding: 14, backgroundColor: "#E5E7EB", borderRadius: 10 },
  avisoFechadaTexto: { color: "#374151", textAlign: "center", fontWeight: "600" },
});