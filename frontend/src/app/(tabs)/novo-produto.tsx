
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/services/api";
import * as SecureStore from "expo-secure-store";

const schema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do produto"),
  preco: z.string().min(1, "Informe o preço"),
  data_de_validade: z.string().min(1, "Informe a validade"),
});

type FormData = z.infer<typeof schema>;
type ModoEstoque = "unidades" | "caixas";

export default function NovoProduto() {
  const router = useRouter();

  const [modo, setModo] = useState<ModoEstoque>("unidades");
  const [quantidade, setQuantidade] = useState("");
  const [caixas, setCaixas] = useState("");
  const [unidadesPorCaixa, setUnidadesPorCaixa] = useState("");
  const [carregando, setCarregando] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      preco: "",
      data_de_validade: "",
    },
  });

  const totalCaixas =
    (Number(caixas) || 0) * (Number(unidadesPorCaixa) || 0);

  const quantidadeTotal =
    modo === "caixas" ? totalCaixas : Number(quantidade) || 0;

  function converterPreco(valor: string) {
    return Number(valor.replace(",", "."));
  }

  async function cadastrarProduto(dados: FormData) {
    if (!Number.isFinite(converterPreco(dados.preco)) ||
        converterPreco(dados.preco) < 0) {
      Alert.alert("Preço inválido", "Informe um preço válido.");
      return;
    }

    if (!Number.isInteger(quantidadeTotal) || quantidadeTotal < 0) {
      Alert.alert("Estoque inválido", "Informe uma quantidade válida.");
      return;
    }

    if (modo === "caixas" &&
        (!caixas || !unidadesPorCaixa ||
         Number(caixas) < 1 || Number(unidadesPorCaixa) < 1)) {
      Alert.alert(
        "Estoque incompleto",
        "Informe a quantidade de caixas e unidades por caixa."
      );
      return;
    }

    if (modo === "unidades" && !quantidade) {
      Alert.alert("Estoque incompleto", "Informe a quantidade de unidades.");
      return;
    }

    setCarregando(true);

    const token = await SecureStore.getItemAsync("token");

    try {
      await api.post("/produtos", {
        nome: dados.nome.trim(),
        preco: converterPreco(dados.preco),
        quantidade: quantidadeTotal,
        data_de_validade: dados.data_de_validade,
      }, { headers: { Authorization: `Bearer ${token}`, }, });

      Alert.alert("Sucesso", "Produto cadastrado!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (erro: any) {
      const mensagem =
        erro?.response?.data?.detail ??
        "Não foi possível cadastrar o produto.";

      Alert.alert("Erro", String(mensagem));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>Adicionar produto</Text>
        <Text style={styles.subtitulo}>
          Preencha os dados e informe como deseja lançar o estoque.
        </Text>

        <Text style={styles.label}>Nome do produto</Text>
        <Controller
          control={control}
          name="nome"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Ex.: Refrigerante 2L"
              placeholderTextColor="#8A8A8A"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.nome && (
          <Text style={styles.erro}>{errors.nome.message}</Text>
        )}

        <Text style={styles.label}>Preço por unidade (R$)</Text>
        <Controller
          control={control}
          name="preco"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Ex.: 9,50"
              placeholderTextColor="#8A8A8A"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.preco && (
          <Text style={styles.erro}>{errors.preco.message}</Text>
        )}

        <Text style={styles.label}>Data de validade</Text>
        <Controller
          control={control}
          name="data_de_validade"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#8A8A8A"
              value={value}
              onChangeText={onChange}
              maxLength={10}
            />
          )}
        />
        {errors.data_de_validade && (
          <Text style={styles.erro}>
            {errors.data_de_validade.message}
          </Text>
        )}
        <Text style={styles.dica}>Exemplo: 2027-10-15</Text>

        <Text style={styles.label}>Como deseja informar o estoque?</Text>
        <View style={styles.opcoes}>
          <TouchableOpacity
            style={[
              styles.opcao,
              modo === "unidades" && styles.opcaoAtiva,
            ]}
            onPress={() => setModo("unidades")}
          >
            <Text
              style={[
                styles.opcaoTexto,
                modo === "unidades" && styles.opcaoTextoAtivo,
              ]}
            >
              Por unidades
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.opcao,
              modo === "caixas" && styles.opcaoAtiva,
            ]}
            onPress={() => setModo("caixas")}
          >
            <Text
              style={[
                styles.opcaoTexto,
                modo === "caixas" && styles.opcaoTextoAtivo,
              ]}
            >
              Por caixas
            </Text>
          </TouchableOpacity>
        </View>

        {modo === "unidades" ? (
          <>
            <Text style={styles.label}>Quantidade de unidades</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: 60"
              placeholderTextColor="#8A8A8A"
              keyboardType="number-pad"
              value={quantidade}
              onChangeText={setQuantidade}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Quantidade de caixas</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: 5"
              placeholderTextColor="#8A8A8A"
              keyboardType="number-pad"
              value={caixas}
              onChangeText={setCaixas}
            />

            <Text style={styles.label}>Unidades por caixa</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex.: 12"
              placeholderTextColor="#8A8A8A"
              keyboardType="number-pad"
              value={unidadesPorCaixa}
              onChangeText={setUnidadesPorCaixa}
            />

            <View style={styles.calculo}>
              <Text style={styles.calculoTitulo}>Total calculado</Text>
              <Text style={styles.calculoNumero}>
                {Number(caixas) || 0} × {Number(unidadesPorCaixa) || 0}
                {" = "}
                {totalCaixas} unidades
              </Text>
            </View>
          </>
        )}

        <View style={styles.resumo}>
          <Text style={styles.resumoLabel}>Quantidade que será enviada</Text>
          <Text style={styles.resumoValor}>
            {quantidadeTotal} unidades
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.botao,
            carregando && styles.botaoDesativado,
          ]}
          onPress={handleSubmit(cadastrarProduto)}
          disabled={carregando}
        >
          <Text style={styles.botaoTexto}>
            {carregando ? "Cadastrando..." : "Cadastrar produto"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  voltar: {
    color: "#2563EB",
    fontSize: 16,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitulo: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  erro: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 5,
  },
  dica: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },
  opcoes: {
    flexDirection: "row",
    gap: 10,
  },
  opcao: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  opcaoAtiva: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  opcaoTexto: {
    color: "#4B5563",
    fontWeight: "600",
  },
  opcaoTextoAtivo: {
    color: "#2563EB",
  },
  calculo: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  calculoTitulo: {
    color: "#1E40AF",
    fontWeight: "600",
    fontSize: 13,
  },
  calculoNumero: {
    color: "#1D4ED8",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  resumo: {
    marginTop: 20,
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  resumoLabel: {
    color: "#6B7280",
    fontSize: 13,
  },
  resumoValor: {
    color: "#111827",
    fontWeight: "bold",
    fontSize: 22,
    marginTop: 5,
  },
  botao: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});