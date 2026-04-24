import { StyleSheet, Text, View } from 'react-native';
import { SistemaInfo } from '../types';

export function SystemsScreen({ sistemas }: { sistemas: SistemaInfo[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Equipe / Sistema / Gestores</Text>
      {sistemas.map((s) => (
        <View key={s.id} style={styles.item}>
          <Text style={styles.itemTitle}>{s.nome}</Text>
          <Text style={styles.caption}>Equipe: {s.equipe}</Text>
          <Text style={styles.caption}>Gerente de Relacionamento: {s.gerente_relacionamento}</Text>
          <Text style={styles.caption}>Gerente Técnico: {s.gerente_tecnico}</Text>
          <Text style={styles.caption}>Ponto Focal: {s.ponto_focal}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  item: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 8 },
  itemTitle: { fontWeight: '700', color: '#1e293b' },
  caption: { color: '#64748b', fontSize: 12 },
});
