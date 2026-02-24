import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  TextInput, Modal, ScrollView, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';
import {
  usePuzzleProblems,
  type PuzzleDifficulty,
  type PuzzleFilters,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  THEME_LABELS,
} from '@/hooks/supabase/use-puzzle-problems';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const DIFFICULTIES: PuzzleDifficulty[] = ['easy', 'medium', 'hard', 'expert'];
const THEMES = Object.keys(THEME_LABELS);

// ─────────────────────────────────────────────────────────────────────────────
// Stats card
// ─────────────────────────────────────────────────────────────────────────────
function StatsCard({ stats }: { stats: NonNullable<ReturnType<typeof usePuzzleProblems>['stats']> }) {
  return (
    <View style={{
      backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 16,
      borderWidth: 1, borderColor: '#2a2a2a',
    }}>
      <Text style={{ color: '#d4a843', fontSize: 13, fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 }}>
        MEUS PUZZLES
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: '#d4a843', fontSize: 22, fontWeight: '700' }}>{stats.puzzle_rating}</Text>
          <Text style={{ color: '#666', fontSize: 11, marginTop: 2 }}>Rating</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#2a2a2a' }} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: '#22c55e', fontSize: 22, fontWeight: '700' }}>{stats.total_solved}</Text>
          <Text style={{ color: '#666', fontSize: 11, marginTop: 2 }}>Resolvidos</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#2a2a2a' }} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>
            {stats.accuracy_pct != null ? `${stats.accuracy_pct}%` : '—'}
          </Text>
          <Text style={{ color: '#666', fontSize: 11, marginTop: 2 }}>Precisão</Text>
        </View>
        <View style={{ width: 1, backgroundColor: '#2a2a2a' }} />
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: '#60a5fa', fontSize: 22, fontWeight: '700' }}>
            {stats.avg_time_secs != null ? `${Math.round(stats.avg_time_secs)}s` : '—'}
          </Text>
          <Text style={{ color: '#666', fontSize: 11, marginTop: 2 }}>Tempo médio</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Puzzle card
