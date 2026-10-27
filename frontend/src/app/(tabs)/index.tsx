
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function HomeScreen() {
  const [destino, setDestino] = useState<"/(auth)/login" | "/(tabs)" | null>(
    null
  );

  useEffect(() => {
    async function verificarAutenticacao() {
      try {
        const token = await SecureStore.getItemAsync("token");

        setDestino(token ? "/(tabs)" : "/(auth)/login");
      } catch {
        setDestino("/(auth)/login");
      }
    }

    verificarAutenticacao();
  }, []);

  if (destino === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={destino} />;
}
