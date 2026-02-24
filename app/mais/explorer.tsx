import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
const POSITIONS = [
  { id: 1, name: 'Posição Inicial', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', games: '5.2M' },
  { id: 2, name: 'Após 1.e4', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', games: '3.1M' },
  { id: 3, name: 'Após 1.d4', fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1', games: '2.4M' },
];
export default function ExplorerScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.title}>🔭 Explorador</Text>
          <Text style={styles.subtitle}>Explore posições e estatísticas de partidas</Text>
        </View>
        {POSITIONS.map(pos => (
          <TouchableOpacity key={pos.id} style={styles.card} activeOpacity={0.85}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{pos.name}</Text>
              <Text style={styles.cardFen}>{pos.fen.substring(0, 40)}...</Text>
              <Text style={styles.cardGames}>🎮 {pos.games} partidas analisadas</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>💡 O explorador completo de aberturas estará disponível em breve com dados de partidas de mestres.</Text>
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
  card: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#3a3a3a' },
  cardInfo: {},
  cardName: { fontSize: 15, fontWeight: '700', color: '#f0f0f0', marginBottom: 4 },
  cardFen: { fontSize: 11, color: '#888', fontFamily: 'monospace', marginBottom: 6 },
  cardGames: { fontSize: 12, color: '#d4a843' },
  infoBox: { backgroundColor: '#2563eb15', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2563eb30', marginTop: 8 },
  infoText: { fontSize: 13, color: '#aaa', lineHeight: 18 },
});
