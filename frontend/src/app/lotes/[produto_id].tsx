
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "@/services/api";

type Lote = {
  id: number;
  quantidade: number;
  data_de_validade: string;
};

export default function LotesScreen() {
  const { produto_id, produto_nome } = useLocalSearchParams<{
    produto_id: string;
    produto_nome: string;
  }>();

  const [porCaixa, setPorCaixa] = useState(false);
  const [caixas, setCaixas] = useState("");
  const [unidadesPorCaixa, setUnidadesPorCaixa] = useState("");
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [quantidade, setQuantidade] = useState("");
  const [validade, setValidade] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarLotes = useCallback(async () => {
    try {
      setErro("");

      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        setErro("Sessão não encontrada. Faça login novamente.");
        return;
      }

      const resposta = await api.get<Lote[]>(
        `/produtos/${produto_id}/lote`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLotes(resposta.data);
    } catch (error) {
      console.error("Erro ao carregar lotes:", error);
      setErro("Não foi possível carregar os lotes.");
    } finally {
      setCarregando(false);
    }
  }, [produto_id]);

  useEffect(() => {
    carregarLotes();
  }, [carregarLotes]);

  const criarLote = async () => {
    const quantidadeNumero = porCaixa
    ? Number(caixas) * Number(unidadesPorCaixa)
    : Number(quantidade);
    if (
    !Number.isInteger(quantidadeNumero) ||
    quantidadeNumero <= 0
    ) {
    Alert.alert(
      "Atenção",
      "Informe uma quantidade válida."
    );
    return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(validade)) {
      Alert.alert(
        "Atenção",
        "Informe a validade no formato AAAA-MM-DD, por exemplo 2027-12-31."
      );
      return;
    }

    const data = new Date(`${validade}T00:00:00`);

    if (
      Number.isNaN(data.getTime()) ||
      data.toISOString().slice(0, 10) !== validade
    ) {
      Alert.alert("Atenção", "Informe uma data válida.");
      return;
    }

    try {
      setSalvando(false);
      setErro("");

      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        Alert.alert("Sessão expirada", "Faça login novamente.");
        return;
      }

      setSalvando(true);

      await api.post(
        `/produtos/${produto_id}/lote`,
        {
          quantidade: quantidadeNumero,
          data_de_validade: validade,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setQuantidade("");
      setValidade("");

      await carregarLotes();

      Alert.alert("Sucesso", "Lote criado com sucesso.");
    } catch (error) {
      console.error("Erro ao criar lote:", error);
      Alert.alert("Erro", "Não foi possível criar o lote.");
    } finally {
      setSalvando(false);
    }
  };

  const formatarData = (data: string) => {
    if (!data) return "Não informada";

    const partes = data.slice(0, 10).split("-");

    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.conteudo}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.titulo}>Lotes do produto</Text>
        <Text style={styles.produtoNome}>{produto_nome}</Text>

        <View style={styles.formulario}>
          <Text style={styles.formularioTitulo}>Cadastrar novo lote</Text>

          <TouchableOpacity
  onPress={() => setPorCaixa(!porCaixa)}
  style={styles.botaoAlternar}
>
  <Text style={styles.textoAlternar}>
    {porCaixa
      ? "Informar quantidade total"
      : "Adicionar por caixa"}
  </Text>
</TouchableOpacity>

{porCaixa ? (
  <>
    <TextInput
      style={styles.input}
      placeholder="Quantidade de caixas"
      keyboardType="numeric"
      value={caixas}
      onChangeText={setCaixas}
    />

    <TextInput
      style={styles.input}
      placeholder="Unidades por caixa"
      keyboardType="numeric"
      value={unidadesPorCaixa}
      onChangeText={setUnidadesPorCaixa}
    />

    <Text>
      Quantidade total:{" "}
      {Number(caixas || 0) * Number(unidadesPorCaixa || 0)}
    </Text>
  </>
) : (
  <TextInput
    style={styles.input}
    placeholder="Quantidade total"
    keyboardType="numeric"
    value={quantidade}
    onChangeText={setQuantidade}
  />
)}

          <Text style={styles.label}>Data de validade</Text>
          <TextInput
            style={styles.input}
            value={validade}
            onChangeText={setValidade}
            placeholder="AAAA-MM-DD"
            maxLength={10}
          />

          <Pressable
            style={[styles.botao, salvando && styles.botaoDesativado]}
            onPress={criarLote}
            disabled={salvando}
          >
            <Text style={styles.botaoTexto}>
              {salvando ? "Salvando..." : "Adicionar lote"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.cabecalhoLista}>
          <Text style={styles.listaTitulo}>Lotes cadastrados</Text>

          <Pressable onPress={carregarLotes}>
            <Text style={styles.atualizar}>Atualizar</Text>
          </Pressable>
        </View>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color="#2563EB"
            style={styles.carregando}
          />
        ) : erro ? (
          <View style={styles.estado}>
            <Text style={styles.erro}>{erro}</Text>
            <Pressable onPress={carregarLotes}>
              <Text style={styles.atualizar}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={lotes}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.lista}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View>
                  <Text style={styles.loteTitulo}>Lote #{item.id}</Text>
                  <Text style={styles.detalhe}>
                    Quantidade: {item.quantidade}
                  </Text>
                  <Text style={styles.detalhe}>
                    Validade: {formatarData(item.data_de_validade)}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.vazio}>
                Nenhum lote cadastrado para este produto.
              </Text>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  botaoAlternar: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },

  textoAlternar: {
    color: "#2563eb",
    fontWeight: "600",
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titulo: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#0F172A",
  },
  produtoNome: {
    fontSize: 16,
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 5,
    marginBottom: 20,
  },
  formulario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 22,
  },
  formularioTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 14,
  },
  label: {
    color: "#334155",
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#0F172A",
    marginBottom: 14,
  },
  botao: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 2,
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  cabecalhoLista: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listaTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },
  atualizar: {
    color: "#2563EB",
    fontWeight: "600",
  },
  lista: {
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  loteTitulo: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 5,
  },
  detalhe: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 4,
  },
  carregando: {
    marginTop: 24,
  },
  estado: {
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  erro: {
    color: "#DC2626",
    textAlign: "center",
  },
  vazio: {
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 24,
  },
});
