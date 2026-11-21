import { useContext } from "react";
import { ScrollView } from "react-native";
import { PerfilContext } from "@/services/permissoes";
import ContaFuncionario from "@/components/conta-funcionario";

export default function MinhaComanda() {
  const perfil = useContext(PerfilContext);
  if (perfil?.cargo !== "funcionario") return null;
  return <ScrollView contentContainerStyle={{ padding: 16 }}>
    <ContaFuncionario key={perfil.id} funcionarioId={perfil.id} />
  </ScrollView>;
}
