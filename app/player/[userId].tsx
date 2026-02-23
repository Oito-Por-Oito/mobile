import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { usePublicProfile, usePlayerGames } from '@/hooks/supabase/use-public-profile';
import { useSupabaseAuth } from '@/lib/auth-context';
import { useFriendship, type FriendshipStatus } from '@/hooks/supabase/use-friendship';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRatingTier(rating: number) {
  if (rating >= 2400) return { label: 'Mestre Internacional', color: '#a855f7', icon: '👑' };
  if (rating >= 2000) return { label: 'Mestre', color: '#d4a843', icon: '⭐' };
  if (rating >= 1800) return { label: 'Experiente', color: '#3b82f6', icon: '💎' };
  if (rating >= 1600) return { label: 'Avançado', color: '#22c55e', icon: '🔥' };
  if (rating >= 1400) return { label: 'Intermediário', color: '#f59e0b', icon: '⚔️' };
  if (rating >= 1200) return { label: 'Iniciante', color: '#6b7280', icon: '🌱' };
  return { label: 'Novato', color: '#9a9a9a', icon: '♟' };
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function resultReasonLabel(reason: string): string {
  const map: Record<string, string> = {
    checkmate: 'Xeque-mate',
    resignation: 'Desistência',
    timeout: 'Tempo esgotado',
    stalemate: 'Afogamento',
    draw_agreement: 'Acordo de empate',
    insufficient_material: 'Material insuficiente',
    repetition: 'Repetição',
    unknown: 'Fim de jogo',
  };
  return map[reason] ?? reason;
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function WinRateBar({ wins, draws, losses }: { wins: number; draws: number; losses: number }) {
  const total = wins + draws + losses;
  if (total === 0) return null;

  const wPct = (wins / total) * 100;
  const dPct = (draws / total) * 100;
  const lPct = (losses / total) * 100;

  return (
    <View style={styles.winRateSection}>
      <View style={styles.winRateBarRow}>
        {wPct > 0 && (
          <View style={[styles.winRateSegment, { flex: wPct, backgroundColor: '#22c55e', borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }]} />
        )}
        {dPct > 0 && (
          <View style={[styles.winRateSegment, { flex: dPct, backgroundColor: '#f59e0b' }]} />
        )}
        {lPct > 0 && (
          <View style={[styles.winRateSegment, { flex: lPct, backgroundColor: '#ef4444', borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
        )}
      </View>
      <View style={styles.winRateLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>{wins} vitórias ({Math.round(wPct)}%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>{draws} empates ({Math.round(dPct)}%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>{losses} derrotas ({Math.round(lPct)}%)</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Rating card ──────────────────────────────────────────────────────────────

function RatingCard({ label, icon, rating, active, onPress }: {
  label: string; icon: string; rating: number;
  active: boolean; onPress: () => void;
}) {
  const tier = getRatingTier(rating);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.ratingCard, active && styles.ratingCardActive]}
    >
      <Text style={styles.ratingCardIcon}>{icon}</Text>
      <Text style={[styles.ratingCardValue, active && { color: '#d4a843' }]}>{rating}</Text>
      <Text style={styles.ratingCardLabel}>{label}</Text>
      <View style={[styles.tierPill, { backgroundColor: tier.color + '22' }]}>
        <Text style={[styles.tierPillText, { color: tier.color }]}>{tier.icon}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Game history item ────────────────────────────────────────────────────────

function GameItem({ game, onPress }: {
  game: ReturnType<typeof usePlayerGames>['games'][0];
  onPress: () => void;
}) {
  const resultColor = game.playerResult === 'win'
    ? '#22c55e'
    : game.playerResult === 'draw'
    ? '#f59e0b'
    : '#ef4444';

  const resultLabel = game.playerResult === 'win' ? 'Vitória'
    : game.playerResult === 'draw' ? 'Empate' : 'Derrota';

  const colorIcon = game.playerColor === 'white' ? '⬜' : '⬛';

  return (
    <TouchableOpacity
      style={styles.gameItem}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Result stripe */}
      <View style={[styles.gameResultStripe, { backgroundColor: resultColor }]} />

      {/* Content */}
      <View style={styles.gameContent}>
        {/* Top row */}
        <View style={styles.gameTopRow}>
          <View style={styles.gameOpponentRow}>
            <View style={styles.gameOpponentAvatar}>
              <Text style={styles.gameOpponentAvatarText}>
                {(game.opponent?.display_name ?? game.opponent?.username ?? '?')[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.gameOpponentName} numberOfLines={1}>
                {game.opponent?.display_name ?? game.opponent?.username ?? 'Desconhecido'}
              </Text>
              <Text style={styles.gameOpponentRating}>
                {colorIcon} {game.opponentRating} ELO
              </Text>
            </View>
          </View>

          <View style={styles.gameRightCol}>
            <View style={[styles.gameResultBadge, { backgroundColor: resultColor + '22' }]}>
              <Text style={[styles.gameResultText, { color: resultColor }]}>{resultLabel}</Text>
            </View>
            <View style={styles.replayBadge}>
              <Text style={styles.replayBadgeText}>▶ Replay</Text>
            </View>
          </View>
        </View>

        {/* Bottom row */}
        <View style={styles.gameBottomRow}>
          <Text style={styles.gameMeta}>🕐 {game.time_control}</Text>
          <Text style={styles.gameMeta}>⏱ {formatDuration(game.durationSeconds)}</Text>
          <Text style={styles.gameMeta}>📋 {resultReasonLabel(game.result_reason)}</Text>
          <Text style={styles.gameMeta}>{formatDate(game.started_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Botão de amizade ────────────────────────────────────────────────────────

function FriendshipButton({
  status,
  loading,
  onSend,
  onCancel,
  onAccept,
  onDecline,
  onRemove,
}: {
  status: FriendshipStatus;
  loading: boolean;
  onSend: () => void;
  onCancel: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onRemove: () => void;
}) {
  if (loading) {
    return (
      <View style={styles.friendBtnRow}>
        <View style={[styles.friendBtn, styles.friendBtnPrimary, { opacity: 0.6 }]}>
          <ActivityIndicator size="small" color="#1e1e1e" />
        </View>
      </View>
    );
  }

  if (status === 'none' || status === 'declined') {
    return (
      <View style={styles.friendBtnRow}>
        <TouchableOpacity style={[styles.friendBtn, styles.friendBtnPrimary]} onPress={onSend} activeOpacity={0.8}>
          <Text style={styles.friendBtnPrimaryText}>➕ Adicionar Amigo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'pending_sent') {
    return (
      <View style={styles.friendBtnRow}>
        <View style={[styles.friendBtn, styles.friendBtnMuted]}>
          <Text style={styles.friendBtnMutedText}>⏳ Solicitação Enviada</Text>
        </View>
        <TouchableOpacity style={[styles.friendBtn, styles.friendBtnOutline]} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.friendBtnOutlineText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'pending_received') {
    return (
      <View style={styles.friendBtnRow}>
        <TouchableOpacity style={[styles.friendBtn, styles.friendBtnPrimary]} onPress={onAccept} activeOpacity={0.8}>
          <Text style={styles.friendBtnPrimaryText}>✅ Aceitar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.friendBtn, styles.friendBtnDanger]} onPress={onDecline} activeOpacity={0.8}>
          <Text style={styles.friendBtnDangerText}>✕ Recusar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // accepted
  return (
    <View style={styles.friendBtnRow}>
      <View style={[styles.friendBtn, styles.friendBtnSuccess]}>
        <Text style={styles.friendBtnSuccessText}>✓ Amigos</Text>
      </View>
      <TouchableOpacity style={[styles.friendBtn, styles.friendBtnOutline]} onPress={onRemove} activeOpacity={0.8}>
        <Text style={styles.friendBtnOutlineText}>Remover</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

type ActiveMode = 'blitz' | 'rapid' | 'classical';

export default function PlayerProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { profile: myProfile } = useSupabaseAuth();

  const { profile, loading: profileLoading, error: profileError } = usePublicProfile(userId ?? null);
  const { games, loading: gamesLoading, refreshing, loadingMore, hasMore, error: gamesError, refresh, loadMore } = usePlayerGames(profile?.id ?? null);

  const [activeMode, setActiveMode] = useState<ActiveMode>('blitz');

  const isOwnProfile = myProfile?.user_id === userId;

  const {
    status: friendStatus,
    loading: friendLoading,
    actionLoading: friendActionLoading,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriendship(userId ?? null);

  const activeRating = useMemo(() => {
    if (!profile) return 800;
    return activeMode === 'blitz' ? profile.rating_blitz
      : activeMode === 'rapid' ? profile.rating_rapid
      : profile.rating_classical;
  }, [profile, activeMode]);

  const tier = useMemo(() => getRatingTier(activeRating), [activeRating]);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return '—';
    return new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [profile]);

  const renderGame = useCallback(
    ({ item }: { item: typeof games[0] }) => (
      <GameItem
        game={item}
        onPress={() => router.push(`/game/${item.id}` as any)}
      />
    ),
    [router]
  );

  const keyExtractor = useCallback((item: typeof games[0]) => item.id, []);

  const ListHeader = useMemo(() => {
    if (profileLoading || !profile) return null;

    return (
      <View>
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>
              {(profile.display_name ?? profile.username ?? '?')[0].toUpperCase()}
            </Text>
          </View>

          <Text style={styles.heroName}>{profile.display_name ?? profile.username}</Text>
          {profile.username && profile.display_name !== profile.username && (
            <Text style={styles.heroUsername}>@{profile.username}</Text>
          )}

          <View style={[styles.heroTierBadge, { backgroundColor: tier.color + '22' }]}>
            <Text style={[styles.heroTierText, { color: tier.color }]}>
              {tier.icon} {tier.label}
            </Text>
          </View>

          {profile.bio ? (
            <Text style={styles.heroBio}>{profile.bio}</Text>
          ) : null}

          <View style={styles.heroMeta}>
            {profile.streak_days > 0 && (
              <View style={styles.heroMetaItem}>
                <Text style={styles.heroMetaIcon}>🔥</Text>
                <Text style={styles.heroMetaText}>{profile.streak_days} dias seguidos</Text>
              </View>
            )}
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaIcon}>📅</Text>
              <Text style={styles.heroMetaText}>Membro desde {memberSince}</Text>
            </View>
            {profile.puzzles_solved > 0 && (
              <View style={styles.heroMetaItem}>
                <Text style={styles.heroMetaIcon}>🧩</Text>
                <Text style={styles.heroMetaText}>{profile.puzzles_solved} puzzles</Text>
              </View>
            )}
          </View>

          {isOwnProfile ? (
            <TouchableOpacity
              onPress={() => router.push('/profile' as any)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>✏️ Editar Perfil</Text>
            </TouchableOpacity>
          ) : !friendLoading && (
            <FriendshipButton
              status={friendStatus}
              loading={friendActionLoading}
              onSend={sendRequest}
              onCancel={cancelRequest}
              onAccept={acceptRequest}
              onDecline={declineRequest}
              onRemove={() => {
                Alert.alert(
                  'Remover Amigo',
                  `Deseja remover ${profile.display_name ?? profile.username} da sua lista de amigos?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Remover', style: 'destructive', onPress: removeFriend },
                  ]
                );
              }}
            />
          )}
        </View>

        {/* ── Ratings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RATINGS</Text>
          <View style={styles.ratingCards}>
            <RatingCard label="Blitz" icon="⚡" rating={profile.rating_blitz}
              active={activeMode === 'blitz'} onPress={() => setActiveMode('blitz')} />
            <RatingCard label="Rápido" icon="🕐" rating={profile.rating_rapid}
              active={activeMode === 'rapid'} onPress={() => setActiveMode('rapid')} />
            <RatingCard label="Clássico" icon="♟" rating={profile.rating_classical}
              active={activeMode === 'classical'} onPress={() => setActiveMode('classical')} />
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESTATÍSTICAS</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Partidas', value: profile.total_games, icon: '🎮' },
              { label: 'Vitórias', value: profile.wins, icon: '✅', color: '#22c55e' },
              { label: 'Derrotas', value: profile.losses, icon: '❌', color: '#ef4444' },
              { label: 'Empates', value: profile.draws, icon: '🤝', color: '#f59e0b' },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statCardIcon}>{s.icon}</Text>
                <Text style={[styles.statCardValue, s.color ? { color: s.color } : {}]}>{s.value}</Text>
                <Text style={styles.statCardLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Win rate bar */}
          <View style={styles.winRateCard}>
            <Text style={styles.winRateTitle}>Distribuição de Resultados</Text>
            <WinRateBar wins={profile.wins} draws={profile.draws} losses={profile.losses} />
          </View>

          {/* Accuracy */}
          {profile.accuracy > 0 && (
            <View style={styles.accuracyCard}>
              <View style={styles.accuracyLeft}>
                <Text style={styles.accuracyIcon}>🎯</Text>
                <View>
                  <Text style={styles.accuracyLabel}>Precisão Média</Text>
                  <Text style={styles.accuracySubLabel}>Baseada em análise de partidas</Text>
                </View>
              </View>
              <Text style={styles.accuracyValue}>{Number(profile.accuracy).toFixed(1)}%</Text>
            </View>
          )}
        </View>

        {/* ── Game history header ── */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>HISTÓRICO DE PARTIDAS</Text>
            <Text style={styles.historyCount}>{games.length} partidas</Text>
          </View>
        </View>
      </View>
    );
  }, [profile, profileLoading, activeMode, tier, memberSince, isOwnProfile, games.length, router]);

  const ListFooter = useMemo(() => (
    loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#d4a843" />
        <Text style={styles.footerText}>Carregando mais partidas...</Text>
      </View>
    ) : !hasMore && games.length > 0 ? (
      <View style={styles.footerLoader}>
        <Text style={styles.footerText}>— Todas as partidas carregadas —</Text>
      </View>
    ) : null
  ), [loadingMore, hasMore, games.length]);

  const ListEmpty = useMemo(() => (
    !gamesLoading ? (
      <View style={styles.emptyGames}>
        <Text style={styles.emptyIcon}>♟</Text>
        <Text style={styles.emptyTitle}>Nenhuma partida ainda</Text>
        <Text style={styles.emptySubtitle}>As partidas concluídas aparecerão aqui.</Text>
      </View>
    ) : (
      <View style={styles.emptyGames}>
        <ActivityIndicator size="small" color="#d4a843" />
        <Text style={styles.emptySubtitle}>Carregando partidas...</Text>
      </View>
    )
  ), [gamesLoading]);

  // ── Loading / Error states ──
  if (profileLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#d4a843" />
          <Text style={styles.loaderText}>Carregando perfil...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (profileError || !profile) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>
        <View style={styles.centerLoader}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{profileError ?? 'Jogador não encontrado'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Fixed header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {profile.display_name ?? profile.username}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={games}
        renderItem={renderGame}
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
    </ScreenContainer>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: { paddingBottom: 40 },

  // Fixed header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#3a3a3a',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { color: '#9a9a9a', fontSize: 24 },
  headerTitle: { color: '#f0f0f0', fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },

  // Hero section
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#3a3a3a',
  },
  heroAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2c2c2c',
    borderWidth: 3,
    borderColor: '#d4a843',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroAvatarText: { color: '#d4a843', fontSize: 36, fontWeight: 'bold' },
  heroName: { color: '#f0f0f0', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  heroUsername: { color: '#9a9a9a', fontSize: 14, marginBottom: 10 },
  heroTierBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 12,
  },
  heroTierText: { fontSize: 13, fontWeight: '600' },
  heroBio: {
    color: '#9a9a9a',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 16 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaIcon: { fontSize: 14 },
  heroMetaText: { color: '#9a9a9a', fontSize: 12 },
  editButton: {
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  editButtonText: { color: '#d4a843', fontSize: 13, fontWeight: '600' },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4, marginBottom: 4 },
  sectionTitle: {
    color: '#d4a843',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Rating cards
  ratingCards: { flexDirection: 'row', gap: 10 },
  ratingCard: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3a3a3a',
    gap: 4,
  },
  ratingCardActive: {
    borderColor: '#d4a843',
    backgroundColor: '#d4a843' + '12',
  },
  ratingCardIcon: { fontSize: 20 },
  ratingCardValue: { color: '#f0f0f0', fontSize: 20, fontWeight: 'bold' },
  ratingCardLabel: { color: '#9a9a9a', fontSize: 11 },
  tierPill: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  tierPillText: { fontSize: 12 },

  // Stats grid
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    gap: 4,
  },
  statCardIcon: { fontSize: 18 },
  statCardValue: { color: '#f0f0f0', fontSize: 18, fontWeight: 'bold' },
  statCardLabel: { color: '#9a9a9a', fontSize: 10 },

  // Win rate bar
  winRateCard: {
    backgroundColor: '#2c2c2c',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  winRateTitle: { color: '#f0f0f0', fontSize: 13, fontWeight: '600', marginBottom: 12 },
  winRateSection: { gap: 10 },
  winRateBarRow: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  winRateSegment: { height: '100%' },
  winRateLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#9a9a9a', fontSize: 12 },

  // Accuracy
  accuracyCard: {
    backgroundColor: '#2c2c2c',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accuracyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accuracyIcon: { fontSize: 24 },
  accuracyLabel: { color: '#f0f0f0', fontSize: 14, fontWeight: '600' },
  accuracySubLabel: { color: '#9a9a9a', fontSize: 11, marginTop: 2 },
  accuracyValue: { color: '#d4a843', fontSize: 24, fontWeight: 'bold' },

  // History header
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyCount: { color: '#666', fontSize: 12 },

  // Game item
  gameItem: {
    flexDirection: 'row',
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  gameResultStripe: { width: 4 },
  gameContent: { flex: 1, padding: 12, gap: 8 },
  gameTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameOpponentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  gameOpponentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  gameOpponentAvatarText: { color: '#d4a843', fontSize: 14, fontWeight: 'bold' },
  gameOpponentName: { color: '#f0f0f0', fontSize: 14, fontWeight: '600' },
  gameOpponentRating: { color: '#9a9a9a', fontSize: 11, marginTop: 1 },
  gameResultBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  gameResultText: { fontSize: 12, fontWeight: '700' },
  gameBottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gameMeta: { color: '#666', fontSize: 11 },

  // Footer
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: { color: '#666', fontSize: 12 },

  // Empty
  emptyGames: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { color: '#f0f0f0', fontSize: 15, fontWeight: '600' },
  emptySubtitle: { color: '#9a9a9a', fontSize: 13, textAlign: 'center' },

  // Center loader / error
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  loaderText: { color: '#9a9a9a', fontSize: 14 },
  errorIcon: { fontSize: 40 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#d4a843',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryText: { color: '#1e1e1e', fontWeight: '600', fontSize: 14 },

  // Friendship buttons
  friendBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  friendBtn: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendBtnPrimary: { backgroundColor: '#d4a843' },
  friendBtnPrimaryText: { color: '#1e1e1e', fontWeight: '700', fontSize: 14 },
  friendBtnMuted: { backgroundColor: '#2c2c2c', borderWidth: 1, borderColor: '#4a4a4a' },
  friendBtnMutedText: { color: '#9a9a9a', fontSize: 13 },
  friendBtnOutline: { borderWidth: 1.5, borderColor: '#4a4a4a', backgroundColor: 'transparent' },
  friendBtnOutlineText: { color: '#9a9a9a', fontSize: 13 },
  friendBtnDanger: { backgroundColor: '#ef444422', borderWidth: 1, borderColor: '#ef4444' },
  friendBtnDangerText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  friendBtnSuccess: { backgroundColor: '#22c55e22', borderWidth: 1, borderColor: '#22c55e' },
  friendBtnSuccessText: { color: '#22c55e', fontWeight: '600', fontSize: 14 },

  // Replay badge
  gameRightCol: { alignItems: 'flex-end', gap: 4 },
  replayBadge: {
    backgroundColor: '#d4a84322',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#d4a84366',
  },
  replayBadgeText: { color: '#d4a843', fontSize: 11, fontWeight: '600' },
});
