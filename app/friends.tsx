import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useFriends, type FriendEntry } from '@/hooks/supabase/use-friendship';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastActive(iso: string | null): string {
  if (!iso) return 'Nunca ativo';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora mesmo';
  if (mins < 60) return `Há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Há ${days} dia${days > 1 ? 's' : ''}`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function getRatingTier(rating: number): { color: string; icon: string } {
  if (rating >= 2400) return { color: '#a855f7', icon: '👑' };
  if (rating >= 2000) return { color: '#d4a843', icon: '⭐' };
  if (rating >= 1800) return { color: '#3b82f6', icon: '💎' };
  if (rating >= 1600) return { color: '#22c55e', icon: '🔥' };
  if (rating >= 1400) return { color: '#f59e0b', icon: '⚔️' };
  if (rating >= 1200) return { color: '#6b7280', icon: '🌱' };
  return { color: '#9a9a9a', icon: '♟' };
}

// ─── Card de amigo ────────────────────────────────────────────────────────────

function FriendCard({
  entry,
  type,
  onAccept,
  onDecline,
  onRemove,
  onCancel,
  onPress,
}: {
  entry: FriendEntry;
  type: 'friend' | 'received' | 'sent';
  onAccept?: () => void;
  onDecline?: () => void;
  onRemove?: () => void;
  onCancel?: () => void;
  onPress: () => void;
}) {
  const { profile } = entry;
  const tier = getRatingTier(profile.rating_blitz);
  const winRate = profile.total_games > 0
    ? Math.round((profile.wins / profile.total_games) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Avatar */}
      <View style={[styles.avatar, { borderColor: tier.color }]}>
        <Text style={[styles.avatarText, { color: tier.color }]}>
          {(profile.display_name ?? profile.username ?? '?')[0].toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {profile.display_name ?? profile.username}
          </Text>
          <Text style={styles.tierIcon}>{tier.icon}</Text>
        </View>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta}>⚡ {profile.rating_blitz}</Text>
          <Text style={styles.cardMeta}>🎮 {profile.total_games}</Text>
          <Text style={styles.cardMeta}>✅ {winRate}%</Text>
          {profile.streak_days > 0 && (
            <Text style={styles.cardMeta}>🔥 {profile.streak_days}d</Text>
          )}
        </View>
        {type === 'friend' && (
          <Text style={styles.cardLastActive}>{formatLastActive(profile.last_active_at)}</Text>
        )}
        {type === 'received' && (
          <Text style={styles.cardPendingLabel}>📨 Quer ser seu amigo</Text>
        )}
        {type === 'sent' && (
          <Text style={styles.cardPendingLabel}>⏳ Aguardando resposta</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        {type === 'friend' && (
          <TouchableOpacity style={styles.actionBtnDanger} onPress={onRemove}>
            <Text style={styles.actionBtnDangerText}>✕</Text>
          </TouchableOpacity>
        )}
        {type === 'received' && (
          <>
            <TouchableOpacity style={styles.actionBtnAccept} onPress={onAccept}>
              <Text style={styles.actionBtnAcceptText}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtnDanger} onPress={onDecline}>
              <Text style={styles.actionBtnDangerText}>✕</Text>
            </TouchableOpacity>
          </>
        )}
        {type === 'sent' && (
          <TouchableOpacity style={styles.actionBtnCancel} onPress={onCancel}>
            <Text style={styles.actionBtnCancelText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

type Tab = 'friends' | 'received' | 'sent';

export default function FriendsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('friends');

  const {
    friends,
    received,
    sent,
    loading,
    refreshing,
    error,
    refresh,
    acceptRequest,
    declineRequest,
    removeFriend,
    cancelRequest,
    totalPending,
  } = useFriends();

  const currentList: FriendEntry[] =
    activeTab === 'friends' ? friends
    : activeTab === 'received' ? received
    : sent;

  const renderItem = useCallback(({ item }: { item: FriendEntry }) => (
    <FriendCard
      entry={item}
      type={activeTab === 'friends' ? 'friend' : activeTab === 'received' ? 'received' : 'sent'}
      onPress={() => router.push(`/player/${item.profile.user_id}` as any)}
      onAccept={() => acceptRequest(item.friendship.id)}
      onDecline={() => {
        Alert.alert(
          'Recusar Solicitação',
          `Recusar solicitação de ${item.profile.display_name ?? item.profile.username}?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Recusar', style: 'destructive', onPress: () => declineRequest(item.friendship.id) },
          ]
        );
      }}
      onRemove={() => {
        Alert.alert(
          'Remover Amigo',
          `Remover ${item.profile.display_name ?? item.profile.username} da sua lista de amigos?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: () => removeFriend(item.friendship.id) },
          ]
        );
      }}
      onCancel={() => {
        Alert.alert(
          'Cancelar Solicitação',
          `Cancelar solicitação enviada para ${item.profile.display_name ?? item.profile.username}?`,
          [
            { text: 'Não', style: 'cancel' },
            { text: 'Cancelar', style: 'destructive', onPress: () => cancelRequest(item.friendship.id) },
          ]
        );
      }}
    />
  ), [activeTab, router, acceptRequest, declineRequest, removeFriend, cancelRequest]);

  const keyExtractor = useCallback((item: FriendEntry) => item.friendship.id, []);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'friends', label: 'Amigos', count: friends.length },
    { key: 'received', label: 'Recebidas', count: received.length },
    { key: 'sent', label: 'Enviadas', count: sent.length },
  ];

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Amigos</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {(tab.count ?? 0) > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#d4a843" />
          <Text style={styles.loaderText}>Carregando amigos...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerLoader}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={currentList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#d4a843"
              colors={['#d4a843']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {activeTab === 'friends' ? '👥' : activeTab === 'received' ? '📨' : '📤'}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'friends' ? 'Nenhum amigo ainda'
                  : activeTab === 'received' ? 'Nenhuma solicitação recebida'
                  : 'Nenhuma solicitação enviada'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'friends'
                  ? 'Visite o perfil de outros jogadores no ranking e adicione-os como amigos.'
                  : activeTab === 'received'
                  ? 'Quando alguém te enviar uma solicitação, ela aparecerá aqui.'
                  : 'Visite o perfil de um jogador e toque em "Adicionar Amigo".'}
              </Text>
              {activeTab === 'friends' && (
                <TouchableOpacity
                  style={styles.goToRankingBtn}
                  onPress={() => router.push('/ranking' as any)}
                >
                  <Text style={styles.goToRankingText}>Ver Ranking</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </ScreenContainer>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
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

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#3a3a3a',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabActive: { borderBottomColor: '#d4a843' },
  tabText: { color: '#9a9a9a', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#d4a843', fontWeight: '700' },
  tabBadge: {
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: '#d4a843' },
  tabBadgeText: { color: '#9a9a9a', fontSize: 11, fontWeight: '600' },
  tabBadgeTextActive: { color: '#1e1e1e' },

  // List
  listContent: { paddingTop: 8, paddingBottom: 40 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e1e1e',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  cardInfo: { flex: 1, gap: 4 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { color: '#f0f0f0', fontSize: 15, fontWeight: '600', flex: 1 },
  tierIcon: { fontSize: 14 },
  cardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardMeta: { color: '#9a9a9a', fontSize: 11 },
  cardLastActive: { color: '#666', fontSize: 11, marginTop: 2 },
  cardPendingLabel: { color: '#d4a843', fontSize: 11, marginTop: 2 },

  // Card actions
  cardActions: { flexDirection: 'column', gap: 6, flexShrink: 0 },
  actionBtnAccept: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#22c55e22',
    borderWidth: 1,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnAcceptText: { color: '#22c55e', fontSize: 16, fontWeight: 'bold' },
  actionBtnDanger: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ef444422',
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDangerText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold' },
  actionBtnCancel: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#4a4a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnCancelText: { color: '#9a9a9a', fontSize: 14 },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIcon: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { color: '#f0f0f0', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptySubtitle: { color: '#9a9a9a', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  goToRankingBtn: {
    backgroundColor: '#d4a843',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  goToRankingText: { color: '#1e1e1e', fontWeight: '700', fontSize: 14 },

  // Loader / error
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  loaderText: { color: '#9a9a9a', fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#d4a843',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { color: '#1e1e1e', fontWeight: '600', fontSize: 14 },
});
