import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useRanking, type GameMode, type RankingPlayer } from '@/hooks/supabase/use-ranking';
import { useSupabaseAuth } from '@/lib/auth-context';
import { useState } from 'react';

// ─── Constantes ──────────────────────────────────────────────────────────────

const MODES: { key: GameMode; label: string; icon: string; description: string }[] = [
  { key: 'blitz', label: 'Blitz', icon: '⚡', description: '3-5 min' },
  { key: 'rapid', label: 'Rápido', icon: '🕐', description: '10-15 min' },
  { key: 'classical', label: 'Clássico', icon: '♟', description: '30+ min' },
];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_ICONS = ['🥇', '🥈', '🥉'];

function getRatingTier(rating: number): { label: string; color: string; icon: string } {
  if (rating >= 2400) return { label: 'Mestre Internacional', color: '#a855f7', icon: '👑' };
  if (rating >= 2000) return { label: 'Mestre', color: '#d4a843', icon: '⭐' };
  if (rating >= 1800) return { label: 'Experiente', color: '#3b82f6', icon: '💎' };
  if (rating >= 1600) return { label: 'Avançado', color: '#22c55e', icon: '🔥' };
  if (rating >= 1400) return { label: 'Intermediário', color: '#f59e0b', icon: '⚔️' };
  if (rating >= 1200) return { label: 'Iniciante', color: '#6b7280', icon: '🌱' };
  return { label: 'Novato', color: '#9a9a9a', icon: '♟' };
}

// ─── Componente: Card do jogador ─────────────────────────────────────────────

function PlayerCard({
  player,
  isCurrentUser,
  onPress,
}: {
  player: RankingPlayer;
  isCurrentUser: boolean;
  onPress?: () => void;
}) {
  const tier = getRatingTier(player.rating);
  const isTop3 = player.rank <= 3;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        isCurrentUser && styles.cardHighlighted,
        isTop3 && styles.cardTop3,
      ]}
    >
      {/* Rank */}
      <View style={styles.rankContainer}>
        {isTop3 ? (
          <Text style={styles.rankIcon}>{RANK_ICONS[player.rank - 1]}</Text>
        ) : (
          <Text
            style={[
              styles.rankNumber,
              isCurrentUser && { color: '#d4a843' },
            ]}
          >
            #{player.rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          isTop3 && { borderColor: RANK_COLORS[player.rank - 1] },
          isCurrentUser && !isTop3 && { borderColor: '#d4a843' },
        ]}
      >
        <Text style={styles.avatarText}>
          {(player.display_name ?? player.username ?? '?')[0].toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.displayName, isCurrentUser && { color: '#d4a843' }]}
            numberOfLines={1}
          >
            {player.display_name ?? player.username}
            {isCurrentUser ? ' (você)' : ''}
          </Text>
          <View style={[styles.tierBadge, { backgroundColor: tier.color + '22' }]}>
            <Text style={[styles.tierText, { color: tier.color }]}>
              {tier.icon} {tier.label}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statItem}>
            🎮 {player.total_games} partidas
          </Text>
          <Text style={styles.statItem}>
            ✅ {player.winRate}% vitórias
          </Text>
          {player.streak_days > 0 && (
            <Text style={styles.statItem}>
              🔥 {player.streak_days}d
            </Text>
          )}
        </View>
      </View>

      {/* Rating */}
      <View style={styles.ratingContainer}>
        <Text
          style={[
            styles.ratingValue,
            isTop3 && { color: RANK_COLORS[player.rank - 1] },
            isCurrentUser && !isTop3 && { color: '#d4a843' },
          ]}
        >
          {player.rating}
        </Text>
        <Text style={styles.ratingLabel}>ELO</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Componente: Card da minha posição ───────────────────────────────────────

