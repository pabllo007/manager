import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Demanda, Desenvolvedor, DevWorkload, Sistema, Status } from '../types';
import { api } from '../api';

type Props = {
  demandas: Demanda[];
  desenvolvedores: Desenvolvedor[];
  workload: DevWorkload[];
  filtroSistema: Sistema | 'Todos';
  setFiltroSistema: (v: Sistema | 'Todos') => void;
  filtroStatus: Status | 'Todos';
  setFiltroStatus: (v: Status | 'Todos') => void;
  filtroDev: number | 'Todos';
  setFiltroDev: (v: number | 'Todos') => void;
  onRefresh: () => void;
  onEdit: (d: Demanda) => void;
  onOpenDemandFromWorkload: (id: number) => void;
  onDelete: (id: number) => void;
};

const sistemas: Sistema[] = ['Hemoglobinopatias', 'Coagulopatias', 'Ciclo de Sangue', 'GSM-NAT', 'Hemovida'];
const statusOptions: Status[] = ['NÃO INICIADO', 'EM ANDAMENTO', 'HOMOLOGAÇÃO', 'CONCLUÍDO'];

export function DashboardScreen(props: Props) {
  const [busca, setBusca] = useState('');
  const [hoveredDemandId, setHoveredDemandId] = useState<number | null>(null);
  const [menuDemandId, setMenuDemandId] = useState<number | null>(null);
  const [obsByDemanda, setObsByDemanda] = useState<Record<number, string[]>>({});
  const [loadingObsId, setLoadingObsId] = useState<number | null>(null);
  const [workloadDialog, setWorkloadDialog] = useState<{ demands: { id: number; demanda_readmine?: string | null; titulo: string }[] } | null>(null);
  const { width } = useWindowDimensions();

  const columns = width >= 1400 ? 4 : width >= 1000 ? 3 : width >= 680 ? 2 : 1;
  const cardWidth = Math.max(220, Math.floor((width - 80 - (columns - 1) * 12) / columns));

  const list = useMemo(
    () => props.demandas.filter((d) => [d.demanda_readmine || '', d.titulo, d.sistema, d.status, d.responsavel_nomes || ''].join(' ').toLowerCase().includes(busca.toLowerCase())),
    [busca, props.demandas],
  );

  function formatObsLine(createdAt: string, texto: string) {
    const date = new Date(createdAt);
    const dateText = Number.isNaN(date.getTime()) ? createdAt : date.toLocaleDateString('pt-BR');
    return `${dateText} - ${texto}`;
  }

  async function loadObsPreview(demandaId: number) {
    if (obsByDemanda[demandaId]) return;
    setLoadingObsId(demandaId);
    try {
      const observacoes = await api.getObservacoes(demandaId);
      setObsByDemanda((prev) => ({
        ...prev,
        [demandaId]: observacoes.map((o) => formatObsLine(o.created_at, o.texto)),
      }));
    } finally {
      setLoadingObsId((current) => (current === demandaId ? null : current));
    }
  }

  function openWorkloadDialog(demands: { id: number; demanda_readmine?: string | null; titulo: string }[]) {
    if (!demands.length) return;
    setWorkloadDialog({ demands });
  }

  function openDemandFromModal(demandId: number) {
    setWorkloadDialog(null);
    setTimeout(() => props.onOpenDemandFromWorkload(Number(demandId)), 0);
  }

  return (
    <>
      <TextInput style={styles.input} placeholder="Buscar" value={busca} onChangeText={setBusca} />
      <Text style={styles.label}>Filtros</Text>
      <ScrollView horizontal style={styles.row}><Chip label="Todos" ativo={props.filtroSistema === 'Todos'} onPress={() => props.setFiltroSistema('Todos')} />{sistemas.map((s) => <Chip key={s} label={s} ativo={props.filtroSistema === s} onPress={() => props.setFiltroSistema(s)} />)}</ScrollView>
      <ScrollView horizontal style={styles.row}><Chip label="Todos" ativo={props.filtroStatus === 'Todos'} onPress={() => props.setFiltroStatus('Todos')} />{statusOptions.map((s) => <Chip key={s} label={s} ativo={props.filtroStatus === s} onPress={() => props.setFiltroStatus(s)} />)}</ScrollView>
      <ScrollView horizontal style={styles.row}><Chip label="Todos" ativo={props.filtroDev === 'Todos'} onPress={() => props.setFiltroDev('Todos')} />{props.desenvolvedores.map((d) => <Chip key={d.id} label={d.nome.split(' ')[0] || d.nome} ativo={props.filtroDev === d.id} onPress={() => props.setFiltroDev(d.id)} />)}</ScrollView>
      <Pressable style={styles.btn} onPress={props.onRefresh}><Text style={styles.btnText}>Atualizar</Text></Pressable>

      <View style={styles.card}>
        <Text style={styles.title}>Demandas por desenvolvedor</Text>
        {props.workload.map((w) => (
          <View key={w.id} style={styles.workloadRow}>
            <View style={styles.workloadLine}>
              <Text style={styles.caption}>{w.nome}:</Text>
              <WorkloadCount count={w.total_demandas} demands={w.total_demandas_lista || []} onOpenDialog={openWorkloadDialog} />
              <Text style={styles.caption}> | Não iniciado:</Text>
              <WorkloadCount count={w.nao_iniciado} demands={w.nao_iniciado_lista || []} onOpenDialog={openWorkloadDialog} />
              <Text style={styles.caption}> | Em andamento:</Text>
              <WorkloadCount count={w.em_andamento} demands={w.em_andamento_lista || []} onOpenDialog={openWorkloadDialog} />
              <Text style={styles.caption}> | Homologação:</Text>
              <WorkloadCount count={w.homologacao} demands={w.homologacao_lista || []} onOpenDialog={openWorkloadDialog} />
              <Text style={styles.caption}> | Concluído:</Text>
              <WorkloadCount count={w.concluido} demands={w.concluido_lista || []} onOpenDialog={openWorkloadDialog} />
            </View>
          </View>
        ))}
      </View>

      <Modal transparent visible={!!workloadDialog} animationType="fade" onRequestClose={() => setWorkloadDialog(null)}>
        <Pressable style={styles.dialogOverlay} onPress={() => setWorkloadDialog(null)}>
          <Pressable style={styles.dialogBox} onPress={() => undefined}>
            <Pressable style={styles.dialogCloseBtn} onPress={() => setWorkloadDialog(null)}>
              <Text style={styles.dialogCloseText}>Fechar</Text>
            </Pressable>

            <ScrollView style={styles.dialogList}>
              {workloadDialog?.demands.length ? (
                workloadDialog.demands.map((d) => (
                  <Pressable key={d.id} style={styles.workloadPanelItemBtn} onPress={() => openDemandFromModal(Number(d.id))}>
                    <Text style={styles.workloadPanelItem}>{d.demanda_readmine || 'Sem código'} - {d.titulo}</Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.tooltipItem}>Sem demandas.</Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.card}>
        <Text style={styles.title}>Lista de demandas</Text>
        <View style={styles.grid}>
          {list.map((d) => (
            <View key={d.id} style={[styles.squareCard, { width: cardWidth }]}> 
              <View style={styles.cardHeader}>
                <Text style={styles.itemTitle}>{d.demanda_readmine || 'Sem código'} - {d.titulo}</Text>
                <Pressable style={styles.dotsBtn} onPress={() => setMenuDemandId(menuDemandId === d.id ? null : d.id)}>
                  <Text style={styles.dotsText}>⋯</Text>
                </Pressable>
              </View>
              <Text style={styles.caption}>Sistema: {d.sistema}</Text>
              <Text style={styles.caption}>Status: {d.status}</Text>
              <Text style={styles.caption}>Responsável: {d.responsavel_nomes || 'Não atribuído'}</Text>
              <Text style={styles.caption}>Percentual: {d.percentual_desenvolvimento}%</Text>
              <Text style={styles.caption}>Previsão: {d.previsao_entrega || '-'}</Text>
              <Text style={styles.caption}>Chamados: {d.chamados_atuais || '-'}</Text>
              <Pressable
                onHoverIn={() => { setHoveredDemandId(d.id); loadObsPreview(d.id); }}
                onHoverOut={() => setHoveredDemandId((current) => (current === d.id ? null : current))}
                onPress={() => {
                  const next = hoveredDemandId === d.id ? null : d.id;
                  setHoveredDemandId(next);
                  if (next) loadObsPreview(next);
                }}
              >
                <Text style={styles.caption}>Observação: Histórico</Text>
              </Pressable>
              <Text style={styles.caption}>Atual: {d.situacao_atual || '-'}</Text>
              <Text style={styles.caption}>Ações: {d.acoes_necessarias || '-'}</Text>
              {menuDemandId === d.id && (
                <View style={styles.menu}>
                  <Pressable style={styles.menuItem} onPress={() => { setMenuDemandId(null); props.onEdit(d); }}><Text style={styles.menuText}>Alterar</Text></Pressable>
                  <Pressable style={styles.menuItem} onPress={() => { setMenuDemandId(null); props.onDelete(d.id); }}><Text style={styles.menuText}>Excluir</Text></Pressable>
                </View>
              )}
              {hoveredDemandId === d.id && (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipTitle}>Histórico</Text>
                  {loadingObsId === d.id ? (
                    <Text style={styles.tooltipItem}>Carregando...</Text>
                  ) : (obsByDemanda[d.id] || []).length ? (
                    (obsByDemanda[d.id] || []).map((line, idx) => (
                      <Text key={`${d.id}-${idx}`} style={styles.tooltipItem}>{line}</Text>
                    ))
                  ) : (
                    <Text style={styles.tooltipItem}>Sem observações cadastradas.</Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function WorkloadCount({
  count,
  demands,
  onOpenDialog,
}: {
  count: number;
  demands: { id: number; demanda_readmine?: string | null; titulo: string }[];
  onOpenDialog: (demands: { id: number; demanda_readmine?: string | null; titulo: string }[]) => void;
}) {
  if (!count || !demands.length) {
    return <Text style={styles.caption}>{count}</Text>;
  }

  return (
    <View style={styles.workloadInlineWrap}>
      <Pressable onPress={() => onOpenDialog(demands)}>
        <Text style={styles.workloadCount}>{count}</Text>
      </Pressable>
    </View>
  );
}

function Chip({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, ativo && styles.chipActive]}><Text style={[styles.chipText, ativo && styles.chipTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#9db4c9', borderRadius: 10, backgroundColor: '#fff', padding: 8 },
  label: { color: '#334155', fontWeight: '600' },
  row: { flexGrow: 0 },
  card: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, gap: 8, borderWidth: 1, borderColor: '#d9e2ec' },
  title: { fontWeight: '700', fontSize: 16, color: '#0f172a' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  squareCard: { borderWidth: 1, borderColor: '#c7d2e0', borderRadius: 10, padding: 8, backgroundColor: '#ffffff', minHeight: 260, position: 'relative' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  dotsBtn: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#e2e8f0' },
  dotsText: { color: '#1e293b', fontWeight: '700', fontSize: 16, lineHeight: 16 },
  itemTitle: { flex: 1, fontWeight: '700', color: '#1e293b', marginBottom: 4, fontSize: 13 },
  caption: { color: '#526279', fontSize: 12 },
  workloadRow: { marginBottom: 6 },
  workloadLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2 },
  workloadInlineWrap: { alignSelf: 'flex-start' },
  workloadCount: { color: '#1f3a5f', fontWeight: '700', textDecorationLine: 'underline' },
  dialogOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.25)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  dialogBox: { width: '92%', maxWidth: 680, maxHeight: '75%', backgroundColor: '#020617', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, gap: 8, borderWidth: 1, borderColor: '#020617' },
  dialogList: { width: '100%' },
  dialogCloseBtn: { alignSelf: 'flex-end', backgroundColor: '#1e293b', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  dialogCloseText: { color: '#f8fafc', fontWeight: '700', fontSize: 12 },
  workloadPanelItemBtn: { paddingVertical: 8 },
  workloadPanelItem: { color: '#f8fafc', fontSize: 14, textDecorationLine: 'underline', fontWeight: '700' },
  menu: { position: 'absolute', top: 34, right: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, minWidth: 110, zIndex: 3 },
  menuItem: { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  menuText: { color: '#1e293b', fontWeight: '600', fontSize: 12 },
  tooltip: { marginTop: 6, backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, gap: 4 },
  tooltipTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 12, marginBottom: 2 },
  tooltipItem: { color: '#f1f5f9', fontSize: 12 },
  tooltipItemLink: { color: '#f1f5f9', fontSize: 12, textDecorationLine: 'underline', fontWeight: '700' },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#dfe6ef', marginRight: 8 },
  chipActive: { backgroundColor: '#1e3a5f' },
  chipText: { color: '#1f2937', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#ffffff' },
  btn: { backgroundColor: '#1f3a5f', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
