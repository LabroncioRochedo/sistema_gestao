import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  Pressable,
} from "react-native";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

export default function Index() {
  const [destino, setDestino] = useState<
    "/(auth)/login" | "/(tabs)" | null
  >(null);

  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    async function verificarAutenticacao() {
      try {
        const token = await SecureStore.getItemAsync("token");

        if (!token) {
          setDestino("/(auth)/login");
          return;
        }

        await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/produtos`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDestino("/(tabs)");
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          await SecureStore.deleteItemAsync("token");
          setDestino("/(auth)/login");
        } else {
          setErro(true);
        }
      }
    }

    verificarAutenticacao();
  }, [tentativa]);

  if (destino) {
    return <Redirect href={destino} />;
  }

  if (erro) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text>Não foi possível verificar sua autenticação.</Text>

        <Pressable onPress={() => {
          setErro(false);
          setTentativa((atual) => atual + 1);
        }}>
          <Text style={{ marginTop: 15, color: "blue" }}>
            Tentar novamente
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}