function MyPositionCard({
  myRank,
  mode,
}: {
  myRank: RankingPlayer;
  mode: GameMode;
}) {
  const tier = getRatingTier(myRank.rating);
  const modeLabel = MODES.find((m) => m.key === mode)?.label ?? '';

  return (
    <View style={styles.myPositionCard}>
      <View style={styles.myPositionHeader}>
        <Text style={styles.myPositionTitle}>Sua posição — {modeLabel}</Text>
        <View style={[styles.tierBadge, { backgroundColor: tier.color + '22' }]}>
          <Text style={[styles.tierText, { color: tier.color }]}>
            {tier.icon} {tier.label}
          </Text>
        </View>
      </View>

      <View style={styles.myPositionBody}>
        {/* Rank */}
        <View style={styles.myPositionStat}>
          <Text style={styles.myPositionStatValue}>#{myRank.rank}</Text>
          <Text style={styles.myPositionStatLabel}>Posição</Text>
        </View>

        <View style={styles.myPositionDivider} />

        {/* Rating */}
        <View style={styles.myPositionStat}>
          <Text style={[styles.myPositionStatValue, { color: '#d4a843' }]}>
            {myRank.rating}
          </Text>
          <Text style={styles.myPositionStatLabel}>Rating ELO</Text>
        </View>

        <View style={styles.myPositionDivider} />

        {/* Win rate */}
        <View style={styles.myPositionStat}>
          <Text style={styles.myPositionStatValue}>{myRank.winRate}%</Text>
          <Text style={styles.myPositionStatLabel}>Vitórias</Text>
        </View>

        <View style={styles.myPositionDivider} />

        {/* Games */}
        <View style={styles.myPositionStat}>
          <Text style={styles.myPositionStatValue}>{myRank.total_games}</Text>
          <Text style={styles.myPositionStatLabel}>Partidas</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function RankingScreen() {
  const router = useRouter();
  const { user, profile } = useSupabaseAuth();
  const [activeMode, setActiveMode] = useState<GameMode>('blitz');

  const {
    players,
    myRank,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    error,
    refresh,
    loadMore,
  } = useRanking(activeMode);

  const renderItem = useCallback(
    ({ item }: { item: RankingPlayer }) => (
      <PlayerCard
        player={item}
        isCurrentUser={!!profile && item.user_id === profile.user_id}
        onPress={() => router.push(`/player/${item.user_id}` as any)}
      />
    ),
    [profile, router]
  );

  const keyExtractor = useCallback((item: RankingPlayer) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🏆 Ranking</Text>
        </View>

        {/* Mode filter tabs */}
        <View style={styles.modeTabs}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.key}
              onPress={() => setActiveMode(m.key)}
              style={[
                styles.modeTab,
                activeMode === m.key && styles.modeTabActive,
              ]}
            >
              <Text style={styles.modeTabIcon}>{m.icon}</Text>
              <Text
                style={[
                  styles.modeTabLabel,
                  activeMode === m.key && styles.modeTabLabelActive,
                ]}
              >
                {m.label}
              </Text>
              <Text
                style={[
                  styles.modeTabDesc,
                  activeMode === m.key && { color: '#d4a843' },
                ]}
              >
                {m.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar jogador..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* My position card */}
        {myRank && !searchQuery && (
          <MyPositionCard myRank={myRank} mode={activeMode} />
        )}

        {/* Section label */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Top Jogadores'}
          </Text>
          {!loading && (
            <Text style={styles.sectionCount}>{players.length} jogadores</Text>
          )}
        </View>
      </View>
    ),
    [activeMode, searchQuery, myRank, loading, players.length, router]
  );

  const ListFooter = useMemo(
    () =>
      loadingMore ? (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#d4a843" />
          <Text style={styles.footerLoaderText}>Carregando mais...</Text>
        </View>
      ) : null,
    [loadingMore]
  );

  const ListEmpty = useMemo(
    () =>
      !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'Nenhum jogador encontrado' : 'Ranking vazio'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `Não encontramos jogadores com "${searchQuery}"`
              : 'Jogue partidas para aparecer no ranking!'}
          </Text>
        </View>
      ) : null,
    [loading, searchQuery]
  );

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {loading && players.length === 0 ? (
        <View style={styles.fullLoader}>
          {ListHeader}
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color="#d4a843" />
            <Text style={styles.loaderText}>Carregando ranking...</Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.fullLoader}>
          {ListHeader}
          <View style={styles.loaderCenter}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refresh} style={styles.retryButton}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={players}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#d4a843"
              colors={['#d4a843']}
            />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </ScreenContainer>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  backButton: { marginRight: 12 },
  backIcon: { color: '#9a9a9a', fontSize: 24 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#f0f0f0' },

  // Mode tabs
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: '#2c2c2c',
    borderWidth: 1.5,
    borderColor: '#4a4a4a',
  },
  modeTabActive: {
    backgroundColor: '#d4a843' + '18',
    borderColor: '#d4a843',
  },
  modeTabIcon: { fontSize: 20, marginBottom: 4 },
  modeTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9a9a9a',
    marginBottom: 2,
  },
  modeTabLabelActive: { color: '#d4a843' },
  modeTabDesc: { fontSize: 10, color: '#666' },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4a4a4a',
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: '#f0f0f0',
    fontSize: 15,
    padding: 0,
  },
  clearIcon: { color: '#666', fontSize: 16, padding: 4 },

  // My position card
  myPositionCard: {
    backgroundColor: '#2c2c2c',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#d4a843' + '60',
  },
  myPositionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  myPositionTitle: {
    color: '#f0f0f0',
    fontSize: 14,
    fontWeight: '600',
  },
  myPositionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  myPositionStat: { alignItems: 'center', flex: 1 },
  myPositionStatValue: {
    color: '#f0f0f0',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  myPositionStatLabel: { color: '#9a9a9a', fontSize: 11 },
  myPositionDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#4a4a4a',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#d4a843',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: { color: '#666', fontSize: 12 },

  // Player card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    gap: 10,
  },
  cardHighlighted: {
    borderColor: '#d4a843' + '80',
    backgroundColor: '#d4a843' + '0A',
  },
  cardTop3: {
    borderColor: '#4a4a4a',
  },

  // Rank
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  rankIcon: { fontSize: 22 },
  rankNumber: {
    color: '#9a9a9a',
    fontSize: 13,
    fontWeight: '600',
  },

  // Avatar
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3a3a3a',
    borderWidth: 2,
    borderColor: '#4a4a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#d4a843',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Info
  infoContainer: { flex: 1, gap: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  displayName: {
    color: '#f0f0f0',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  tierBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierText: { fontSize: 10, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statItem: { color: '#9a9a9a', fontSize: 11 },

  // Rating
  ratingContainer: { alignItems: 'center', minWidth: 52 },
  ratingValue: {
    color: '#f0f0f0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingLabel: { color: '#666', fontSize: 10, marginTop: 1 },

  // Footer loader
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: { color: '#9a9a9a', fontSize: 13 },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: {
    color: '#f0f0f0',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#9a9a9a',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },

  // Full loader / error
  fullLoader: { flex: 1 },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  loaderText: { color: '#9a9a9a', fontSize: 14 },
  errorIcon: { fontSize: 40 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  retryButton: {
    backgroundColor: '#d4a843',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryText: { color: '#1e1e1e', fontWeight: '600', fontSize: 14 },
});
