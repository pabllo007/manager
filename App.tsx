import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { api } from './src/api';
import { Demanda, Desenvolvedor, DevWorkload, Sistema, SistemaInfo, Status } from './src/types';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DemandForm, NewDemandScreen } from './src/screens/NewDemandScreen';
import { SystemsScreen } from './src/screens/SystemsScreen';

const initialForm: DemandForm = {
  demanda_readmine: '',
  titulo: '',
  sistema: 'Hemoglobinopatias',
  responsavel_ids: [],
  status: 'NÃO INICIADO',
  percentual_desenvolvimento: '0',
  previsao_entrega: '',
  chamados_atuais: '',
  situacao_atual: '',
  acoes_necessarias: '',
};


function normalizeDemanda(item: Demanda): Demanda {
  return {
    ...item,
    id: Number(item.id),
    demanda_readmine: item.demanda_readmine || '',
    percentual_desenvolvimento: Number(item.percentual_desenvolvimento || 0),
    responsavel_ids: (item.responsavel_ids || []).map((id) => Number(id)),
  };
}

export default function App() {
  const [tab, setTab] = useState<'dashboard' | 'nova' | 'sistemas'>('dashboard');
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [desenvolvedores, setDesenvolvedores] = useState<Desenvolvedor[]>([]);
  const [sistemas, setSistemas] = useState<SistemaInfo[]>([]);
  const [workload, setWorkload] = useState<DevWorkload[]>([]);
  const [filtroSistema, setFiltroSistema] = useState<Sistema | 'Todos'>('Todos');
  const [filtroStatus, setFiltroStatus] = useState<Status | 'Todos'>('Todos');
  const [filtroDev, setFiltroDev] = useState<number | 'Todos'>('Todos');
  const [form, setForm] = useState<DemandForm>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetFormToNewDemand() {
    setForm({ ...initialForm });
  }

  async function loadAll() {
    try {
      setError(null);
      const qs = new URLSearchParams();
      if (filtroSistema !== 'Todos') qs.set('sistema', filtroSistema);
      if (filtroStatus !== 'Todos') qs.set('status', filtroStatus);
      if (filtroDev !== 'Todos') qs.set('responsavel_id', String(filtroDev));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';

      const [d, devs, sis, wl] = await Promise.all([
        api.getDemandas(suffix),
        api.getDevs(),
        api.getSistemas(),
        api.getWorkload(),
      ]);

      setDemandas(d.map((item) => normalizeDemanda(item)));
      setDesenvolvedores(devs);
      setSistemas(sis);
      setWorkload(wl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha de conexão com API.');
    }
  }

  useEffect(() => {
    loadAll();
  }, [filtroSistema, filtroStatus, filtroDev]);

  async function submitForm() {
    try {
      const payload = {
        demanda_readmine: form.demanda_readmine.trim() || null,
        titulo: form.titulo,
        sistema: form.sistema,
        responsavel_ids: form.responsavel_ids.map(Number),
        status: form.status,
        percentual_desenvolvimento: Number(form.percentual_desenvolvimento),
        previsao_entrega: form.previsao_entrega || null,
        chamados_atuais: form.chamados_atuais || null,
        situacao_atual: form.situacao_atual || null,
        acoes_necessarias: form.acoes_necessarias || null,
      };

      if (form.id) {
        await api.updateDemanda(form.id, payload);
        setMessage('Demanda alterada com sucesso.');
      } else {
        await api.createDemanda(payload);
        setMessage('Demanda criada com sucesso.');
      }

      resetFormToNewDemand();
      setTab('dashboard');
      await loadAll();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível salvar a demanda.');
    }
  }

  async function deleteDemanda(id: number) {
    try {
      await api.deleteDemanda(id);
      if (form.id === id) {
        resetFormToNewDemand();
      }
      await loadAll();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível excluir a demanda.');
    }
  }

  useEffect(() => {
    if (!form.id) return;
    const stillExists = demandas.some((d) => d.id === form.id);
    if (!stillExists) {
      resetFormToNewDemand();
      setMessage('A demanda que estava em alteração foi excluída. O formulário voltou para cadastro de nova demanda.');
    }
  }, [demandas, form.id]);

  function openNewDemandTab() {
    resetFormToNewDemand();
    setTab('nova');
  }

  function editDemanda(d: Demanda) {
    setForm({
      id: d.id,
      demanda_readmine: d.demanda_readmine || '',
      titulo: d.titulo,
      sistema: d.sistema,
      responsavel_ids: d.responsavel_ids.map(String),
      status: d.status,
      percentual_desenvolvimento: String(d.percentual_desenvolvimento),
      previsao_entrega: d.previsao_entrega?.slice(0, 10) || '',
      chamados_atuais: d.chamados_atuais || '',
      situacao_atual: d.situacao_atual || '',
      acoes_necessarias: d.acoes_necessarias || '',
    });
    setTab('nova');
  }

  async function openDemandFromWorkload(id: number) {
    const demandId = Number(id);
    if (!Number.isInteger(demandId) || demandId <= 0) {
      setMessage('Não foi possível abrir a demanda selecionada.');
      return;
    }

    const existente = demandas.find((d) => Number(d.id) === demandId);
    if (existente) {
      editDemanda(existente);
      return;
    }
    try {
      const todas = (await api.getDemandas()).map((d) => normalizeDemanda(d));
      const encontrada = todas.find((d) => Number(d.id) === demandId);
      if (!encontrada) {
        setMessage('Demanda não encontrada para edição.');
        return;
      }
      editDemanda(normalizeDemanda(encontrada));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível abrir a demanda para edição.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>mangertask</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <ViewTabs tab={tab} setTab={setTab} onOpenNewDemand={openNewDemandTab} />

        {tab === 'dashboard' && (
          <DashboardScreen
            demandas={demandas}
            desenvolvedores={desenvolvedores}
            workload={workload}
            filtroSistema={filtroSistema}
            setFiltroSistema={setFiltroSistema}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
            filtroDev={filtroDev}
            setFiltroDev={setFiltroDev}
            onRefresh={loadAll}
            onEdit={editDemanda}
            onOpenDemandFromWorkload={openDemandFromWorkload}
            onDelete={deleteDemanda}
          />
        )}

        {tab === 'nova' && (
          <NewDemandScreen
            form={form}
            setForm={setForm}
            desenvolvedores={desenvolvedores}
            onSubmit={submitForm}
            message={message}
          />
        )}

        {tab === 'sistemas' && <SystemsScreen sistemas={sistemas} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function ViewTabs({
  tab,
  setTab,
  onOpenNewDemand,
}: {
  tab: 'dashboard' | 'nova' | 'sistemas';
  setTab: (tab: 'dashboard' | 'nova' | 'sistemas') => void;
  onOpenNewDemand: () => void;
}) {
  return (
    <>
      <Text style={styles.subtitle}>Menu</Text>
      <ScrollView horizontal style={styles.menuTop} showsHorizontalScrollIndicator={false}>
        <Pressable style={[styles.tabBtn, tab === 'dashboard' && styles.active]} onPress={() => setTab('dashboard')}><Text style={[styles.tabTxt, tab === 'dashboard' && styles.tabTxtActive]}>Dashboard</Text></Pressable>
        <Pressable style={[styles.tabBtn, tab === 'nova' && styles.active]} onPress={onOpenNewDemand}><Text style={[styles.tabTxt, tab === 'nova' && styles.tabTxtActive]}>Cadastro da Demanda</Text></Pressable>
        <Pressable style={[styles.tabBtn, tab === 'sistemas' && styles.active]} onPress={() => setTab('sistemas')}><Text style={[styles.tabTxt, tab === 'sistemas' && styles.tabTxtActive]}>Equipe/Sistemas/Gestores</Text></Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e9edf5' },
  content: { padding: 16, gap: 10 },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  menuTop: { flexGrow: 0 },
  tabBtn: { backgroundColor: '#d7deea', borderRadius: 10, padding: 10, marginRight: 8 },
  active: { backgroundColor: '#1f3a5f' },
  tabTxt: { color: '#334155', fontWeight: '700' },
  tabTxtActive: { color: '#ffffff' },
  error: { color: '#b91c1c', fontWeight: '700' },
});
