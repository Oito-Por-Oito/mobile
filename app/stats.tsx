import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';

const TIME_FILTERS = ['7 dias', '30 dias', '3 meses', 'Tudo'];

const MOCK_STATS = {
  totalGames: 248,
  wins: 134,
  losses: 89,
  draws: 25,
  winRate: 54.0,
  avgGameLength: 32,
  avgAccuracy: 78.4,
  puzzlesSolved: 1240,
  puzzleAccuracy: 82.1,
  streakDays: 14,
  bestStreak: 31,
  ratingProgress: [
    { label: 'Jan', blitz: 1180, rapid: 1220, classical: 1150 },
    { label: 'Fev', blitz: 1210, rapid: 1240, classical: 1180 },
    { label: 'Mar', blitz: 1195, rapid: 1260, classical: 1200 },
    { label: 'Abr', blitz: 1230, rapid: 1280, classical: 1220 },
    { label: 'Mai', blitz: 1260, rapid: 1300, classical: 1245 },
    { label: 'Jun', blitz: 1285, rapid: 1320, classical: 1260 },
  ],
  openings: [
    { name: 'Siciliana', games: 48, winRate: 62 },
    { name: 'Ruy Lopez', games: 35, winRate: 51 },
    { name: 'Francesa', games: 28, winRate: 57 },
    { name: 'Caro-Kann', games: 22, winRate: 45 },
    { name: 'Inglesa', games: 18, winRate: 61 },
  ],
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#2c2c2c', borderRadius: 12, padding: 14,
      alignItems: 'center', borderWidth: 1, borderColor: '#3a3a3a',
    }}>
      <Text style={{ color: color || '#d4a843', fontSize: 22, fontWeight: 'bold' }}>{value}</Text>
      <Text style={{ color: '#f0f0f0', fontSize: 12, fontWeight: '500', marginTop: 2, textAlign: 'center' }}>{label}</Text>
      {sub && <Text style={{ color: '#9a9a9a', fontSize: 11, marginTop: 1 }}>{sub}</Text>}
    </View>
  );
}

export default function StatsScreen() {
  const router = useRouter();
  const { user, profile } = useSupabaseAuth();
  const [timeFilter, setTimeFilter] = useState('30 dias');

  if (!user) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>📊</Text>
          <Text style={{ color: '#f0f0f0', fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            Estatísticas Detalhadas
          </Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            Faça login para ver suas estatísticas completas de jogo
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login' as any)}
            style={{ backgroundColor: '#d4a843', borderRadius: 12, padding: 16, paddingHorizontal: 32 }}
          >
            <Text style={{ color: '#1e1e1e', fontWeight: 'bold', fontSize: 16 }}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const s = MOCK_STATS;

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#d4a843', fontSize: 15 }}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' }}>Estatísticas</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, marginTop: 4 }}>
            Análise detalhada do seu desempenho
          </Text>
        </View>

        {/* Filtro de período */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {TIME_FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setTimeFilter(f)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: timeFilter === f ? '#d4a843' : '#2c2c2c',
                  borderWidth: 1, borderColor: timeFilter === f ? '#d4a843' : '#4a4a4a',
                }}
              >
                <Text style={{ color: timeFilter === f ? '#1e1e1e' : '#9a9a9a', fontWeight: '600', fontSize: 13 }}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* Ratings */}
          <View>
            <Text style={{ color: '#d4a843', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Ratings
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <StatCard label="Blitz" value={String(profile?.rating_blitz || 1285)} sub="⚡" color="#ef4444" />
              <StatCard label="Rápido" value={String(profile?.rating_rapid || 1320)} sub="⏱" color="#f59e0b" />
              <StatCard label="Clássico" value={String(profile?.rating_classical || 1260)} sub="♟" color="#0a7ea4" />
            </View>
          </View>

          {/* Resultados */}
          <View>
            <Text style={{ color: '#d4a843', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Resultados
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <StatCard label="Partidas" value={String(s.totalGames)} color="#f0f0f0" />
              <StatCard label="Vitórias" value={String(s.wins)} color="#22c55e" />
              <StatCard label="Derrotas" value={String(s.losses)} color="#ef4444" />
              <StatCard label="Empates" value={String(s.draws)} color="#9a9a9a" />
            </View>
          </View>

          {/* Barra de Win Rate */}
          <View style={{ backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#3a3a3a' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#f0f0f0', fontSize: 14, fontWeight: '600' }}>Distribuição de Resultados</Text>
              <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: 'bold' }}>{s.winRate}% vitórias</Text>
            </View>
            <View style={{ height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row' }}>
              <View style={{ flex: s.wins, backgroundColor: '#22c55e' }} />
              <View style={{ flex: s.draws, backgroundColor: '#9a9a9a' }} />
              <View style={{ flex: s.losses, backgroundColor: '#ef4444' }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ color: '#22c55e', fontSize: 11 }}>V {s.wins}</Text>
              <Text style={{ color: '#9a9a9a', fontSize: 11 }}>E {s.draws}</Text>
              <Text style={{ color: '#ef4444', fontSize: 11 }}>D {s.losses}</Text>
            </View>
          </View>

          {/* Qualidade de Jogo */}
          <View>
            <Text style={{ color: '#d4a843', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Qualidade de Jogo
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <StatCard label="Precisão Média" value={`${s.avgAccuracy}%`} color="#22c55e" />
              <StatCard label="Lances/Partida" value={String(s.avgGameLength)} color="#0a7ea4" />
            </View>
          </View>

          {/* Puzzles */}
          <View>
            <Text style={{ color: '#d4a843', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Puzzles
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <StatCard label="Resolvidos" value={String(s.puzzlesSolved)} color="#d4a843" />
              <StatCard label="Precisão" value={`${s.puzzleAccuracy}%`} color="#22c55e" />
            </View>
          </View>

          {/* Streak */}
          <View style={{ backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#3a3a3a' }}>
            <Text style={{ color: '#d4a843', fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Sequência de Dias
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 32 }}>🔥</Text>
                <Text style={{ color: '#d4a843', fontSize: 24, fontWeight: 'bold' }}>{s.streakDays}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 12 }}>dias atual</Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#3a3a3a' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 32 }}>🏅</Text>
                <Text style={{ color: '#f0f0f0', fontSize: 24, fontWeight: 'bold' }}>{s.bestStreak}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 12 }}>melhor sequência</Text>
              </View>
            </View>
          </View>

          {/* Aberturas mais jogadas */}
          <View>
            <Text style={{ color: '#d4a843', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Aberturas Mais Jogadas
            </Text>
            <View style={{ backgroundColor: '#2c2c2c', borderRadius: 14, borderWidth: 1, borderColor: '#3a3a3a', overflow: 'hidden' }}>
              {s.openings.map((o, idx) => (
                <View key={o.name} style={{
                  flexDirection: 'row', alignItems: 'center', padding: 14,
                  borderBottomWidth: idx < s.openings.length - 1 ? 1 : 0,
                  borderBottomColor: '#3a3a3a',
                }}>
                  <Text style={{ color: '#9a9a9a', fontSize: 13, width: 20 }}>{idx + 1}</Text>
                  <Text style={{ color: '#f0f0f0', fontSize: 14, flex: 1, marginLeft: 8 }}>{o.name}</Text>
                  <Text style={{ color: '#9a9a9a', fontSize: 12, marginRight: 12 }}>{o.games} partidas</Text>
                  <Text style={{ color: o.winRate >= 55 ? '#22c55e' : o.winRate >= 45 ? '#f59e0b' : '#ef4444', fontSize: 13, fontWeight: '600' }}>
                    {o.winRate}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
