import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

const VARIANTS = [
  { id: 'chess960', name: 'Chess960', emoji: '🎲', description: 'As peças iniciais são embaralhadas aleatoriamente. 960 posições iniciais possíveis.', difficulty: 'Médio', popular: true, color: '#7c3aed20', border: '#7c3aed40' },
  { id: 'crazyhouse', name: 'Crazyhouse', emoji: '🏠', description: 'Peças capturadas podem ser colocadas de volta no tabuleiro como suas próprias.', difficulty: 'Difícil', popular: true, color: '#dc262620', border: '#dc262640' },
  { id: 'four-player', name: '4 Jogadores', emoji: '👥', description: 'Xadrez para quatro jogadores num tabuleiro especial. Alianças e traições!', difficulty: 'Médio', popular: true, color: '#2563eb20', border: '#2563eb40' },
  { id: 'king-of-the-hill', name: 'Rei da Colina', emoji: '⛰️', description: 'Leve seu rei ao centro do tabuleiro para vencer. Estratégia completamente diferente.', difficulty: 'Fácil', popular: false, color: '#16a34a20', border: '#16a34a40' },
  { id: 'three-check', name: 'Três Xeques', emoji: '3️⃣', description: 'Dê xeque três vezes para vencer. Ataques ao rei são mais valiosos.', difficulty: 'Fácil', popular: false, color: '#d4a84320', border: '#d4a84340' },
  { id: 'antichess', name: 'Antixadrez', emoji: '🔄', description: 'O objetivo é perder todas as suas peças. Regras completamente invertidas!', difficulty: 'Médio', popular: false, color: '#db277720', border: '#db277740' },
  { id: 'atomic', name: 'Atômico', emoji: '💥', description: 'Capturas causam explosões que eliminam peças adjacentes. Caótico e divertido.', difficulty: 'Difícil', popular: false, color: '#ea580c20', border: '#ea580c40' },
  { id: 'horde', name: 'Horda', emoji: '⚔️', description: 'Brancas têm uma horda de peões, pretas têm peças normais. Quem vence?', difficulty: 'Médio', popular: false, color: '#0891b220', border: '#0891b240' },
];

const DIFFICULTY_COLOR: Record<string, string> = {
  'Fácil': '#22c55e',
  'Médio': '#f59e0b',
  'Difícil': '#ef4444',
};

export default function VariantsScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🎮 Variantes</Text>
          <Text style={styles.subtitle}>Explore diferentes formas de jogar xadrez</Text>
        </View>

        {/* Popular */}
        <Text style={styles.sectionLabel}>⭐ Populares</Text>
        {VARIANTS.filter(v => v.popular).map((variant) => (
          <TouchableOpacity
            key={variant.id}
            style={[styles.card, { backgroundColor: variant.color, borderColor: variant.border }]}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <View style={styles.cardRow}>
              <Text style={styles.cardEmoji}>{variant.emoji}</Text>
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName}>{variant.name}</Text>
                  <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[variant.difficulty] + '30' }]}>
                    <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[variant.difficulty] }]}>{variant.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>{variant.description}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.playBtn} activeOpacity={0.8}>
              <Text style={styles.playBtnText}>Jogar →</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Outras */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Outras Variantes</Text>
        {VARIANTS.filter(v => !v.popular).map((variant) => (
          <TouchableOpacity
            key={variant.id}
            style={[styles.card, { backgroundColor: variant.color, borderColor: variant.border }]}
            activeOpacity={0.8}
          >
            <View style={styles.cardRow}>
              <Text style={styles.cardEmoji}>{variant.emoji}</Text>
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName}>{variant.name}</Text>
                  <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[variant.difficulty] + '30' }]}>
                    <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[variant.difficulty] }]}>{variant.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>{variant.description}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.playBtn} activeOpacity={0.8}>
              <Text style={styles.playBtnText}>Jogar →</Text>
            </TouchableOpacity>
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
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#d4a843', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardEmoji: { fontSize: 32, marginTop: 2 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#f0f0f0' },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  diffText: { fontSize: 11, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#aaa', lineHeight: 18 },
  playBtn: { backgroundColor: '#d4a84320', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#d4a84340' },
  playBtnText: { color: '#d4a843', fontWeight: '700', fontSize: 14 },
});
