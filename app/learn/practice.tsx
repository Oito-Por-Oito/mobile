import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
const EXERCISES = [
  { id: 1, title: 'Mate em 1', count: 50, emoji: '⚡', color: '#22c55e20', border: '#22c55e40' },
  { id: 2, title: 'Mate em 2', count: 100, emoji: '♟️', color: '#2563eb20', border: '#2563eb40' },
  { id: 3, title: 'Garfo de Cavalo', count: 30, emoji: '🐴', color: '#7c3aed20', border: '#7c3aed40' },
  { id: 4, title: 'Cravada', count: 40, emoji: '📌', color: '#d4a84320', border: '#d4a84340' },
  { id: 5, title: 'Enfiada', count: 25, emoji: '🎯', color: '#ef444420', border: '#ef444440' },
  { id: 6, title: 'Sacrifício de Peça', count: 35, emoji: '💎', color: '#f59e0b20', border: '#f59e0b40' },
];
export default function PracticeScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.title}>🎯 Prática</Text>
          <Text style={styles.subtitle}>Exercícios táticos para treinar seu jogo</Text>
        </View>
        <View style={styles.grid}>
          {EXERCISES.map(ex => (
            <TouchableOpacity key={ex.id} style={[styles.exCard, { backgroundColor: ex.color, borderColor: ex.border }]} activeOpacity={0.85} onPress={() => router.push('/(tabs)/puzzles' as any)}>
              <Text style={styles.exEmoji}>{ex.emoji}</Text>
              <Text style={styles.exTitle}>{ex.title}</Text>
              <Text style={styles.exCount}>{ex.count} exercícios</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exCard: { width: '47%', borderRadius: 14, padding: 16, borderWidth: 1, alignItems: 'center' },
  exEmoji: { fontSize: 32, marginBottom: 8 },
  exTitle: { fontSize: 14, fontWeight: '700', color: '#f0f0f0', textAlign: 'center', marginBottom: 4 },
  exCount: { fontSize: 12, color: '#888' },
});
