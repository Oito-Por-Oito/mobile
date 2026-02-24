import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { supabase } from '@/lib/supabase';

type LiveGame = {
  id: string;
  white_player: string;
  black_player: string;
  white_rating: number;
  black_rating: number;
  time_control: string;
  move_count: number;
  status: string;
  created_at: string;
};

const WATCH_SECTIONS = [
  { id: 'live', icon: '🔴', title: 'Ao Vivo', description: 'Partidas acontecendo agora' },
  { id: 'chesstv', icon: '📺', title: 'Chess TV', description: 'Transmissões ao vivo' },
  { id: 'events', icon: '🏆', title: 'Eventos', description: 'Torneios e campeonatos' },
  { id: 'streamers', icon: '🎮', title: 'Streamers', description: 'Criadores de conteúdo' },
  { id: 'playing-now', icon: '⚡', title: 'Jogando Agora', description: 'Partidas em andamento' },
];

export default function WatchScreen() {
  const router = useRouter();
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          id, time_control, move_count, status, created_at,
          white_player:profiles!games_white_player_id_fkey(username, rating_rapid),
          black_player:profiles!games_black_player_id_fkey(username, rating_rapid)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const mapped = data.map((g: any) => ({
          id: g.id,
          white_player: g.white_player?.username ?? 'Anônimo',
          black_player: g.black_player?.username ?? 'Anônimo',
          white_rating: g.white_player?.rating_rapid ?? 1200,
          black_rating: g.black_player?.rating_rapid ?? 1200,
          time_control: g.time_control ?? '10+0',
          move_count: g.move_count ?? 0,
          status: g.status,
          created_at: g.created_at,
        }));
        setLiveGames(mapped);
      }
    } catch (e) {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLiveGames(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveGames();
  };

  const renderGame = ({ item }: { item: LiveGame }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => router.push(`/watch/${item.id}` as any)}
      activeOpacity={0.8}
    >
      <View style={styles.gameHeader}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>AO VIVO</Text>
        </View>
        <Text style={styles.timeControl}>{item.time_control}</Text>
      </View>

      <View style={styles.playersRow}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>♔ {item.white_player}</Text>
          <Text style={styles.playerRating}>{item.white_rating}</Text>
        </View>
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
          <Text style={styles.moveCount}>{item.move_count} lances</Text>
        </View>
        <View style={[styles.playerInfo, { alignItems: 'flex-end' }]}>
          <Text style={styles.playerName}>♚ {item.black_player}</Text>
          <Text style={styles.playerRating}>{item.black_rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4a843" />}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>👁 Assistir</Text>
          <Text style={styles.subtitle}>Acompanhe partidas ao vivo</Text>
        </View>

        {/* Seções de navegação */}
        <View style={styles.sectionsGrid}>
          {WATCH_SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={styles.sectionCard}
              onPress={() => router.push(`/watch/${section.id}` as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionDesc}>{section.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Partidas ao vivo */}
        <View style={styles.sectionHeader}>
          <View style={styles.liveBadgeHeader}>
            <View style={styles.liveDot} />
            <Text style={styles.sectionTitle2}>Partidas ao Vivo</Text>
          </View>
          <TouchableOpacity onPress={fetchLiveGames}>
            <Text style={styles.refreshBtn}>↻ Atualizar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#d4a843" style={{ marginVertical: 32 }} />
        ) : liveGames.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📺</Text>
            <Text style={styles.emptyTitle}>Nenhuma partida ao vivo</Text>
            <Text style={styles.emptyDesc}>Volte mais tarde para assistir partidas em tempo real.</Text>
          </View>
        ) : (
          liveGames.map((game) => renderGame({ item: game }))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  sectionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  sectionCard: {
    width: '47%', backgroundColor: '#2c2c2c', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#3a3a3a',
  },
  sectionIcon: { fontSize: 24, marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#f0f0f0', marginBottom: 2 },
  sectionDesc: { fontSize: 11, color: '#888' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle2: { fontSize: 16, fontWeight: '700', color: '#f0f0f0' },
  liveBadgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refreshBtn: { fontSize: 13, color: '#d4a843' },
  gameCard: {
    backgroundColor: '#2c2c2c', borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#3a3a3a',
  },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ef444420', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  liveText: { fontSize: 10, fontWeight: '700', color: '#ef4444' },
  timeControl: { fontSize: 12, color: '#d4a843', fontWeight: '600' },
  playersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 14, fontWeight: '600', color: '#f0f0f0' },
  playerRating: { fontSize: 12, color: '#d4a843', marginTop: 2 },
  vsContainer: { alignItems: 'center', paddingHorizontal: 8 },
  vsText: { fontSize: 12, fontWeight: '700', color: '#888' },
  moveCount: { fontSize: 10, color: '#666', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f0f0f0', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 20 },
});
