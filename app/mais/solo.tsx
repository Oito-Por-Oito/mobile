import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
const MODES = [
  { id: 1, title: 'Xadrez Solo', desc: 'Jogue os dois lados e analise posições livremente', emoji: '🧩', action: 'play-computer' },
  { id: 2, title: 'Modo Análise', desc: 'Configure qualquer posição e analise com Stockfish', emoji: '📊', action: 'play-computer' },
  { id: 3, title: 'Puzzles Personalizados', desc: 'Crie seus próprios puzzles táticos', emoji: '🎯', action: '(tabs)/puzzles' },
];
export default function SoloScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.title}>🧩 Xadrez Solo</Text>
          <Text style={styles.subtitle}>Pratique e analise no seu próprio ritmo</Text>
        </View>
        {MODES.map(mode => (
          <TouchableOpacity key={mode.id} style={styles.card} activeOpacity={0.85} onPress={() => router.push(('/' + mode.action) as any)}>
            <Text style={styles.modeEmoji}>{mode.emoji}</Text>
            <View style={styles.modeInfo}>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <Text style={styles.modeDesc}>{mode.desc}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#d4a843', fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  card: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3a3a3a' },
  modeEmoji: { fontSize: 32 },
  modeInfo: { flex: 1 },
  modeTitle: { fontSize: 15, fontWeight: '700', color: '#f0f0f0', marginBottom: 4 },
  modeDesc: { fontSize: 13, color: '#888' },
  arrow: { fontSize: 22, color: '#888' },
});
