import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

const MODES = ['Clássico', 'Rápido', 'Blitz', 'Bullet', 'Correspondência'];
const CATEGORIES = ['Open', 'Feminino', 'Juniores'];

const TOP_PLAYERS: Record<string, any[]> = {
  Clássico: [
    { rank: 1, name: 'Magnus Carlsen', country: 'NO', flag: '🇳🇴', rating: 2830, title: 'GM' },
    { rank: 2, name: 'Fabiano Caruana', country: 'US', flag: '🇺🇸', rating: 2805, title: 'GM' },
    { rank: 3, name: 'Hikaru Nakamura', country: 'US', flag: '🇺🇸', rating: 2794, title: 'GM' },
    { rank: 4, name: 'Arjun Erigaisi', country: 'IN', flag: '🇮🇳', rating: 2778, title: 'GM' },
    { rank: 5, name: 'Wei Yi', country: 'CN', flag: '🇨🇳', rating: 2774, title: 'GM' },
    { rank: 6, name: 'Gukesh D', country: 'IN', flag: '🇮🇳', rating: 2770, title: 'GM' },
    { rank: 7, name: 'Ian Nepomniachtchi', country: 'RU', flag: '🇷🇺', rating: 2767, title: 'GM' },
    { rank: 8, name: 'Nodirbek Abdusattorov', country: 'UZ', flag: '🇺🇿', rating: 2762, title: 'GM' },
    { rank: 9, name: 'Alireza Firouzja', country: 'FR', flag: '🇫🇷', rating: 2759, title: 'GM' },
    { rank: 10, name: 'Viswanathan Anand', country: 'IN', flag: '🇮🇳', rating: 2751, title: 'GM' },
  ],
  Rápido: [
    { rank: 1, name: 'Magnus Carlsen', country: 'NO', flag: '🇳🇴', rating: 2880, title: 'GM' },
    { rank: 2, name: 'Hikaru Nakamura', country: 'US', flag: '🇺🇸', rating: 2832, title: 'GM' },
    { rank: 3, name: 'Fabiano Caruana', country: 'US', flag: '🇺🇸', rating: 2820, title: 'GM' },
    { rank: 4, name: 'Alireza Firouzja', country: 'FR', flag: '🇫🇷', rating: 2810, title: 'GM' },
    { rank: 5, name: 'Gukesh D', country: 'IN', flag: '🇮🇳', rating: 2800, title: 'GM' },
  ],
  Blitz: [
    { rank: 1, name: 'Magnus Carlsen', country: 'NO', flag: '🇳🇴', rating: 2886, title: 'GM' },
    { rank: 2, name: 'Hikaru Nakamura', country: 'US', flag: '🇺🇸', rating: 2860, title: 'GM' },
    { rank: 3, name: 'Ian Nepomniachtchi', country: 'RU', flag: '🇷🇺', rating: 2840, title: 'GM' },
    { rank: 4, name: 'Alireza Firouzja', country: 'FR', flag: '🇫🇷', rating: 2835, title: 'GM' },
    { rank: 5, name: 'Nodirbek Abdusattorov', country: 'UZ', flag: '🇺🇿', rating: 2820, title: 'GM' },
  ],
  Bullet: [
    { rank: 1, name: 'Hikaru Nakamura', country: 'US', flag: '🇺🇸', rating: 3200, title: 'GM' },
    { rank: 2, name: 'Magnus Carlsen', country: 'NO', flag: '🇳🇴', rating: 3190, title: 'GM' },
    { rank: 3, name: 'Alireza Firouzja', country: 'FR', flag: '🇫🇷', rating: 3150, title: 'GM' },
    { rank: 4, name: 'Andrew Tang', country: 'US', flag: '🇺🇸', rating: 3140, title: 'GM' },
    { rank: 5, name: 'Arjun Erigaisi', country: 'IN', flag: '🇮🇳', rating: 3100, title: 'GM' },
  ],
  Correspondência: [
    { rank: 1, name: 'Tunc Hamarat', country: 'AT', flag: '🇦🇹', rating: 2640, title: 'SIM' },
    { rank: 2, name: 'Gert Jan Timmerman', country: 'NL', flag: '🇳🇱', rating: 2620, title: 'SIM' },
    { rank: 3, name: 'Mikhail Umansky', country: 'DE', flag: '🇩🇪', rating: 2600, title: 'SIM' },
    { rank: 4, name: 'Grigory Serper', country: 'US', flag: '🇺🇸', rating: 2580, title: 'GM' },
    { rank: 5, name: 'Joop van Oosterom', country: 'NL', flag: '🇳🇱', rating: 2570, title: 'SIM' },
  ],
};

