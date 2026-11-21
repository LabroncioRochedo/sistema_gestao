import { createContext } from "react";
import * as SecureStore from "expo-secure-store";
import api from "@/services/api";

export type Perfil = { id: number; nome: string; cargo: string };
export const PerfilContext = createContext<Perfil | null>(null);

export async function cabecalhoSessao() {
  const token = await SecureStore.getItemAsync("token");
  if (!token) throw new Error("Sessão não encontrada.");
  return { Authorization: `Bearer ${token}` };
}

export async function carregarPerfil(): Promise<Perfil | null> {
  const token = await SecureStore.getItemAsync("token");
  if (!token) return null;
  const { data } = await api.get<Perfil>("/usuarios/me", { headers: { Authorization: `Bearer ${token}` } });
  return data;
}
