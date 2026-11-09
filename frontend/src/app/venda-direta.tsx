
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput
} from "react-native";
import { useRouter } from "expo-router";
import api from "@/services/api";

type Produto = {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
};

type FormaPagamento = "dinheiro" | "pix" | "credito"| "debito";

const FORMAS_PAGAMENTO: {
  valor: FormaPagamento;
  titulo: string;
}[] = [
  { valor: "dinheiro", titulo: "Dinheiro" },
  { valor: "pix", titulo: "Pix" },
  { valor: "debito", titulo: "Debito" },
  { valor: "credito", titulo: "Credito" },
];

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function VendaDiretaScreen() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("dinheiro");

  const [carregando, setCarregando] = useState(true);
  const [vendendo, setVendendo] = useState(false);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    try {
      const token = await SecureStore.getItemAsync("token");

      const resposta = await api.get<Produto[]>("/produtos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProdutos(resposta.data);
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro?.response?.data?.detail ??
          "Não foi possível carregar os produtos."
      );
    } finally {
      setCarregando(false);
    }
  }

  function alterarQuantidade(produto: Produto, incremento: number) {
    setQuantidades((anteriores) => {
      const atual = anteriores[produto.id] ?? 0;

      const novaQuantidade = Math.max(
        0,
        Math.min(produto.quantidade, atual + incremento)
      );

      return {
        ...anteriores,
        [produto.id]: novaQuantidade,
      };
    });
  }
  const produtosFiltrados = produtos.filter((produto) =>
  produto.nome.toLowerCase().includes(busca.trim().toLowerCase())
  );
  const itensSelecionados = produtos
    .filter((produto) => (quantidades[produto.id] ?? 0) > 0)
    .map((produto) => ({
      produto_id: produto.id,
      quantidade: quantidades[produto.id] ?? 0,
    }));

  const total = produtos.reduce(
    (soma, produto) =>
      soma +
      produto.preco * (quantidades[produto.id] ?? 0),
    0
  );

  async function finalizarVenda() {
    if (itensSelecionados.length === 0) {
      Alert.alert(
        "Atenção",
        "Selecione pelo menos um produto para realizar a venda."
      );
      return;
    }

    setVendendo(true);

    try {
      const token = await SecureStore.getItemAsync("token");

      await api.post(
        "/vendas/direto",
        {
          forma_pagamento: formaPagamento,
          itens: itensSelecionados,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        "Sucesso",
        "Venda realizada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro?.response?.data?.detail ??
          "Não foi possível realizar a venda."
      );
    } finally {
      setVendendo(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.conteudo}>
        <View style={styles.cabecalho}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.botaoVoltar}
          >
            <Text style={styles.botaoVoltarTexto}>‹ Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>Venda direta</Text>

          <Text style={styles.subtitulo}>
            Selecione os produtos e a forma de pagamento.
          </Text>
        </View>

        {carregando ? (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.textoEstado}>
              Carregando produtos...
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.lista}
              contentContainerStyle={styles.listaConteudo}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.secaoTitulo}>
                Produtos
              </Text>
              <TextInput
                style={styles.busca}
                placeholder="Buscar produto..."
                placeholderTextColor="#9CA3AF"
                value={busca}
                onChangeText={setBusca}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {produtos.length === 0 ? (
                <Text style={styles.textoEstado}>
                  Nenhum produto cadastrado.
                </Text>
              ) : produtosFiltrados.length === 0 ? (
                <Text style={styles.textoEstado}>
                  Nenhum produto encontrado.
                </Text>
              ) : (
                produtosFiltrados.map((produto) => {
                  const quantidadeAtual =
                    quantidades[produto.id] ?? 0;

                  const semEstoque = produto.quantidade <= 0;

                  return (
                    <View
                      key={produto.id}
                      style={[
                        styles.cardProduto,
                        semEstoque && styles.cardIndisponivel,
                      ]}
                    >
                      <View style={styles.infoProduto}>
                        <Text style={styles.nomeProduto}>
                          {produto.nome}
                        </Text>

                        <Text style={styles.precoProduto}>
                          {formatarMoeda(produto.preco)}
                        </Text>

                        <Text style={styles.estoqueProduto}>
                          Estoque: {produto.quantidade}
                        </Text>
                      </View>

                      <View style={styles.contador}>
                        <TouchableOpacity
                          style={[
                            styles.contadorBotao,
                            quantidadeAtual === 0 &&
                              styles.contadorDesativado,
                          ]}
                          onPress={() =>
                            alterarQuantidade(produto, -1)
                          }
                          disabled={quantidadeAtual === 0}
                        >
                          <Text style={styles.contadorTexto}>
                            −
                          </Text>
                        </TouchableOpacity>

                        <Text style={styles.contadorValor}>
                          {quantidadeAtual}
                        </Text>

                        <TouchableOpacity
                          style={[
                            styles.contadorBotao,
                            (semEstoque ||
                              quantidadeAtual >= produto.quantidade) &&
                              styles.contadorDesativado,
                          ]}
                          onPress={() =>
                            alterarQuantidade(produto, 1)
                          }
                          disabled={
                            semEstoque ||
                            quantidadeAtual >= produto.quantidade
                          }
                        >
                          <Text style={styles.contadorTexto}>
                            +
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}

              <Text style={styles.secaoTitulo}>
                Forma de pagamento
              </Text>

              <View style={styles.formasPagamento}>
                {FORMAS_PAGAMENTO.map((forma) => {
                  const selecionada =
                    formaPagamento === forma.valor;

                  return (
                    <TouchableOpacity
                      key={forma.valor}
                      style={[
                        styles.formaPagamento,
                        selecionada &&
                          styles.formaPagamentoSelecionada,
                      ]}
                      onPress={() =>
                        setFormaPagamento(forma.valor)
                      }
                    >
                      <Text
                        style={[
                          styles.formaPagamentoTexto,
                          selecionada &&
                            styles.formaPagamentoTextoSelecionado,
                        ]}
                      >
                        {forma.titulo}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.rodape}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>
                  Total da venda
                </Text>

                <Text style={styles.totalValor}>
                  {formatarMoeda(total)}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.botaoFinalizar,
                  vendendo && styles.botaoDesativado,
                ]}
                onPress={finalizarVenda}
                disabled={vendendo}
              >
                <Text style={styles.botaoFinalizarTexto}>
                  {vendendo ? "Finalizando..." : "Finalizar venda"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  cabecalho: {
    marginBottom: 20,
  },
  botaoVoltar: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    marginBottom: 8,
  },
  botaoVoltarTexto: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
  titulo: {
    color: "#111827",
    fontSize: 27,
    fontWeight: "bold",
  },
  subtitulo: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 5,
  },
  busca: {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#CBD5E1",
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 14,
  color: "#111827",
  marginBottom: 14,
  },
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingBottom: 20,
  },
  secaoTitulo: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
  },
  cardProduto: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 13,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardIndisponivel: {
    opacity: 0.55,
  },
  infoProduto: {
    flex: 1,
    gap: 3,
  },
  nomeProduto: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "bold",
  },
  precoProduto: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
  estoqueProduto: {
    color: "#6B7280",
    fontSize: 12,
  },
  contador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  contadorBotao: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  contadorDesativado: {
    backgroundColor: "#D1D5DB",
  },
  contadorTexto: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
  },
  contadorValor: {
    minWidth: 22,
    textAlign: "center",
    color: "#111827",
    fontSize: 16,
    fontWeight: "bold",
  },
  formasPagamento: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 15,
  },
  formaPagamento: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: "center",
  },
  formaPagamentoSelecionada: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  formaPagamentoTexto: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 13,
  },
  formaPagamentoTextoSelecionado: {
    color: "#2563EB",
  },
  estado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  textoEstado: {
    color: "#64748B",
    fontSize: 14,
  },
  rodape: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#F8FAFC",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "600",
  },
  totalValor: {
    color: "#111827",
    fontSize: 21,
    fontWeight: "bold",
  },
  botaoFinalizar: {
    backgroundColor: "#16A34A",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  botaoFinalizarTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  botaoDesativado: {
    opacity: 0.6,
  },
});
