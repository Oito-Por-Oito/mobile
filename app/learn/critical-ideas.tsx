import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
const IDEAS = [
  { id: 1, title: 'Controle do Centro', desc: 'Por que as casas e4, d4, e5, d5 são tão importantes?', emoji: '🎯', level: 'Fundamental' },
  { id: 2, title: 'Desenvolvimento de Peças', desc: 'Regras de ouro para o desenvolvimento eficiente na abertura.', emoji: '♟️', level: 'Fundamental' },
  { id: 3, title: 'Segurança do Rei', desc: 'Como proteger seu rei e atacar o do adversário.', emoji: '♔', level: 'Intermediário' },
  { id: 4, title: 'Estrutura de Peões', desc: 'Peões isolados, dobrados, passados e suas implicações.', emoji: '⚔️', level: 'Intermediário' },
  { id: 5, title: 'Iniciativa e Tempo', desc: 'Como ganhar e manter a iniciativa na partida.', emoji: '⚡', level: 'Avançado' },
  { id: 6, title: 'Sacrifícios Posicionais', desc: 'Quando e como sacrificar material por vantagem posicional.', emoji: '💎', level: 'Avançado' },
];
const LEVEL_COLOR: Record<string, string> = { 'Fundamental': '#22c55e', 'Intermediário': '#f59e0b', 'Avançado': '#ef4444' };
export default function CriticalIdeasScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.title}>💡 Ideias Críticas</Text>
          <Text style={styles.subtitle}>Conceitos fundamentais que todo jogador deve dominar</Text>
        </View>
        {IDEAS.map(idea => (
          <TouchableOpacity key={idea.id} style={styles.ideaCard} activeOpacity={0.85}>
            <Text style={styles.ideaEmoji}>{idea.emoji}</Text>
            <View style={styles.ideaInfo}>
              <View style={styles.ideaTopRow}>
                <Text style={styles.ideaTitle}>{idea.title}</Text>
                <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLOR[idea.level] + '20' }]}>
                  <Text style={[styles.levelText, { color: LEVEL_COLOR[idea.level] }]}>{idea.level}</Text>
                </View>
              </View>
              <Text style={styles.ideaDesc}>{idea.desc}</Text>
            </View>
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
  ideaCard: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#3a3a3a' },
  ideaEmoji: { fontSize: 28, marginTop: 2 },
  ideaInfo: { flex: 1 },
  ideaTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  ideaTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#f0f0f0' },
  levelBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  levelText: { fontSize: 11, fontWeight: '600' },
  ideaDesc: { fontSize: 13, color: '#aaa', lineHeight: 18 },
});
