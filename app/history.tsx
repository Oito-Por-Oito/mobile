import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/lib/auth-context';

type GameRecord = {
  id: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  time_control: string;
  move_count: number;
  end_reason: string;
  played_as: 'white' | 'black';
  created_at: string;
  rating_change?: number;
};

const RESULT_CONFIG = {
  win:  { label: 'Vitória',  color: '#22c55e', bg: '#22c55e20', icon: '✓' },
  loss: { label: 'Derrota',  color: '#ef4444', bg: '#ef444420', icon: '✗' },
  draw: { label: 'Empate',   color: '#f59e0b', bg: '#f59e0b20', icon: '½' },
};

const FILTER_OPTIONS = ['Todas', 'Vitórias', 'Derrotas', 'Empates'];

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Todas');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const fetchGames = useCallback(async (reset = false) => {
    if (!user) return;
    const currentPage = reset ? 0 : page;
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          id, time_control, move_count, end_reason, status, created_at,
          white_player_id, black_player_id,
          white_player:profiles!games_white_player_id_fkey(username),
          black_player:profiles!games_black_player_id_fkey(username)
        `)
        .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
        .in('status', ['completed', 'resigned', 'timeout', 'draw'])
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (!error && data) {
        const mapped: GameRecord[] = data.map((g: any) => {
          const isWhite = g.white_player_id === user.id;
          const opponent = isWhite ? (g.black_player?.username ?? 'Anônimo') : (g.white_player?.username ?? 'Anônimo');
          let result: 'win' | 'loss' | 'draw' = 'draw';
          if (g.status === 'draw') result = 'draw';
          else if ((g.status === 'completed' && isWhite) || (g.status === 'resigned' && !isWhite) || (g.status === 'timeout' && !isWhite)) result = 'win';
          else result = 'loss';
          return {
            id: g.id,
            opponent,
            result,
            time_control: g.time_control ?? '10+0',
            move_count: g.move_count ?? 0,
            end_reason: g.end_reason ?? g.status ?? 'desconhecido',
            played_as: isWhite ? 'white' : 'black',
            created_at: g.created_at,
          };
        });
        if (reset) setGames(mapped);
        else setGames(prev => [...prev, ...mapped]);
        setHasMore(data.length === PAGE_SIZE);
        if (!reset) setPage(currentPage + 1);
      }
    } catch (e) {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, page]);

  useEffect(() => { fetchGames(true); }, [user]);

  const onRefresh = () => { setRefreshing(true); setPage(0); fetchGames(true); };

  const filtered = games.filter(g => {
    if (filter === 'Vitórias') return g.result === 'win';
    if (filter === 'Derrotas') return g.result === 'loss';
    if (filter === 'Empates') return g.result === 'draw';
    return true;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const renderGame = ({ item }: { item: GameRecord }) => {
    const cfg = RESULT_CONFIG[item.result];
    return (
      <TouchableOpacity
        style={styles.gameCard}
        onPress={() => router.push(`/game/${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={[styles.resultBar, { backgroundColor: cfg.color }]} />
        <View style={styles.gameContent}>
          <View style={styles.gameLeft}>
            <View style={[styles.resultBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.resultIcon, { color: cfg.color }]}>{cfg.icon}</Text>
              <Text style={[styles.resultLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={styles.opponent}>vs {item.opponent}</Text>
            <Text style={styles.gameDetail}>{item.played_as === 'white' ? '♔ Brancas' : '♚ Pretas'} · {item.move_count} lances</Text>
          </View>
          <View style={styles.gameRight}>
            <Text style={styles.timeControl}>{item.time_control}</Text>
            <Text style={styles.gameDate}>{formatDate(item.created_at)}</Text>
            <Text style={styles.endReason}>{item.end_reason}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const wins = games.filter(g => g.result === 'win').length;
  const losses = games.filter(g => g.result === 'loss').length;
  const draws = games.filter(g => g.result === 'draw').length;
  const total = games.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <ScreenContainer>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderGame}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4a843" />}
        onEndReached={() => { if (hasMore && !loading) fetchGames(); }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Text style={styles.backText}>← Voltar</Text>
              </TouchableOpacity>
              <Text style={styles.title}>📋 Histórico</Text>
            </View>

            {/* Stats summary */}
            {!loading && total > 0 && (
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{total}</Text>
                  <Text style={styles.statLabel}>Partidas</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#22c55e' }]}>{wins}</Text>
                  <Text style={styles.statLabel}>Vitórias</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#ef4444' }]}>{losses}</Text>
                  <Text style={styles.statLabel}>Derrotas</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#d4a843' }]}>{winRate}%</Text>
                  <Text style={styles.statLabel}>Win Rate</Text>
                </View>
              </View>
            )}

            {/* Filters */}
            <View style={styles.filters}>
              {FILTER_OPTIONS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#d4a843" style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>Nenhuma partida encontrada</Text>
              <Text style={styles.emptyDesc}>Jogue sua primeira partida para ver o histórico aqui.</Text>
            </View>
          )
        }
        ListFooterComponent={hasMore && !loading ? <ActivityIndicator color="#d4a843" style={{ margin: 16 }} /> : null}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#d4a843', fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' },
  statsCard: {
    backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#3a3a3a',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#f0f0f0' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#3a3a3a' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2c2c2c', alignItems: 'center', borderWidth: 1, borderColor: '#3a3a3a' },
  filterBtnActive: { backgroundColor: '#d4a84320', borderColor: '#d4a843' },
  filterText: { fontSize: 12, color: '#888', fontWeight: '600' },
  filterTextActive: { color: '#d4a843' },
  gameCard: {
    flexDirection: 'row', backgroundColor: '#2c2c2c', borderRadius: 12, marginHorizontal: 16,
    marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#3a3a3a',
  },
  resultBar: { width: 4 },
  gameContent: { flex: 1, flexDirection: 'row', padding: 12, justifyContent: 'space-between' },
  gameLeft: { flex: 1 },
  resultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  resultIcon: { fontSize: 12, fontWeight: '800' },
  resultLabel: { fontSize: 12, fontWeight: '700' },
  opponent: { fontSize: 14, fontWeight: '600', color: '#f0f0f0', marginBottom: 2 },
  gameDetail: { fontSize: 12, color: '#888' },
  gameRight: { alignItems: 'flex-end', gap: 2 },
  timeControl: { fontSize: 13, fontWeight: '700', color: '#d4a843' },
  gameDate: { fontSize: 11, color: '#888' },
  endReason: { fontSize: 10, color: '#666', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f0f0f0', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
});
