import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { verificarAdministrador } from "@/services/permissoes";

export default function TabsLayout() {
  const [ehAdmin, setEhAdmin] = useState(false);

  useEffect(() => {
    async function verificarAcesso() {
      const administrador = await verificarAdministrador();
      setEhAdmin(administrador);
    }

    verificarAcesso();
  }, []);

  return (
    <Tabs>
      <Tabs.Screen
        name="produtos"
        options={{
          title: "Produtos",
        }}
      />

      <Tabs.Screen
        name="comandas"
        options={{
          title: "Comandas",
        }}
      />

      <Tabs.Screen
        name="vendas"
        options={{
          title: "Vendas",
        }}
      />

      <Tabs.Screen
        name="funcionarios"
        options={{
          title: "Funcionários",
          href: ehAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}