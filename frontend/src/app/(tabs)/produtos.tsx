import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import api from "@/services/api";
import { useRouter } from "expo-router";

const router = useRouter();

type Produto = {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  data_de_validade: string;
};

const LIMITE_ESTOQUE_BAIXO = 5;

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string) {
  if (!data) return "Não informada";

  const partes = data.slice(0, 10).split("-");

  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obterStatus(quantidade: number) {
  if (quantidade <= 0) {
    return {
      texto: "Esgotado",
      cor: "#DC2626",
      fundo: "#FEE2E2",
    };
  }

  if (quantidade <= LIMITE_ESTOQUE_BAIXO) {
    return {
      texto: "Estoque baixo",
      cor: "#B45309",
      fundo: "#FEF3C7",
    };
  }

  return {
    texto: "Disponível",
    cor: "#15803D",
    fundo: "#DCFCE7",
  };
}

export default function ProdutosScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarProdutos = useCallback(async () => {
    try {
      setErro("");

      const token = await SecureStore.getItemAsync("token");

      const resposta = await api.get<Produto[]>("/produtos", { headers: { Authorization: `Bearer ${token}`, }, });

      setProdutos(resposta.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setErro("Não foi possível carregar os produtos.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return produtos;

    return produtos.filter((produto) =>
      produto.nome.toLowerCase().includes(termo)
    );
  }, [produtos, busca]);

  const estoqueBaixo = produtos.filter(
    (produto) =>
      produto.quantidade > 0 &&
      produto.quantidade <= LIMITE_ESTOQUE_BAIXO
  ).length;

  const semEstoque = produtos.filter(
    (produto) => produto.quantidade <= 0
  ).length;

  const atualizar = () => {
    setAtualizando(true);
    carregarProdutos();
  };

  const renderProduto = ({ item }: { item: Produto }) => {
    const status = obterStatus(item.quantidade);

    return (
      <View style={styles.card}>
        <View style={styles.iconeProduto}>
          <Text style={styles.iconeTexto}>▦</Text>
        </View>

        <View style={styles.infoProduto}>
          <Text style={styles.nomeProduto}>{item.nome}</Text>

          <Text style={styles.preco}>
            {formatarPreco(item.preco)}
          </Text>

          <Text style={styles.detalhe}>
            Quantidade: {item.quantidade}
          </Text>

          <Text style={styles.detalhe}>
            Validade: {formatarData(item.data_de_validade)}
          </Text>
        </View>

        <View
          style={[
            styles.status,
            { backgroundColor: status.fundo },
          ]}
        >
          <Text
            style={[
              styles.statusTexto,
              { color: status.cor },
            ]}
          >
            {status.texto}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.conteudo}>
        <View style={styles.cabecalho}>
          <Text style={styles.subtitulo}>
            SISTEMA DE GESTÃO
          </Text>

          <Text style={styles.titulo}>Produtos</Text>

          <Text style={styles.descricao}>
            Gerencie seus produtos e acompanhe o estoque.
          </Text>
        </View>

        <View style={styles.resumo}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Produtos</Text>
            <Text style={styles.resumoValor}>
              {produtos.length}
            </Text>
          </View>

          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Estoque baixo</Text>
            <Text style={styles.resumoValor}>
              {estoqueBaixo}
            </Text>
          </View>

          <View style={styles.resumoItem}>
            <Text style={styles.resumoLabel}>Esgotados</Text>
            <Text style={styles.resumoValor}>
              {semEstoque}
            </Text>
          </View>
        </View>

        <TextInput
          style={styles.busca}
          placeholder="Buscar produto..."
          placeholderTextColor="#9CA3AF"
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
          returnKeyType="search"
        />

        <View style={styles.tituloLista}>
          <Text style={styles.tituloListaTexto}>
            Lista de produtos
          </Text>

          <TouchableOpacity onPress={atualizar}>
            <Text style={styles.atualizarTexto}>
              Atualizar
            </Text>
          </TouchableOpacity>
        </View>

        {carregando ? (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.estadoTexto}>
              Carregando produtos...
            </Text>
          </View>
        ) : erro ? (
          <View style={styles.estado}>
            <Text style={styles.erro}>{erro}</Text>
            <TouchableOpacity
              style={styles.botaoTentar}
              onPress={() => {
                setCarregando(true);
                carregarProdutos();
              }}
            >
              <Text style={styles.botaoTentarTexto}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={produtosFiltrados}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderProduto}
            contentContainerStyle={styles.lista}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={atualizar}
              />
            }
            ListEmptyComponent={
              <View style={styles.estado}>
                <Text style={styles.estadoTexto}>
                  {busca
                    ? "Nenhum produto encontrado."
                    : "Nenhum produto cadastrado."}
                </Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={styles.botaoNovo}
          onPress={() => router.push("/(tabs)/novo-produto")}
        >
          <Text style={styles.botaoNovoTexto}>
            + Novo produto
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cabecalho: {
    marginBottom: 20,
  },
  subtitulo: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  titulo: {
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 5,
  },
  descricao: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 5,
  },
  resumo: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  resumoItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  resumoLabel: {
    color: "#64748B",
    fontSize: 11,
  },
  resumoValor: {
    color: "#0F172A",
    fontSize: 23,
    fontWeight: "bold",
    marginTop: 6,
  },
  busca: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 18,
  },
  tituloLista: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tituloListaTexto: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "bold",
  },
  atualizarTexto: {
    color: "#2563EB",
    fontWeight: "600",
  },
  lista: {
    paddingBottom: 16,
    gap: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconeProduto: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconeTexto: {
    fontSize: 27,
    color: "#2563EB",
  },
  infoProduto: {
    flex: 1,
    gap: 3,
  },
  nomeProduto: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "bold",
  },
  preco: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
  detalhe: {
    color: "#64748B",
    fontSize: 12,
  },
  status: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusTexto: {
    fontSize: 10,
    fontWeight: "700",
  },
  estado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  estadoTexto: {
    color: "#64748B",
    fontSize: 14,
  },
  erro: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
  },
  botaoTentar: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  botaoTentarTexto: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  botaoNovo: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  botaoNovoTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});