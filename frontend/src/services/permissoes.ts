import * as SecureStore from "expo-secure-store";
import api from "@/services/api";

// SUBSTITUA pelo caminho da rota que você vai disponibilizar.
// Exemplo: "/auth/verificar-admin"
export const ROTA_VERIFICACAO_ADMIN =
  "/usuarios/funcionarios";

export async function verificarAdministrador(): Promise<boolean> {
  const token = await SecureStore.getItemAsync("token");

  if (!token) {
    return false;
  }

  try {
    const resposta = await api.get(ROTA_VERIFICACAO_ADMIN, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return resposta.status === 200;
  } catch {
    return false;
  }
}