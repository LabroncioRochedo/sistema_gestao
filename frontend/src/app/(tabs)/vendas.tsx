
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "../../services/api";

type Venda = {
  id: number;
  usuario_id: number;
  valor_total: number | string;
  forma_pagamento: string;
  data_venda: string;
  usuario_nome: string;
};

type ItemVenda = {
  id: number;
  venda_id: number;
  produto_id: number;
  usuario_id: number;
  quantidade: number;
  preco_unitario: number | string;
  produto_nome: string;
  usuario_nome: string;
};

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [itensPorVenda, setItensPorVenda] = useState<
    Record<number, ItemVenda[]>
  >({});
  const [vendaAberta, setVendaAberta] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [carregandoItens, setCarregandoItens] = useState(false);
  const [erro, setErro] = useState("");

  const carregarVendas = async (atualizar = false) => {
    try {
      if (atualizar) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro("");

      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        setErro("Sessão não encontrada. Faça login novamente.");
        return;
      }

      const response = await api.get<Venda[]>("/vendas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVendas(response.data);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
      setErro("Não foi possível carregar as vendas.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };

  const carregarItens = async (vendaId: number) => {
    try {
      setCarregandoItens(true);
      setErro("");

      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        setErro("Sessão não encontrada. Faça login novamente.");
        return;
      }

      // Confirme se esta é a rota usada no seu router FastAPI.
      const response = await api.get<ItemVenda[]>(
        `/vendas/${vendaId}/itens`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setItensPorVenda((atual) => ({
        ...atual,
        [vendaId]: response.data,
      }));
    } catch (error) {
      console.error("Erro ao carregar itens da venda:", error);
      setErro(`Não foi possível carregar os itens da venda #${vendaId}.`);
    } finally {
      setCarregandoItens(false);
    }
  };

  const abrirVenda = async (vendaId: number) => {
    if (vendaAberta === vendaId) {
      setVendaAberta(null);
      return;
    }

    setVendaAberta(vendaId);

    if (itensPorVenda[vendaId] === undefined) {
      await carregarItens(vendaId);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarVendas();
    }, [])
  );

  const dinheiro = (valor: number | string) => {
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const dataFormatada = (valor: string) => {
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return valor;
    }

    return data.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const pagamentoFormatado = (forma: string) => {
    const formas: Record<string, string> = {
      dinheiro: "Dinheiro",
      pix: "Pix",
      debito: "Débito",
      credito: "Crédito",
      crédito: "Crédito",
    };

    return formas[forma.toLowerCase()] ?? forma;
  };

  const renderVenda = ({ item }: { item: Venda }) => {
    const aberta = vendaAberta === item.id;
    const itens = itensPorVenda[item.id];

    return (
      <View style={styles.card}>
        <Pressable
          style={styles.cardCabecalho}
          onPress={() => abrirVenda(item.id)}
        >
          <View style={styles.info}>
            <Text style={styles.vendaTitulo}>Venda #{item.id}</Text>
            <Text style={styles.data}>
              {dataFormatada(item.data_venda)}
            </Text>
            <Text style={styles.detalhe}>
              Funcionário: {item.usuario_nome}
            </Text>
            <Text style={styles.detalhe}>
              Pagamento: {pagamentoFormatado(item.forma_pagamento)}
            </Text>
          </View>

          <View style={styles.valorArea}>
            <Text style={styles.valor}>
              {dinheiro(item.valor_total)}
            </Text>
            <Text style={styles.abrirTexto}>
              {aberta ? "Fechar ▲" : "Ver itens ▼"}
            </Text>
          </View>
        </Pressable>

        {aberta && (
          <View style={styles.itensArea}>
            <Text style={styles.itensTitulo}>Itens vendidos</Text>

            {carregandoItens && itens === undefined ? (
              <ActivityIndicator color="#2563eb" />
            ) : itens && itens.length > 0 ? (
              itens.map((produto) => {
                const subtotal =
                  Number(produto.preco_unitario) * produto.quantidade;

                return (
                  <View key={produto.id} style={styles.itemLinha}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.produtoNome}>
                        {produto.produto_nome}
                      </Text>
                      <Text style={styles.quantidade}>
                        {produto.quantidade} ×{" "}
                        {dinheiro(produto.preco_unitario)}
                      </Text>
                    </View>

                    <Text style={styles.subtotal}>
                      {dinheiro(subtotal)}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.semItens}>
                Nenhum item encontrado para esta venda.
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.carregandoTexto}>Carregando vendas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View>
          <Text style={styles.titulo}>Vendas</Text>
          <Text style={styles.subtitulo}>Histórico de vendas</Text>
        </View>

        <Pressable
          style={styles.botaoAtualizar}
          onPress={() => carregarVendas(true)}
        >
          <Text style={styles.botaoTexto}>Atualizar</Text>
        </Pressable>
      </View>

      <View style={styles.resumo}>
        <Text style={styles.resumoLabel}>Total de vendas registradas</Text>
        <Text style={styles.resumoValor}>{vendas.length}</Text>
      </View>

      {erro !== "" && (
        <View style={styles.erroBox}>
          <Text style={styles.erroTexto}>{erro}</Text>
          <Pressable onPress={() => carregarVendas()}>
            <Text style={styles.tentar}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={vendas}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderVenda}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarVendas(true)}
          />
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>Nenhuma venda encontrada</Text>
            <Text style={styles.vazioTexto}>
              As vendas realizadas aparecerão aqui.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6fa",
    paddingTop: 55,
  },
  topo: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#172033",
  },
  subtitulo: {
    color: "#687386",
    fontSize: 14,
    marginTop: 4,
  },
  botaoAtualizar: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  botaoTexto: {
    color: "#fff",
    fontWeight: "600",
  },
  resumo: {
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6eaf0",
  },
  resumoLabel: {
    color: "#687386",
    fontSize: 13,
  },
  resumoValor: {
    color: "#172033",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 4,
  },
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e6eaf0",
    overflow: "hidden",
  },
  cardCabecalho: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  info: {
    flex: 1,
  },
  vendaTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#172033",
    marginBottom: 5,
  },
  data: {
    color: "#687386",
    fontSize: 13,
    marginBottom: 8,
  },
  detalhe: {
    color: "#475467",
    fontSize: 13,
    marginTop: 3,
  },
  valorArea: {
    alignItems: "flex-end",
  },
  valor: {
    color: "#15803d",
    fontSize: 16,
    fontWeight: "bold",
  },
  abrirTexto: {
    color: "#2563eb",
    fontSize: 12,
    marginTop: 10,
    fontWeight: "600",
  },
  itensArea: {
    borderTopWidth: 1,
    borderTopColor: "#e6eaf0",
    padding: 16,
    backgroundColor: "#fafbfc",
  },
  itensTitulo: {
    color: "#172033",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 10,
  },
  itemLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f4",
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  produtoNome: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "600",
  },
  quantidade: {
    color: "#687386",
    fontSize: 12,
    marginTop: 4,
  },
  subtotal: {
    color: "#172033",
    fontSize: 14,
    fontWeight: "600",
  },
  semItens: {
    color: "#687386",
    fontSize: 13,
  },
  centralizado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6fa",
  },
  carregandoTexto: {
    color: "#687386",
    marginTop: 12,
  },
  vazio: {
    alignItems: "center",
    padding: 30,
    marginTop: 20,
  },
  vazioTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#172033",
  },
  vazioTexto: {
    color: "#687386",
    textAlign: "center",
    marginTop: 6,
  },
  erroBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fee2e2",
  },
  erroTexto: {
    color: "#991b1b",
  },
  tentar: {
    color: "#1d4ed8",
    fontWeight: "bold",
    marginTop: 8,
  },
});