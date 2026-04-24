import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Desenvolvedor, Sistema, Status } from '../types';
import { ObservationHistory } from '../components/ObservationHistory';

const sistemas: Sistema[] = ['Hemoglobinopatias', 'Coagulopatias', 'Ciclo de Sangue', 'GSM-NAT', 'Hemovida'];
const statusOptions: Status[] = ['NÃO INICIADO', 'EM ANDAMENTO', 'HOMOLOGAÇÃO', 'CONCLUÍDO'];

export type DemandForm = {
  id?: number;
  demanda_readmine: string;
  titulo: string;
  sistema: Sistema;
  responsavel_ids: string[];
  status: Status;
  percentual_desenvolvimento: string;
  previsao_entrega: string;
  chamados_atuais: string;
  situacao_atual: string;
  acoes_necessarias: string;
};

export function NewDemandScreen({
  form,
  setForm,
  desenvolvedores,
  onSubmit,
  message,
}: {
  form: DemandForm;
  setForm: (f: DemandForm) => void;
  desenvolvedores: Desenvolvedor[];
  onSubmit: () => void;
  message: string | null;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{form.id ? 'Alterar demanda' : 'Nova demanda'}</Text>
      <FormInput label="Demanda READMINE (opcional)" value={form.demanda_readmine} onChangeText={(v) => setForm({ ...form, demanda_readmine: v })} />
      <FormInput label="Título" value={form.titulo} onChangeText={(v) => setForm({ ...form, titulo: v })} />

      <Text style={styles.label}>Sistema (selecionável)</Text>
      <ScrollView horizontal style={styles.row}>{sistemas.map((s) => <Chip key={s} label={s} ativo={form.sistema === s} onPress={() => setForm({ ...form, sistema: s })} />)}</ScrollView>

      <Text style={styles.label}>Responsável (selecionável)</Text>
      <ScrollView horizontal style={styles.row}>
        <Chip label="Não atribuído" ativo={form.responsavel_ids.length === 0} onPress={() => setForm({ ...form, responsavel_ids: [] })} />
        {desenvolvedores.map((d) => {
          const value = String(d.id);
          const ativo = form.responsavel_ids.includes(value);
          return (
            <Chip
              key={d.id}
              label={d.nome.split(' ')[0] || d.nome}
              ativo={ativo}
              onPress={() =>
                setForm({
                  ...form,
                  responsavel_ids: ativo
                    ? form.responsavel_ids.filter((id) => id !== value)
                    : [...form.responsavel_ids, value],
                })
              }
            />
          );
        })}
      </ScrollView>


      <Text style={styles.helper}>Toque em um nome para marcar/desmarcar. Uma demanda pode ter múltiplos responsáveis.</Text>
      <Text style={styles.helper}>Selecionados: {form.responsavel_ids.length ? desenvolvedores.filter((d) => form.responsavel_ids.includes(String(d.id))).map((d) => d.nome).join(', ') : 'Nenhum'}</Text>
      <Pressable onPress={() => setForm({ ...form, responsavel_ids: [] })} style={styles.clearBtn}><Text style={styles.clearBtnText}>Limpar responsáveis</Text></Pressable>

      <Text style={styles.label}>Status</Text>
      <ScrollView horizontal style={styles.row}>{statusOptions.map((s) => <Chip key={s} label={s} ativo={form.status === s} onPress={() => setForm({ ...form, status: s })} />)}</ScrollView>

      <FormInput label="Percentual" value={form.percentual_desenvolvimento} onChangeText={(v) => setForm({ ...form, percentual_desenvolvimento: v })} />
      <FormInput label="Previsão de Entrega (YYYY-MM-DD)" value={form.previsao_entrega} onChangeText={(v) => setForm({ ...form, previsao_entrega: v })} />
      <FormInput label="Chamados" value={form.chamados_atuais} onChangeText={(v) => setForm({ ...form, chamados_atuais: v })} />
      <FormInput label="Situação Atual" value={form.situacao_atual} onChangeText={(v) => setForm({ ...form, situacao_atual: v })} />
      <FormInput label="Ações Necessárias" value={form.acoes_necessarias} onChangeText={(v) => setForm({ ...form, acoes_necessarias: v })} />

      {!!message && <Text style={styles.msg}>{message}</Text>}
      <Pressable onPress={onSubmit} style={styles.btn}><Text style={styles.btnText}>{form.id ? 'Salvar alterações' : 'Salvar demanda'}</Text></Pressable>

      {form.id && (
        <View style={{ marginTop: 10 }}>
          <ObservationHistory demandaId={form.id} />
        </View>
      )}
    </View>
  );
}

function FormInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} />
    </View>
  );
}

function Chip({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, ativo && styles.chipActive]}><Text style={[styles.chipText, ativo && styles.chipTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  label: { color: '#334155', fontWeight: '600' },
  row: { flexGrow: 0 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', padding: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#e2e8f0', marginRight: 8 },
  chipActive: { backgroundColor: '#0f172a' },
  chipText: { color: '#0f172a', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#f8fafc' },
  btn: { backgroundColor: '#0f172a', borderRadius: 10, padding: 10 },
  btnText: { textAlign: 'center', color: '#fff', fontWeight: '700' },
  msg: { color: '#334155' },
  helper: { color: '#475569', fontSize: 12 },
  clearBtn: { alignSelf: 'flex-start', backgroundColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  clearBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});
