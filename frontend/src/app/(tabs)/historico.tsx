import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import api from "@/services/api";

type Anotacao = {
  id: number;
  operacao: "entrada" | "saida";
  nome_produto: string;
  quantidade: number;
  preco_unitario: string;
  usuario_nome: string;
  comentario: string | null;
  data_movimentacao: string;
};

type ComandaEncerrada = {
  comanda_id: number;
  numero: number;
  nome: string;
  status: "paga" | "excluida";
  data_encerramento: string;
  anotacoes: Anotacao[];
};

const porPagina = 20;
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const data = (valor: string) => new Date(valor).toLocaleString("pt-BR");

function Movimentos({ tipo, anotacoes }: { tipo: Anotacao["operacao"]; anotacoes: Anotacao[] }) {
  const linhas = anotacoes.filter((item) => item.operacao === tipo);
  return (
    <View style={styles.grupo}>
      <Text style={styles.tituloGrupo}>{tipo === "entrada" ? "Entradas" : "Saídas"} ({linhas.length})</Text>
      {linhas.length === 0 && <Text style={styles.detalhe}>Nenhuma {tipo === "entrada" ? "entrada" : "saída"} registrada.</Text>}
      {linhas.map((item) => (
        <View key={item.id} style={styles.linha}>
          <Text style={styles.produto}>{item.quantidade} × {item.nome_produto}</Text>
          <Text style={styles.detalhe}>{moeda.format(Number(item.preco_unitario))} por unidade</Text>
          {item.comentario ? <Text style={styles.comentario}>{item.comentario}</Text> : null}
          <Text style={styles.detalhe}>{item.usuario_nome} · {data(item.data_movimentacao)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function HistoricoScreen() {
  const [comandas, setComandas] = useState<ComandaEncerrada[]>([]);
  const [aberta, setAberta] = useState<number | null>(null);
  const [consulta, setConsulta] = useState({ pagina: 0 });
  const { pagina } = consulta;
  const [temProxima, setTemProxima] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    async function carregar() {
      setCarregando(true);
      setErro(false);
      try {
        const token = await SecureStore.getItemAsync("token");
        const resposta = await api.get<ComandaEncerrada[]>("/comandas/historico", {
          headers: { Authorization: `Bearer ${token}` },
          params: { inicio: consulta.pagina * porPagina, limite: porPagina + 1 },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setComandas(resposta.data.slice(0, porPagina));
          setTemProxima(resposta.data.length > porPagina);
        }
      } catch {
        if (!controller.signal.aborted) setErro(true);
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }
    void carregar();
    return () => controller.abort();
  }, [consulta]));

  return (
    <View style={styles.tela}>
      <Text style={styles.titulo}>Histórico de comandas</Text>
      {carregando ? <ActivityIndicator color="#2563EB" /> : erro ? (
        <View style={styles.grupo}>
          <Text>Não foi possível carregar o histórico.</Text>
          <Pressable onPress={() => setConsulta({ pagina })}><Text style={styles.link}>Tentar novamente</Text></Pressable>
        </View>
      ) : (
        <FlatList
          key={pagina}
          data={comandas}
          keyExtractor={(item) => String(item.comanda_id)}
          ListEmptyComponent={<Text style={styles.detalhe}>Nenhuma comanda encerrada.</Text>}
          renderItem={({ item }) => {
            const expandida = aberta === item.comanda_id;
            return (
              <View style={styles.cartao}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: expandida }}
                  onPress={() => setAberta(expandida ? null : item.comanda_id)}>
                  <View style={styles.topo}>
                    <Text style={styles.nome}>#{item.numero} · {item.nome}</Text>
                    <Text style={item.status === "paga" ? styles.paga : styles.excluida}>
                      {item.status === "paga" ? "Paga" : "Excluída"}
                    </Text>
                  </View>
                  <Text style={styles.detalhe}>{data(item.data_encerramento)}</Text>
                  <Text style={styles.link}>{expandida ? "Ocultar anotações" : "Ver anotações"}</Text>
                </Pressable>
                {expandida && <>
                  <Movimentos tipo="entrada" anotacoes={item.anotacoes} />
                  <Movimentos tipo="saida" anotacoes={item.anotacoes} />
                </>}
              </View>
            );
          }}
          ListFooterComponent={
            <View style={styles.paginacao}>
              {pagina > 0 && <Pressable onPress={() => setConsulta({ pagina: pagina - 1 })}><Text style={styles.link}>Anterior</Text></Pressable>}
              {temProxima && <Pressable onPress={() => setConsulta({ pagina: pagina + 1 })}><Text style={styles.link}>Próxima</Text></Pressable>}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, padding: 18, backgroundColor: "#F8FAFC" },
  titulo: { fontSize: 26, fontWeight: "bold", color: "#111827", marginBottom: 20 },
  cartao: { backgroundColor: "#FFF", padding: 16, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  topo: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  nome: { flex: 1, fontWeight: "700", fontSize: 17, color: "#111827" },
  paga: { color: "#166534", fontWeight: "700" },
  excluida: { color: "#991B1B", fontWeight: "700" },
  link: { color: "#1D4ED8", paddingVertical: 9, fontWeight: "600" },
  grupo: { marginTop: 10, gap: 4 },
  tituloGrupo: { color: "#1F2937", fontSize: 16, fontWeight: "700" },
  linha: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#CBD5E1", paddingVertical: 8, gap: 3 },
  produto: { fontWeight: "600", color: "#111827" },
  detalhe: { color: "#475569", fontSize: 13 },
  comentario: { color: "#334155" },
  paginacao: { flexDirection: "row", justifyContent: "space-around" },
});
