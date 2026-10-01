import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
        }}
      />

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
        name="novo-produto"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
      name="comandas/[id]"
      options={{
        href: null,
      }}
      />
    </Tabs>
  );
}