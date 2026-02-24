import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';
import { usePuzzleRush, RushMode, LeaderPeriod } from '@/hooks/supabase/use-puzzle-rush';

const MODES: { id: RushMode; icon: string; label: string; desc: string; color: string }[] = [
  { id: '3min', icon: '⚡', label: '3 Minutos', desc: 'Máximo de puzzles em 3 min. Cada erro custa 10s.', color: '#f97316' },
  { id: '5min', icon: '🔥', label: '5 Minutos', desc: 'O modo clássico. 5 minutos para o maior score.', color: '#d4a843' },
  { id: 'survival', icon: '💀', label: 'Sobrevivência', desc: 'Sem timer, mas 3 erros e acabou. Até onde vai?', color: '#ef4444' },
];

const PERIODS: { id: LeaderPeriod; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'all', label: 'Todos' },
];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function PuzzleRushScreen() {
  const router = useRouter();
  const { user, profile } = useSupabaseAuth();
  const { personalBest, leaderboard, loading, loadPersonalBest, loadLeaderboard } = usePuzzleRush();

  const [selectedMode, setSelectedMode] = useState<RushMode>('5min');
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderPeriod>('all');

  const userRating = profile?.rating_blitz ?? 1200;

  useEffect(() => {
    if (user) loadPersonalBest(user.id, selectedMode);
  }, [user, selectedMode]);

  useEffect(() => {
    loadLeaderboard(selectedMode, selectedPeriod);
  }, [selectedMode, selectedPeriod]);

  const handleStart = useCallback(() => {
    if (!user) {
      router.push('/login' as any);
      return;
    }
    router.push({
      pathname: '/puzzle-rush-game' as any,
      params: { mode: selectedMode, userRating: String(userRating) },
    });
  }, [user, selectedMode, userRating]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>⚡ Corrida de Puzzles</Text>
            <Text style={styles.subtitle}>Resolva puzzles contra o relógio!</Text>
          </View>
        </View>

        {/* Recorde pessoal */}
        {user && (
          <View style={styles.recordCard}>
            <View style={styles.recordRow}>
              <View style={styles.recordItem}>
                <Text style={styles.recordValue}>
                  {personalBest?.best_score ?? 0}
                </Text>
                <Text style={styles.recordLabel}>Recorde ({selectedMode})</Text>
              </View>
              <View style={styles.recordDivider} />
              <View style={styles.recordItem}>
                <Text style={styles.recordValue}>
                  {personalBest?.best_time_s ? formatTime(personalBest.best_time_s) : '—'}
                </Text>
                <Text style={styles.recordLabel}>Melhor tempo</Text>
              </View>
              <View style={styles.recordDivider} />
              <View style={styles.recordItem}>
                <Text style={styles.recordValue}>
                  {personalBest?.total_sessions ?? 0}
                </Text>
                <Text style={styles.recordLabel}>Sessões</Text>
              </View>
            </View>
          </View>
        )}

        {/* Seleção de modo */}
        <Text style={styles.sectionTitle}>Escolha o Modo</Text>
        {MODES.map(m => (
          <TouchableOpacity
            key={m.id}
            onPress={() => setSelectedMode(m.id)}
            style={[styles.modeCard, selectedMode === m.id && { borderColor: m.color, borderWidth: 2 }]}
          >
            <Text style={styles.modeIcon}>{m.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modeLabel, selectedMode === m.id && { color: m.color }]}>{m.label}</Text>
              <Text style={styles.modeDesc}>{m.desc}</Text>
            </View>
            {selectedMode === m.id && (
              <View style={[styles.selectedBadge, { backgroundColor: m.color + '30' }]}>
                <Text style={[styles.selectedText, { color: m.color }]}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Regras */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>ℹ️ Como funciona</Text>
          <Text style={styles.rulesText}>• Puzzles aparecem um por vez, cada vez mais difíceis</Text>
          <Text style={styles.rulesText}>• Acerte para ganhar pontos e avançar para o próximo</Text>
          <Text style={styles.rulesText}>• Cada erro desconta 10s (cronometrado) ou 1 vida (sobrevivência)</Text>
          <Text style={styles.rulesText}>• Seu score é o número de puzzles resolvidos corretamente</Text>
        </View>

        {/* Botão de iniciar */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startText}>▶ Iniciar Corrida</Text>
        </TouchableOpacity>

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>🏆 Top Jogadores</Text>

        {/* Filtros de período */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setSelectedPeriod(p.id)}
              style={[styles.periodBtn, selectedPeriod === p.id && styles.periodBtnActive]}
            >
              <Text style={[styles.periodText, selectedPeriod === p.id && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color="#d4a843" style={{ marginVertical: 24 }} />
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma sessão registrada ainda.</Text>
            <Text style={styles.emptySubtext}>Seja o primeiro a jogar!</Text>
          </View>
        ) : (
          <View style={styles.leaderCard}>
            {leaderboard.map((entry, i) => (
              <View key={entry.user_id} style={[styles.leaderRow, i < leaderboard.length - 1 && styles.leaderRowBorder]}>
                <Text style={styles.rankText}>
                  {i < 3 ? RANK_MEDALS[i] : `${i + 1}`}
                </Text>
                {entry.avatar_url ? (
                  <Image source={{ uri: entry.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {(entry.display_name ?? 'J')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaderName}>{entry.display_name}</Text>
                  <Text style={styles.leaderSub}>
                    {entry.total_sessions} {entry.total_sessions === 1 ? 'sessão' : 'sessões'}
                    {entry.best_time_s ? ` · ${formatTime(entry.best_time_s)}` : ''}
                  </Text>
                </View>
                <Text style={styles.leaderScore}>{entry.best_score}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: 8 },
  backBtn: { marginRight: 12, padding: 4 },
  backText: { color: '#9a9a9a', fontSize: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#d4a843' },
  subtitle: { color: '#9a9a9a', fontSize: 13, marginTop: 2 },
  sectionTitle: { color: '#d4a843', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  recordCard: { backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#d4a84340' },
  recordRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  recordItem: { alignItems: 'center', flex: 1 },
  recordValue: { color: '#d4a843', fontSize: 22, fontWeight: 'bold' },
  recordLabel: { color: '#9a9a9a', fontSize: 11, marginTop: 2, textAlign: 'center' },
  recordDivider: { width: 1, height: 36, backgroundColor: '#4a4a4a' },
  modeCard: { backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#4a4a4a', flexDirection: 'row', alignItems: 'center', gap: 12 },
  modeIcon: { fontSize: 32 },
  modeLabel: { color: '#f0f0f0', fontWeight: 'bold', fontSize: 16 },
  modeDesc: { color: '#9a9a9a', fontSize: 12, marginTop: 2 },
  selectedBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  selectedText: { fontWeight: 'bold', fontSize: 14 },
  rulesCard: { backgroundColor: '#1e2022', borderRadius: 12, padding: 14, marginVertical: 16, borderWidth: 1, borderColor: '#d4a84320' },
  rulesTitle: { color: '#d4a843', fontWeight: '600', marginBottom: 8 },
  rulesText: { color: '#9a9a9a', fontSize: 12, marginBottom: 4 },
  startBtn: { backgroundColor: '#d4a843', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  startText: { color: '#1a1a1a', fontWeight: 'bold', fontSize: 18 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#2c2c2c', borderWidth: 1, borderColor: '#4a4a4a' },
  periodBtnActive: { backgroundColor: '#d4a84320', borderColor: '#d4a843' },
  periodText: { color: '#9a9a9a', fontSize: 13 },
  periodTextActive: { color: '#d4a843', fontWeight: '600' },
  emptyCard: { backgroundColor: '#2c2c2c', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#4a4a4a' },
  emptyText: { color: '#f0f0f0', fontWeight: '600', marginBottom: 4 },
  emptySubtext: { color: '#9a9a9a', fontSize: 13 },
  leaderCard: { backgroundColor: '#2c2c2c', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#4a4a4a' },
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  leaderRowBorder: { borderBottomWidth: 1, borderBottomColor: '#3a3a3a' },
  rankText: { fontSize: 18, width: 28, textAlign: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#d4a84330', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#d4a843', fontWeight: 'bold', fontSize: 16 },
  leaderName: { color: '#f0f0f0', fontWeight: '600', fontSize: 14 },
  leaderSub: { color: '#9a9a9a', fontSize: 11, marginTop: 1 },
  leaderScore: { color: '#d4a843', fontWeight: 'bold', fontSize: 20, fontVariant: ['tabular-nums'] },
});
