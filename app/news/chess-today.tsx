import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
const NEWS = [
  { id: 1, title: 'Magnus Carlsen vence o Grand Chess Tour 2024', category: 'Torneios', time: '2h atrás', emoji: '♟️' },
  { id: 2, title: 'FIDE anuncia novo formato para o Campeonato Mundial', category: 'FIDE', time: '5h atrás', emoji: '🌍' },
  { id: 3, title: 'Hikaru Nakamura bate recorde de rating no Chess960', category: 'Recordes', time: '1d atrás', emoji: '⚡' },
  { id: 4, title: 'Jovem prodígio de 14 anos se torna Mestre Internacional', category: 'Destaque', time: '2d atrás', emoji: '🌟' },
  { id: 5, title: 'Brasil conquista medalha de ouro na Olimpíada de Xadrez', category: 'Brasil', time: '3d atrás', emoji: '🇧🇷' },
];
export default function ChessTodayScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.title}>📰 Xadrez Hoje</Text>
        </View>
        {NEWS.map(n => (
          <TouchableOpacity key={n.id} style={styles.newsCard} activeOpacity={0.85}>
            <Text style={styles.newsEmoji}>{n.emoji}</Text>
            <View style={styles.newsInfo}>
              <Text style={styles.newsTitle}>{n.title}</Text>
              <View style={styles.newsMeta}>
                <Text style={styles.newsCategory}>{n.category}</Text>
                <Text style={styles.newsTime}>{n.time}</Text>
              </View>
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
  newsCard: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#3a3a3a' },
  newsEmoji: { fontSize: 28, marginTop: 2 },
  newsInfo: { flex: 1 },
  newsTitle: { fontSize: 14, fontWeight: '600', color: '#f0f0f0', lineHeight: 20, marginBottom: 6 },
  newsMeta: { flexDirection: 'row', gap: 10 },
  newsCategory: { fontSize: 11, color: '#d4a843', fontWeight: '600' },
  newsTime: { fontSize: 11, color: '#888' },
});
