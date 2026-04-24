import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { Observacao } from '../types';

export function ObservationHistory({ demandaId, editable = true }: { demandaId: number; editable?: boolean }) {
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [novaObs, setNovaObs] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editTexto, setEditTexto] = useState('');

  async function carregar() {
    setObservacoes(await api.getObservacoes(demandaId));
  }

  useEffect(() => {
    carregar();
  }, [demandaId]);

  async function add() {
    if (!editable || !novaObs.trim()) return;
    await api.addObservacao(demandaId, { autor: 'Usuário', texto: novaObs.trim() });
    setNovaObs('');
    await carregar();
  }

  async function saveEdit() {
    if (!editable || !editId || !editTexto.trim()) return;
    await api.updateObservacao(editId, { autor: 'Usuário', texto: editTexto.trim() });
    setEditId(null);
    setEditTexto('');
    await carregar();
  }

  async function remove(id: number) {
    if (!editable) return;
    await api.deleteObservacao(id);
    await carregar();
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Histórico da demanda</Text>

      {editable && (
        <>
          <TextInput value={novaObs} onChangeText={setNovaObs} style={styles.input} placeholder="Nova observação" />
          <Pressable style={styles.btn} onPress={add}><Text style={styles.btnText}>Add</Text></Pressable>
        </>
      )}

      <View style={styles.headerRow}>
        <Text style={[styles.colObs, styles.headerText]}>Observação</Text>
        {editable && <Text style={[styles.colActions, styles.headerText]}>Ações</Text>}
      </View>

      {observacoes.map((o) => (
        <View key={o.id} style={styles.row}>
          <View style={styles.colObs}>
            <Text style={styles.meta}>{o.autor} - {new Date(o.created_at).toLocaleString()}</Text>
            {editable && editId === o.id ? (
              <>
                <TextInput style={styles.input} value={editTexto} onChangeText={setEditTexto} />
                <Pressable style={styles.btn} onPress={saveEdit}><Text style={styles.btnText}>Salvar</Text></Pressable>
              </>
            ) : (
              <Text style={styles.text}>{o.texto}</Text>
            )}
          </View>

          {editable && (
            <View style={styles.colActions}>
              <Pressable style={styles.btnInline} onPress={() => { setEditId(o.id); setEditTexto(o.texto); }}><Text style={styles.btnText}>Editar</Text></Pressable>
              <Pressable style={styles.btnInline} onPress={() => remove(o.id)}><Text style={styles.btnText}>Excluir</Text></Pressable>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#fff', borderRadius: 10, padding: 10, gap: 6 },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 8, backgroundColor: '#fff' },
  btn: { backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 4 },
  btnInline: { backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  headerText: { fontWeight: '700', color: '#334155' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 8, gap: 10 },
  colObs: { flex: 3 },
  colActions: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' },
  meta: { color: '#64748b', fontSize: 12 },
  text: { color: '#1e293b' },
});
