import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

const TRAINERS = [
  { id: 1, name: 'Mestre Silva', emoji: '🧔', specialty: 'Aberturas', level: 'Intermediário', rating: 1800, description: 'Especialista em aberturas clássicas. Ideal para jogadores que querem melhorar o início da partida.', lessons: 24, students: 312, color: '#2563eb20', border: '#2563eb40' },
  { id: 2, name: 'GM Petrov', emoji: '👨‍🏫', specialty: 'Estratégia', level: 'Avançado', rating: 2400, description: 'Grande Mestre com foco em planejamento estratégico de longo prazo e estruturas de peões.', lessons: 36, students: 189, color: '#7c3aed20', border: '#7c3aed40' },
  { id: 3, name: 'IM Costa', emoji: '🧑‍💻', specialty: 'Táticas', level: 'Todos', rating: 2200, description: 'Mestre Internacional especializado em combinações táticas e puzzles. Aulas dinâmicas e práticas.', lessons: 48, students: 521, color: '#16a34a20', border: '#16a34a40' },
  { id: 4, name: 'Prof. Nakamura', emoji: '👩‍🏫', specialty: 'Finais', level: 'Intermediário', rating: 2100, description: 'Especialista em finais de jogo. Aprenda a converter vantagens e defender posições difíceis.', lessons: 30, students: 278, color: '#d4a84320', border: '#d4a84340' },
];

const LEVEL_COLOR: Record<string, string> = {
  'Iniciante': '#22c55e',
  'Intermediário': '#f59e0b',
  'Avançado': '#ef4444',
  'Todos': '#60a5fa',
};

export default function TrainerScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🎓 Treinador</Text>
          <Text style={styles.subtitle}>Aprenda com os melhores treinadores de xadrez</Text>
        </View>

        {/* Trainers */}
        {TRAINERS.map((trainer) => (
          <TouchableOpacity
            key={trainer.id}
            style={[styles.card, { backgroundColor: trainer.color, borderColor: trainer.border }, selected === trainer.id && styles.cardSelected]}
            onPress={() => setSelected(selected === trainer.id ? null : trainer.id)}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.trainerEmoji}>{trainer.emoji}</Text>
              <View style={styles.trainerInfo}>
                <Text style={styles.trainerName}>{trainer.name}</Text>
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, { backgroundColor: LEVEL_COLOR[trainer.level] + '30' }]}>
                    <Text style={[styles.badgeText, { color: LEVEL_COLOR[trainer.level] }]}>{trainer.level}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>⭐ {trainer.specialty}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.ratingBox}>
                <Text style={styles.ratingValue}>{trainer.rating}</Text>
                <Text style={styles.ratingLabel}>Rating</Text>
              </View>
            </View>

            <Text style={styles.trainerDesc}>{trainer.description}</Text>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{trainer.lessons}</Text>
                <Text style={styles.statLabel}>Lições</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{trainer.students}</Text>
                <Text style={styles.statLabel}>Alunos</Text>
              </View>
            </View>

            {selected === trainer.id && (
              <TouchableOpacity style={styles.startBtn} activeOpacity={0.8}>
                <Text style={styles.startBtnText}>Iniciar Treino →</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#d4a843', fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  card: { borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1 },
  cardSelected: { borderColor: '#d4a843' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  trainerEmoji: { fontSize: 36 },
  trainerInfo: { flex: 1 },
  trainerName: { fontSize: 16, fontWeight: '700', color: '#f0f0f0', marginBottom: 6 },
  badgesRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: { backgroundColor: '#ffffff15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#ccc' },
  ratingBox: { alignItems: 'center' },
  ratingValue: { fontSize: 18, fontWeight: '800', color: '#d4a843' },
  ratingLabel: { fontSize: 10, color: '#888' },
  trainerDesc: { fontSize: 13, color: '#aaa', lineHeight: 18, marginBottom: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#f0f0f0' },
  statLabel: { fontSize: 11, color: '#888' },
  statDivider: { width: 1, height: 30, backgroundColor: '#3a3a3a' },
  startBtn: { marginTop: 12, backgroundColor: '#d4a843', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  startBtnText: { color: '#1a1a1a', fontWeight: '800', fontSize: 15 },
});
