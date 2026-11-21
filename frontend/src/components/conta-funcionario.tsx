import { useFocusEffect } from "expo-router";
import { isAxiosError } from "axios";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Button, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import api from "@/services/api";
import { cabecalhoSessao } from "@/services/permissoes";

type Item = { id: number; nome: string; quantidade: number; preco_unitario: string; anotado_por: string };
type Conta = { funcionario_id: number; total: string; itens: Item[] };
type Produto = { id: number; nome: string; preco: number; quantidade: number };
const reais = (valor: number | string) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function mensagem(e: unknown) {
  const detalhe = isAxiosError(e) && e.response?.data?.detail;
  return typeof detalhe === "string" ? detalhe : "Não foi possível concluir a operação.";
}

export default function ContaFuncionario({ funcionarioId, administrador = false }: { funcionarioId: number; administrador?: boolean }) {
  const caminho = `/comandas-funcionarios/${funcionarioId}`;
  const [conta, setConta] = useState<Conta | null>(null);
  const [catalogo, setCatalogo] = useState<Produto[]>([]);
  const [outro, setOutro] = useState(false);
  const [nome, setNome] = useState("");
  const [busca, setBusca] = useState("");
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [confirmacao, setConfirmacao] = useState<Conta | null>(null);
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const emCurso = useRef(false);

  const carregar = useCallback(async (signal?: AbortSignal) => {
    try {
      const config = { headers: await cabecalhoSessao(), signal };
      const [dados, produtos] = await Promise.all([
        api.get<Conta>(caminho, config), api.get<Produto[]>("/produtos", config),
      ]);
      if (!signal?.aborted) {
        setConta(dados.data);
        setCatalogo(produtos.data);
        setErro("");
      }
    } catch (e) {
      if (!signal?.aborted) setErro(mensagem(e));
    }
  }, [caminho]);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    void carregar(controller.signal);
    return () => controller.abort();
  }, [carregar]));

  const itens = Object.entries(quantidades)
    .filter(([, qtd]) => qtd > 0)
    .map(([id, qtd]) => ({ produto_id: Number(id), quantidade: qtd }));

  function ajustar(p: Produto, delta: number) {
    setQuantidades(atuais => ({
      ...atuais,
      [p.id]: Math.max(0, Math.min(p.quantidade, (atuais[p.id] ?? 0) + delta)),
    }));
  }

  async function executar(acao: (config: { headers: { Authorization: string } }) => Promise<void>) {
    if (emCurso.current) return;
    emCurso.current = true;
    setOcupado(true);
    setErro("");
    try {
      await acao({ headers: await cabecalhoSessao() });
      await carregar();
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 409) await carregar();
      setErro(mensagem(e));
    } finally {
      emCurso.current = false;
      setOcupado(false);
    }
  }

  function anotar() {
    const qtd = Number(quantidade);
    const valor = preco.trim().replace(",", ".");
    if (outro) {
      if (!/^\d+$/.test(quantidade) || qtd < 1 || qtd > 2147483647) return setErro("Informe uma quantidade inteira positiva.");
      if (!nome.trim() || !/^\d{1,8}(\.\d{1,2})?$/.test(valor) || Number(valor) <= 0)
        return setErro("Informe a descrição e um preço válido, com até duas casas decimais.");
    } else if (!itens.length) return setErro("Selecione pelo menos um produto.");
    void executar(async config => {
      if (outro) {
        await api.post(`${caminho}/outros`, { nome: nome.trim(), preco_unitario: valor, quantidade: qtd }, config);
        setNome(""); setPreco(""); setQuantidade("1");
      } else {
        await api.post(`${caminho}/produtos`, { itens }, config);
        setQuantidades({}); setBusca("");
      }
    });
  }

  function encerrar(resumo: Conta) {
    setConfirmacao(null);
    void executar(async config => {
      await api.post(`${caminho}/encerrar`, { itens_ids: resumo.itens.map(i => i.id) }, config);
      setConta({ ...resumo, itens: [], total: "0.00" });
      setQuantidades({});
    });
  }

  if (!conta) return erro ? <View><Text>{erro}</Text><Button title="Tentar novamente" onPress={() => carregar()} /></View> : <ActivityIndicator />;
  const opcoes = catalogo.filter(p => p.nome.toLowerCase().includes(busca.trim().toLowerCase()));
  return <View style={styles.painel}>
    <Text style={styles.titulo}>Total da comanda · {reais(conta.total)}</Text>
    {conta.itens.length === 0 && <Text>Nenhum item anotado.</Text>}
    {conta.itens.map(item => <View style={styles.linha} key={item.id}>
      <Text style={styles.forte}>{item.quantidade} × {item.nome} · {reais(item.preco_unitario)} por unidade</Text>
      <Text>Anotado por {item.anotado_por}</Text>
      {administrador && <Button title="Remover item" color="#A62727" disabled={ocupado} onPress={() => executar(async config => { await api.delete(`${caminho}/itens/${item.id}`, config); })} />}
    </View>)}
    {administrador && conta.itens.length > 0 && (confirmacao ? <View style={styles.linha}>
      <Text style={styles.forte}>Encerrar esta comanda por {reais(confirmacao.total)}?</Text>
      <Text>Os itens serão considerados vendidos e a comanda ficará zerada.</Text>
      <Button title="Confirmar encerramento" disabled={ocupado} onPress={() => encerrar(confirmacao)} />
      <Button title="Cancelar" onPress={() => setConfirmacao(null)} />
    </View> : <Button title="Encerrar comanda" disabled={ocupado} onPress={() => setConfirmacao(conta)} />)}
    <Text style={styles.titulo}>Anotar item</Text>
    <View style={styles.modos}>{[false, true].map(avulso => <Pressable key={String(avulso)} accessibilityRole="button" accessibilityState={{ selected: outro === avulso }}
      onPress={() => { setOutro(avulso); setErro(""); }}
      style={[styles.modo, outro === avulso && styles.ativo]}><Text>{avulso ? "Outros" : "Produto"}</Text></Pressable>)}</View>
    <Text>{outro ? "Descrição" : "Buscar produto"}</Text>
    <TextInput style={styles.input} editable={!ocupado} value={outro ? nome : busca} onChangeText={outro ? setNome : setBusca} maxLength={250} />
    {!outro && opcoes.map(p => {
      const qtd = quantidades[p.id] ?? 0;
      return <View key={p.id} style={styles.produto}>
        <View style={{ flex: 1 }}>
          <Text style={styles.forte}>{p.nome}</Text>
          <Text>{reais(p.preco)} · Estoque: {p.quantidade}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Diminuir ${p.nome}`} disabled={ocupado || !qtd} onPress={() => ajustar(p, -1)} style={styles.seta}><Text>−</Text></Pressable>
        <Text>{qtd}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar ${p.nome}`} disabled={ocupado || qtd >= p.quantidade} onPress={() => ajustar(p, 1)} style={styles.seta}><Text>+</Text></Pressable>
      </View>;
    })}
    {!outro && !opcoes.length && <Text>Nenhum produto encontrado.</Text>}
    {outro && <>
      <Text>Preço unitário (R$)</Text><TextInput keyboardType="decimal-pad" style={styles.input} value={preco} onChangeText={setPreco} />
      <Text>Quantidade</Text><TextInput keyboardType="number-pad" style={styles.input} value={quantidade} onChangeText={setQuantidade} />
    </>}
    {!!erro && <Text accessibilityRole="alert" style={styles.erro}>{erro}</Text>}
    <Button title={ocupado ? "Salvando…" : outro ? "Anotar na comanda" : `Enviar seleção (${itens.length})`} disabled={ocupado || (!outro && !itens.length)} onPress={anotar} />
  </View>;
}

const styles = StyleSheet.create({
  produto: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 5 },
  seta: { padding: 12, backgroundColor: "#EFF6FF", borderRadius: 8 },
  painel: { gap: 10, padding: 14, borderRadius: 12, backgroundColor: "#fff" },
  titulo: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  forte: { fontWeight: "600" },
  linha: { gap: 4, paddingVertical: 8, borderBottomWidth: 1, borderColor: "#E2E8F0" },
  modos: { flexDirection: "row", gap: 8 },
  modo: { padding: 10, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8 },
  ativo: { backgroundColor: "#DBEAFE", borderColor: "#2563EB" },
  input: { padding: 10, borderColor: "#94A3B8", borderWidth: 1, borderRadius: 8, color: "#111827" },
  erro: { color: "#991B1B" },
});
