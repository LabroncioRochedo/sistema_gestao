import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import api from "@/services/api";

type Comanda = {
  id: number;
  nome: string;
  status: string;
  usuario_nome?: string;
  data_abertura?: string;
};

export default function ComandasScreen() {
  const router = useRouter();

  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [criando, setCriando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nome, setNome] = useState("");

  const carregarComandas = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const resposta = await api.get<Comanda[]>("/comandas", { headers: { Authorization: `Bearer ${token}`, }, });
      setComandas(resposta.data);
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro?.response?.data?.detail ??
          "Não foi possível carregar as comandas."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarComandas();
  }, [carregarComandas]);

  function atualizarLista() {
    setAtualizando(true);
    carregarComandas();
  }

  async function criarComanda() {
    const nomeLimpo = nome.trim();

    if (!nomeLimpo) {
      Alert.alert("Campo obrigatório", "Informe o nome da comanda.");
      return;
    }

    setCriando(true);

    try {
      const token = await SecureStore.getItemAsync("token");
      await api.post("/comandas", {
        nome: nomeLimpo,
      }, { headers: { Authorization: `Bearer ${token}`, }, });

      setNome("");
      setMostrarFormulario(false);
      await carregarComandas();
      Alert.alert("Sucesso", "Comanda criada!");
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro?.response?.data?.detail ??
          "Não foi possível criar a comanda."
      );
    } finally {
      setCriando(false);
    }
  }

  const abertas = comandas.filter(
    (comanda) => comanda.status?.toLowerCase() === "aberta"
  );

  const encerradas = comandas.filter(
    (comanda) => comanda.status?.toLowerCase() !== "aberta"
  );

  function abrirComanda(comanda: Comanda) {
    router.push({
      pathname: "/(tabs)/comandas/[id]",
      params: { id: String(comanda.id) },
    });
  }

  function renderComanda({ item }: { item: Comanda }) {
    const aberta = item.status?.toLowerCase() === "aberta";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => abrirComanda(item)}
      >
        <View style={styles.cardTopo}>
          <View style={styles.iconeComanda}>
            <Text style={styles.iconeTexto}>▤</Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.nomeComanda}>{item.nome}</Text>
            <Text style={styles.idComanda}>Comanda #{item.id}</Text>
          </View>

          <View
            style={[
              styles.status,
              aberta ? styles.statusAberta : styles.statusFechada,
            ]}
          >
            <Text
              style={[
                styles.statusTexto,
                aberta
                  ? styles.statusTextoAberta
                  : styles.statusTextoFechada,
              ]}
            >
              {aberta ? "Aberta" : item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardRodape}>
          <Text style={styles.funcionario}>
            {item.usuario_nome
              ? `Responsável: ${item.usuario_nome}`
              : "Responsável não informado"}
          </Text>
          <Text style={styles.abrirTexto}>Ver comanda  ›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.tela}>
        <View style={styles.cabecalho}>
          <View>
            <Text style={styles.titulo}>Comandas</Text>
            <Text style={styles.subtitulo}>
              Gerencie os pedidos em andamento
            </Text>
          </View>

          <TouchableOpacity
            style={styles.botaoAdicionar}
            onPress={() => setMostrarFormulario((atual) => !atual)}
          >
            <Text style={styles.botaoAdicionarTexto}>
              {mostrarFormulario ? "Cancelar" : "+ Nova"}
            </Text>
          </TouchableOpacity>
        </View>

        {mostrarFormulario && (
          <View style={styles.formulario}>
            <Text style={styles.formTitulo}>Nova comanda</Text>
            <Text style={styles.label}>Nome ou identificação</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: Mesa 04 ou João"
              placeholderTextColor="#9CA3AF"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={criarComanda}
            />

            <TouchableOpacity
              style={[
                styles.botaoCriar,
                criando && styles.botaoDesativado,
              ]}
              onPress={criarComanda}
              disabled={criando}
            >
              <Text style={styles.botaoCriarTexto}>
                {criando ? "Criando..." : "Criar comanda"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.resumo}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>{abertas.length}</Text>
            <Text style={styles.resumoLegenda}>Abertas</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>{encerradas.length}</Text>
            <Text style={styles.resumoLegenda}>Outras</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>{comandas.length}</Text>
            <Text style={styles.resumoLegenda}>Total</Text>
          </View>
        </View>

        <Text style={styles.secaoTitulo}>Todas as comandas</Text>

        {carregando ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.carregandoTexto}>
              Carregando comandas...
            </Text>
          </View>
        ) : (
          <FlatList
            data={comandas}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderComanda}
            contentContainerStyle={
              comandas.length === 0
                ? styles.listaVazia
                : styles.lista
            }
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={atualizarLista}
                tintColor="#2563EB"
              />
            }
            ListEmptyComponent={
              <View style={styles.vazio}>
                <Text style={styles.vazioIcone}>▤</Text>
                <Text style={styles.vazioTitulo}>
                  Nenhuma comanda ainda
                </Text>
                <Text style={styles.vazioTexto}>
                  Crie uma comanda para começar a registrar pedidos.
                </Text>
                <TouchableOpacity
                  style={styles.vazioBotao}
                  onPress={() => setMostrarFormulario(true)}
                >
                  <Text style={styles.vazioBotaoTexto}>
                    + Criar primeira comanda
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tela: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 18,
    paddingTop: 20,
  },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitulo: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 4,
  },
  botaoAdicionar: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  botaoAdicionarTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  formulario: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 18,
  },
  formTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 7,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 9,
    paddingHorizontal: 12,
    color: "#111827",
    backgroundColor: "#FFFFFF",
    fontSize: 15,
  },
  botaoCriar: {
    height: 48,
    backgroundColor: "#2563EB",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  botaoCriarTexto: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  resumo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
  },
  resumoItem: {
    flex: 1,
    alignItems: "center",
  },
  resumoNumero: {
    color: "#111827",
    fontWeight: "bold",
    fontSize: 22,
  },
  resumoLegenda: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 3,
  },
  resumoDivisor: {
    height: 32,
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  secaoTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  lista: {
    paddingBottom: 30,
    gap: 12,
  },
  listaVazia: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTopo: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconeComanda: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconeTexto: {
    color: "#2563EB",
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nomeComanda: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "bold",
  },
  idComanda: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 3,
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusAberta: {
    backgroundColor: "#DCFCE7",
  },
  statusFechada: {
    backgroundColor: "#F3F4F6",
  },
  statusTexto: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  statusTextoAberta: {
    color: "#15803D",
  },
  statusTextoFechada: {
    color: "#6B7280",
  },
  cardRodape: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 14,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  funcionario: {
    color: "#6B7280",
    fontSize: 12,
    flex: 1,
  },
  abrirTexto: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 12,
  },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  carregandoTexto: {
    marginTop: 10,
    color: "#6B7280",
  },
  vazio: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  vazioIcone: {
    fontSize: 42,
    color: "#94A3B8",
    marginBottom: 12,
  },
  vazioTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
  },
  vazioTexto: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    marginTop: 7,
    lineHeight: 21,
  },
  vazioBotao: {
    backgroundColor: "#2563EB",
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 18,
  },
  vazioBotaoTexto: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});