import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
const ARTICLES = [
  { id: 1, title: 'Como melhorar seu jogo de finais em 30 dias', author: 'GM Ferreira', readTime: '8 min', emoji: '📝' },
  { id: 2, title: 'Os 10 erros mais comuns de jogadores iniciantes', author: 'IM Souza', readTime: '5 min', emoji: '⚠️' },
  { id: 3, title: 'A história da Defesa Siciliana', author: 'Prof. Lima', readTime: '12 min', emoji: '📚' },
  { id: 4, title: 'Xadrez e inteligência artificial: o futuro do jogo', author: 'Redação', readTime: '6 min', emoji: '🤖' },
];
export default function ArticlesScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.title}>📝 Artigos</Text>
        </View>
        {ARTICLES.map(a => (
          <TouchableOpacity key={a.id} style={styles.card} activeOpacity={0.85}>
            <Text style={styles.cardEmoji}>{a.emoji}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{a.title}</Text>
              <Text style={styles.cardMeta}>por {a.author} · {a.readTime} de leitura</Text>
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
  card: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#3a3a3a' },
  cardEmoji: { fontSize: 28, marginTop: 2 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#f0f0f0', lineHeight: 20, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#888' },
});
