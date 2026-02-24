import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
const OPENINGS = [
  { id: 1, name: 'Ruy Lopez', eco: 'C60-C99', moves: '1.e4 e5 2.Nf3 Nc6 3.Bb5', emoji: '♟️', popularity: 95 },
  { id: 2, name: 'Defesa Siciliana', eco: 'B20-B99', moves: '1.e4 c5', emoji: '🛡️', popularity: 98 },
  { id: 3, name: 'Gambito da Dama', eco: 'D06-D69', moves: '1.d4 d5 2.c4', emoji: '♛', popularity: 90 },
  { id: 4, name: 'Defesa Francesa', eco: 'C00-C19', moves: '1.e4 e6', emoji: '🇫🇷', popularity: 80 },
  { id: 5, name: 'Defesa Caro-Kann', eco: 'B10-B19', moves: '1.e4 c6', emoji: '🏰', popularity: 75 },
  { id: 6, name: 'Abertura Inglesa', eco: 'A10-A39', moves: '1.c4', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', popularity: 70 },
];
export default function OpeningsScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.title}>📖 Aberturas</Text>
          <Text style={styles.subtitle}>Explore as principais aberturas do xadrez</Text>
        </View>
        {OPENINGS.map(op => (
          <TouchableOpacity key={op.id} style={styles.card} activeOpacity={0.85}>
            <Text style={styles.opEmoji}>{op.emoji}</Text>
            <View style={styles.opInfo}>
              <View style={styles.opTopRow}>
                <Text style={styles.opName}>{op.name}</Text>
                <Text style={styles.opEco}>{op.eco}</Text>
              </View>
              <Text style={styles.opMoves}>{op.moves}</Text>
              <View style={styles.popularityBar}>
                <View style={[styles.popularityFill, { width: `${op.popularity}%` as any }]} />
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
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  card: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#3a3a3a' },
  opEmoji: { fontSize: 28, marginTop: 2 },
  opInfo: { flex: 1 },
  opTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  opName: { fontSize: 15, fontWeight: '700', color: '#f0f0f0' },
  opEco: { fontSize: 11, color: '#888' },
  opMoves: { fontSize: 12, color: '#aaa', fontFamily: 'monospace', marginBottom: 8 },
  popularityBar: { height: 4, backgroundColor: '#3a3a3a', borderRadius: 2 },
  popularityFill: { height: 4, backgroundColor: '#d4a843', borderRadius: 2 },
});