const MEDAL = ['🥇', '🥈', '🥉'];

export default function RatingsPlayersScreen() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState('Clássico');
  const [selectedCategory, setSelectedCategory] = useState('Open');

  const players = TOP_PLAYERS[selectedMode] ?? [];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🌍 Rankings Mundiais</Text>
          <Text style={styles.subtitle}>Classificações FIDE dos melhores jogadores do mundo</Text>
        </View>

        {/* Mode selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          {MODES.map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.modeBtn, selectedMode === mode && styles.modeBtnActive]}
              onPress={() => setSelectedMode(mode)}
            >
              <Text style={[styles.modeBtnText, selectedMode === mode && styles.modeBtnTextActive]}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category selector */}
        <View style={styles.categoryRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, selectedCategory === cat && styles.catBtnActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catBtnText, selectedCategory === cat && styles.catBtnTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: 36 }]}>#</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Jogador</Text>
          <Text style={[styles.tableHeaderText, { width: 60, textAlign: 'right' }]}>Rating</Text>
        </View>

        {/* Players list */}
        {players.map((player) => (
          <View key={player.rank} style={[styles.playerRow, player.rank <= 3 && styles.playerRowTop]}>
            <Text style={styles.rankText}>
              {player.rank <= 3 ? MEDAL[player.rank - 1] : `${player.rank}`}
            </Text>
            <View style={styles.playerInfo}>
              <View style={styles.playerNameRow}>
                <Text style={styles.flagText}>{player.flag}</Text>
                <Text style={styles.titleBadge}>{player.title}</Text>
                <Text style={styles.playerName}>{player.name}</Text>
              </View>
              <Text style={styles.countryText}>{player.country}</Text>
            </View>
            <Text style={styles.ratingText}>{player.rating}</Text>
          </View>
        ))}

        <Text style={styles.source}>Fonte: FIDE Rating List (dados ilustrativos)</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#d4a843', fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  modeScroll: { marginBottom: 12 },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2c2c2c', borderWidth: 1, borderColor: '#3a3a3a' },
  modeBtnActive: { backgroundColor: '#d4a84320', borderColor: '#d4a843' },
  modeBtnText: { fontSize: 13, color: '#888', fontWeight: '600' },
  modeBtnTextActive: { color: '#d4a843' },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  catBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2c2c2c', alignItems: 'center', borderWidth: 1, borderColor: '#3a3a3a' },
  catBtnActive: { backgroundColor: '#d4a84320', borderColor: '#d4a843' },
  catBtnText: { fontSize: 12, color: '#888', fontWeight: '600' },
  catBtnTextActive: { color: '#d4a843' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1a1a1a', borderRadius: 8, marginBottom: 4 },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2c2c2c', borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#3a3a3a' },
  playerRowTop: { borderColor: '#d4a84340', backgroundColor: '#d4a84308' },
  rankText: { width: 36, fontSize: 16, fontWeight: '700', color: '#888' },
  playerInfo: { flex: 1 },
  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  flagText: { fontSize: 16 },
  titleBadge: { fontSize: 10, fontWeight: '700', color: '#d4a843', backgroundColor: '#d4a84320', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  playerName: { fontSize: 14, fontWeight: '600', color: '#f0f0f0' },
  countryText: { fontSize: 11, color: '#888' },
  ratingText: { width: 60, fontSize: 16, fontWeight: '800', color: '#d4a843', textAlign: 'right' },
  source: { fontSize: 11, color: '#555', textAlign: 'center', marginTop: 16, marginBottom: 8 },
});