// ─────────────────────────────────────────────────────────────────────────────
function PuzzleCard({
  puzzle,
  onPress,
}: {
  puzzle: ReturnType<typeof usePuzzleProblems>['puzzles'][0];
  onPress: () => void;
}) {
  const diffColor = DIFFICULTY_COLORS[puzzle.difficulty] ?? '#888';
  const diffLabel = DIFFICULTY_LABELS[puzzle.difficulty] ?? puzzle.difficulty;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: '#1a1a1a',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: puzzle.user_solved ? 'rgba(34,197,94,0.3)' : '#2a2a2a',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Solved indicator */}
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: puzzle.user_solved ? 'rgba(34,197,94,0.15)' : '#242424',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 18 }}>
          {puzzle.user_solved ? '✓' : puzzle.user_attempts ? '↺' : '♟'}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 }} numberOfLines={1}>
            {puzzle.title}
          </Text>
          <View style={{
            backgroundColor: `${diffColor}22`, borderRadius: 6,
            paddingHorizontal: 7, paddingVertical: 2,
          }}>
            <Text style={{ color: diffColor, fontSize: 11, fontWeight: '600' }}>{diffLabel}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: '#d4a843', fontSize: 12 }}>★ {puzzle.rating}</Text>
          <Text style={{ color: '#555', fontSize: 12 }}>
            {puzzle.theme.slice(0, 2).map(t => THEME_LABELS[t] ?? t).join(' · ')}
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <Text style={{ color: '#444', fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter modal
// ─────────────────────────────────────────────────────────────────────────────
function FilterModal({
  visible,
  current,
  onApply,
  onClose,
}: {
  visible: boolean;
  current: PuzzleFilters;
  onApply: (f: PuzzleFilters) => void;
  onClose: () => void;
}) {
  const [diff, setDiff] = useState<PuzzleDifficulty | null>(current.difficulty ?? null);
  const [selThemes, setSelThemes] = useState<string[]>(current.themes ?? []);

  const toggleTheme = (t: string) => {
    setSelThemes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleApply = () => {
    onApply({ difficulty: diff ?? undefined, themes: selThemes.length ? selThemes : undefined });
    onClose();
  };

  const handleReset = () => {
    setDiff(null);
    setSelThemes([]);
    onApply({});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: 40, maxHeight: '80%',
      }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20 }}>Filtros</Text>

        {/* Difficulty */}
        <Text style={{ color: '#888', fontSize: 13, marginBottom: 10, fontWeight: '600' }}>DIFICULDADE</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {DIFFICULTIES.map(d => {
            const color = DIFFICULTY_COLORS[d];
            const selected = diff === d;
            return (
              <TouchableOpacity
                key={d}
                onPress={() => setDiff(selected ? null : d)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: selected ? `${color}22` : '#242424',
                  borderWidth: 1, borderColor: selected ? color : '#333',
                }}
              >
                <Text style={{ color: selected ? color : '#888', fontWeight: '600', fontSize: 13 }}>
                  {DIFFICULTY_LABELS[d]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Themes */}
        <Text style={{ color: '#888', fontSize: 13, marginBottom: 10, fontWeight: '600' }}>TEMAS</Text>
        <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {THEMES.map(t => {
              const selected = selThemes.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => toggleTheme(t)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                    backgroundColor: selected ? 'rgba(212,168,67,0.15)' : '#242424',
                    borderWidth: 1, borderColor: selected ? '#d4a843' : '#333',
                  }}
                >
                  <Text style={{ color: selected ? '#d4a843' : '#888', fontSize: 12 }}>
                    {THEME_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <TouchableOpacity
            onPress={handleReset}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              backgroundColor: '#242424', alignItems: 'center',
            }}
          >
            <Text style={{ color: '#888', fontWeight: '600' }}>Limpar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleApply}
            style={{
              flex: 2, paddingVertical: 14, borderRadius: 12,
              backgroundColor: '#d4a843', alignItems: 'center',
            }}
          >
            <Text style={{ color: '#000', fontWeight: '700' }}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PuzzleProblemsScreen() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [filterVisible, setFilterVisible] = useState(false);

  const {
    puzzles, stats, loading, refreshing, loadingMore, hasMore, error,
    filters, applyFilters, loadMore, refresh, getNextPuzzle,
  } = usePuzzleProblems();

  const activeFilterCount = [
    filters.difficulty,
    filters.themes?.length,
    filters.minRating,
    filters.maxRating,
  ].filter(Boolean).length;

  const handlePuzzlePress = useCallback((puzzle: typeof puzzles[0]) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/puzzle-solve', params: { puzzleId: puzzle.id } });
  }, [router]);

  const handlePlayNext = useCallback(async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = await getNextPuzzle();
    if (next) {
      router.push({ pathname: '/puzzle-solve', params: { puzzleId: next.id } });
    }
  }, [getNextPuzzle, router]);

  const renderItem = useCallback(({ item }: { item: typeof puzzles[0] }) => (
    <PuzzleCard puzzle={item} onPress={() => handlePuzzlePress(item)} />
  ), [handlePuzzlePress]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator color="#d4a843" />
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingTop: 8, paddingBottom: 12, gap: 12,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#d4a843', fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', flex: 1 }}>
          Problemas de Xadrez
        </Text>
        <TouchableOpacity
          onPress={() => setFilterVisible(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: activeFilterCount > 0 ? 'rgba(212,168,67,0.15)' : '#1a1a1a',
            borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
            borderWidth: 1, borderColor: activeFilterCount > 0 ? '#d4a843' : '#2a2a2a',
          }}
        >
          <Text style={{ color: activeFilterCount > 0 ? '#d4a843' : '#888', fontSize: 14 }}>⚙</Text>
          {activeFilterCount > 0 && (
            <View style={{
              backgroundColor: '#d4a843', borderRadius: 8,
              width: 16, height: 16, alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#000', fontSize: 10, fontWeight: '700' }}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#d4a843" size="large" />
          <Text style={{ color: '#666', marginTop: 12 }}>Carregando puzzles...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#ef4444', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>{error}</Text>
          <TouchableOpacity onPress={refresh} style={{
            backgroundColor: '#d4a843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
          }}>
            <Text style={{ color: '#000', fontWeight: '700' }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={puzzles}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
              {/* Stats card (only for logged in users) */}
              {user && stats && <StatsCard stats={stats} />}

              {/* Play next button */}
              <TouchableOpacity
                onPress={handlePlayNext}
                style={{
                  backgroundColor: '#d4a843', borderRadius: 14, paddingVertical: 14,
                  alignItems: 'center', marginBottom: 16, flexDirection: 'row',
                  justifyContent: 'center', gap: 8,
                }}
              >
                <Text style={{ fontSize: 18 }}>♟</Text>
                <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>
                  {user ? 'Próximo Puzzle Não Resolvido' : 'Resolver Puzzle Aleatório'}
                </Text>
              </TouchableOpacity>

              {/* Active filters chips */}
              {activeFilterCount > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {filters.difficulty && (
                    <View style={{
                      backgroundColor: `${DIFFICULTY_COLORS[filters.difficulty]}22`,
                      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
                      borderWidth: 1, borderColor: DIFFICULTY_COLORS[filters.difficulty],
                    }}>
                      <Text style={{ color: DIFFICULTY_COLORS[filters.difficulty], fontSize: 12, fontWeight: '600' }}>
                        {DIFFICULTY_LABELS[filters.difficulty]}
                      </Text>
                    </View>
                  )}
                  {filters.themes?.map(t => (
                    <View key={t} style={{
                      backgroundColor: 'rgba(212,168,67,0.1)', borderRadius: 8,
                      paddingHorizontal: 10, paddingVertical: 4,
                      borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)',
                    }}>
                      <Text style={{ color: '#d4a843', fontSize: 12 }}>{THEME_LABELS[t] ?? t}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Count */}
              <Text style={{ color: '#555', fontSize: 13, marginBottom: 10 }}>
                {puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''}
                {user ? ` · ${puzzles.filter(p => p.user_solved).length} resolvidos` : ''}
              </Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          onRefresh={refresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterModal
        visible={filterVisible}
        current={filters}
        onApply={applyFilters}
        onClose={() => setFilterVisible(false)}
      />
    </ScreenContainer>
  );
}
