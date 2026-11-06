import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";

import { useColorScheme } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={
        colorScheme === "dark"
          ? DarkTheme
          : DefaultTheme
      }
    >
      <Stack>
        <Stack.Screen
          name="(auth)/login"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="novo_produto"
          options={{
            title: "Novo produto",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="comandas/[id]"
          options={{
            title: "Comanda",
            headerShown: true,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}