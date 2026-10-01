
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api from "@/services/api";

const loginSchema = z.object({
  nome: z.string().trim().min(3, "Digite seu usuário."),
  senha: z.string().min(1, "Digite sua senha."),
});

type LoginForm = z.infer<typeof loginSchema>;

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export default function LoginScreen() {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroApi, setErroApi] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nome: "",
      senha: "",
    },
  });

  async function entrar(dados: LoginForm) {
    setErroApi("");

    try {
      const resposta = await api.post<LoginResponse>(
        "/auth/login",
        {
          nome: dados.nome,
          senha: dados.senha,
        }
      );

      await SecureStore.setItemAsync(
        "token",
        resposta.data.access_token
      );

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Erro no login:", error);

      if (error.response?.status === 401) {
        setErroApi("Usuário ou senha incorretos.");
      } else if (error.response) {
        setErroApi("Não foi possível entrar. Tente novamente.");
      } else {
        setErroApi(
          "Não foi possível conectar ao servidor."
        );
      }
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.logoArea}>
              <View style={styles.logo}>
                <Ionicons
                  name="layers"
                  size={34}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.appName}>Gestão</Text>
              <Text style={styles.tagline}>
                Controle seu negócio em um só lugar
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>
                Bem-vindo de volta!
              </Text>

              <Text style={styles.description}>
                Entre com seus dados para continuar.
              </Text>

              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>
                    Usuário
                  </Text>

                  <View
                    style={[
                      styles.inputContainer,
                      errors.nome && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color="#94A3B8"
                    />

                    <Controller
                      control={control}
                      name="nome"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder="Digite seu usuário"
                          placeholderTextColor="#94A3B8"
                          value={value}
                          onChangeText={onChange}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          editable={!isSubmitting}
                        />
                      )}
                    />
                  </View>

                  {errors.nome && (
                    <Text style={styles.errorText}>
                      {errors.nome.message}
                    </Text>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Senha
                  </Text>

                  <View
                    style={[
                      styles.inputContainer,
                      errors.senha && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#94A3B8"
                    />

                    <Controller
                      control={control}
                      name="senha"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder="Digite sua senha"
                          placeholderTextColor="#94A3B8"
                          value={value}
                          onChangeText={onChange}
                          secureTextEntry={!mostrarSenha}
                          autoCapitalize="none"
                          returnKeyType="done"
                          onSubmitEditing={handleSubmit(entrar)}
                          editable={!isSubmitting}
                        />
                      )}
                    />

                    <TouchableOpacity
                      onPress={() =>
                        setMostrarSenha((atual) => !atual)
                      }
                      accessibilityLabel={
                        mostrarSenha
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      <Ionicons
                        name={
                          mostrarSenha
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={21}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>

                  {errors.senha && (
                    <Text style={styles.errorText}>
                      {errors.senha.message}
                    </Text>
                  )}
                </View>

                {erroApi !== "" && (
                  <View style={styles.errorBox}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={19}
                      color="#DC2626"
                    />
                    <Text style={styles.errorBoxText}>
                      {erroApi}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.button,
                    isSubmitting && styles.buttonDisabled,
                  ]}
                  onPress={handleSubmit(entrar)}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Entrar
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.security}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color="#64748B"
                />
                <Text style={styles.securityText}>
                  Acesso seguro ao sistema
                </Text>
              </View>
            </View>

            <Text style={styles.footer}>
              Sistema de Gestão • 2026
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  appName: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
  },
  tagline: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  title: {
    color: "#0F172A",
    fontSize: 23,
    fontWeight: "bold",
  },
  description: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 7,
    marginBottom: 26,
  },
  form: {
    gap: 19,
  },
  field: {
    gap: 8,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#0F172A",
    fontSize: 15,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorBoxText: {
    color: "#B91C1C",
    fontSize: 13,
    flex: 1,
  },
  button: {
    height: 52,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  security: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 22,
  },
  securityText: {
    color: "#64748B",
    fontSize: 12,
  },
  footer: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 24,
  },
});