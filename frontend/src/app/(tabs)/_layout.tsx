import { Tabs } from "expo-router";

export default function TabsLayout() {
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
    </Tabs>
  );
}