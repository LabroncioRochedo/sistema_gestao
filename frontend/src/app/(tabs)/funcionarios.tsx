import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "@/services/api";
import { verificarAdministrador } from "@/services/permissoes";

type Funcionario = {
  id: number;
  nome: string;
  cargo: string;
};

export default function FuncionariosScreen() {
  const router = useRouter();

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [cadastrando, setCadastrando] = useState(false);

  const carregarFuncionarios = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const resposta = await api.get("/usuarios/funcionarios", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFuncionarios(resposta.data);
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro?.response?.data?.detail ??
          "Não foi possível carregar os funcionários."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function iniciar() {
        setCarregando(true);

        const administrador = await verificarAdministrador();

        if (!ativo) return;

        if (!administrador) {
          router.replace("/(tabs)/produtos");
          return;
        }

        await carregarFuncionarios();
      }

      iniciar();

      return () => {
        ativo = false;
      };
    }, [carregarFuncionarios, router])
  );

  async function excluirFuncionario(funcionario: Funcionario) {
    Alert.alert(
      "Excluir funcionário",
      `Deseja realmente excluir ${funcionario.nome}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync("token");

              if (!token) {
                router.replace("/(auth)/login");
                return;
              }

              await api.delete(`/usuarios/${funcionario.id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              setFuncionarios((anteriores) =>
                anteriores.filter((item) => item.id !== funcionario.id)
              );

              Alert.alert("Sucesso", "Funcionário excluído.");
            } catch (erro: any) {
              Alert.alert(
                "Erro",
                erro?.response?.data?.detail ??
                  "Não foi possível excluir o funcionário."
              );
            }
          },
        },
      ]
    );
  }

  async function cadastrarFuncionario() {
    if (!nome.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Informe o nome e a senha.");
      return;
    }

    setCadastrando(true);

    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      await api.post(
        "/usuarios/",
        {
          nome: nome.trim(),
          senha: senha,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNome("");
      setSenha("");
      setModalVisivel(false);

      await carregarFuncionarios();

      Alert.alert("Sucesso", "Funcionário cadastrado!");
    } catch (erro: any) {
      Alert.alert(
        "Erro",
        erro?.response?.data?.detail ??
          "Não foi possível cadastrar o funcionário."
      );
    } finally {
      setCadastrando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.textoCarregando}>
          Carregando funcionários...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregarFuncionarios();
            }}
          />
        }
      >
        <Text style={styles.titulo}>Funcionários</Text>

        <Text style={styles.subtitulo}>
          Gerencie os funcionários cadastrados no sistema.
        </Text>

        {funcionarios.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioTexto}>
              Nenhum funcionário cadastrado.
            </Text>
          </View>
        ) : (
          funcionarios.map((funcionario) => (
            <View key={funcionario.id} style={styles.card}>
              <View style={styles.cardCabecalho}>
                <View style={styles.identificacao}>
                  <Text style={styles.nomeFuncionario}>
                    {funcionario.nome}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => excluirFuncionario(funcionario)}
                >
                  <Text style={styles.botaoExcluirTexto}>X</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.separador} />

              <Text style={styles.label}>Cargo</Text>
              <Text style={styles.valor}>{funcionario.cargo}</Text>

              <View style={styles.separador} />

              <Text style={styles.label}>Pedidos anotados hoje</Text>

              <View style={styles.pedidos}>
                <Text style={styles.pedidosTexto}>
                  Informações disponíveis em breve.
                </Text>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.botaoNovo}
          onPress={() => setModalVisivel(true)}
        >
          <Text style={styles.botaoNovoTexto}>
            + Novo funcionário
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalFundo}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>
              Cadastrar funcionário
            </Text>

            <Text style={styles.label}>Nome</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome do funcionário"
              placeholderTextColor="#888"
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Senha</Text>

            <TextInput
              style={styles.input}
              placeholder="Senha de acesso"
              placeholderTextColor="#888"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />

            <TouchableOpacity
              style={[
                styles.botaoCadastrar,
                cadastrando && styles.botaoDesativado,
              ]}
              onPress={cadastrarFuncionario}
              disabled={cadastrando}
            >
              <Text style={styles.botaoNovoTexto}>
                {cadastrando ? "Cadastrando..." : "Cadastrar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoCancelar}
              onPress={() => setModalVisivel(false)}
              disabled={cadastrando}
            >
              <Text style={styles.cancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F4F6FA",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  centralizado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6FA",
  },
  textoCarregando: {
    marginTop: 12,
    color: "#555",
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#172033",
  },
  subtitulo: {
    fontSize: 14,
    color: "#687386",
    marginTop: 6,
    marginBottom: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  cardCabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  identificacao: {
    flex: 1,
  },
  nomeFuncionario: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#172033",
  },
  idFuncionario: {
    fontSize: 12,
    color: "#7B8494",
    marginTop: 4,
  },
  botaoExcluir: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoExcluirTexto: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "bold",
  },
  separador: {
    height: 1,
    backgroundColor: "#E8EBF0",
    marginVertical: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#687386",
    marginBottom: 6,
  },
  valor: {
    fontSize: 15,
    color: "#172033",
  },
  pedidos: {
    backgroundColor: "#F4F6FA",
    borderRadius: 8,
    padding: 12,
  },
  pedidosTexto: {
    color: "#8992A2",
    fontSize: 13,
  },
  vazio: {
    padding: 25,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
  },
  vazioTexto: {
    color: "#687386",
  },
  botaoNovo: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  botaoNovoTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 22,
  },
  modalTitulo: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#172033",
    marginBottom: 22,
  },
  input: {
    backgroundColor: "#F4F6FA",
    borderWidth: 1,
    borderColor: "#DCE1E9",
    borderRadius: 9,
    padding: 13,
    fontSize: 15,
    color: "#172033",
    marginBottom: 16,
  },
  botaoCadastrar: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 8,
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  botaoCancelar: {
    padding: 13,
    alignItems: "center",
    marginTop: 5,
  },
  cancelarTexto: {
    color: "#687386",
    fontWeight: "600",
  },
});