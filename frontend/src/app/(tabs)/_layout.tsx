import { Redirect, Tabs } from "expo-router";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { carregarPerfil, PerfilContext, type Perfil } from "@/services/permissoes";

export default function TabsLayout() {
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregarPerfil().then((dados) => {
      if (ativo) setPerfil(dados);
    }).catch((e) => {
      if (!ativo) return;
      if (isAxiosError(e) && e.response?.status === 401) setPerfil(null);
      else setErro(true);
    });
    return () => { ativo = false; };
  }, [tentativa]);

  if (erro) return <View><Text>Não foi possível verificar a sessão.</Text><Button title="Tentar novamente" onPress={() => { setErro(false); setTentativa(t => t + 1); }} /></View>;
  if (perfil === undefined) return <ActivityIndicator accessibilityLabel="Verificando sessão" />;
  if (perfil === null) return <Redirect href="/(auth)/login" />;
  return (
    <PerfilContext.Provider value={perfil}>
      <Tabs>
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="produtos" options={{ title: "Produtos" }} />
        <Tabs.Screen name="comandas" options={{ title: "Comandas" }} />
        <Tabs.Screen name="vendas" options={{ title: "Vendas" }} />
        <Tabs.Screen name="historico" options={{ title: "Histórico" }} />
        <Tabs.Protected guard={perfil.cargo === "funcionario"}>
          <Tabs.Screen name="minha-comanda" options={{ title: "Minha comanda" }} />
        </Tabs.Protected>
        <Tabs.Protected guard={perfil.cargo === "admin"}>
          <Tabs.Screen name="funcionarios" options={{ title: "Funcionários" }} />
        </Tabs.Protected>
      </Tabs>
    </PerfilContext.Provider>
  );
}
