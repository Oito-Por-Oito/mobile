import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';

const TOURNAMENTS = [
  {
    id: '1', name: 'Arena Blitz Semanal', type: 'Arena', timeControl: '3+0',
    status: 'live', players: 48, maxPlayers: 100, prize: null,
    startTime: 'Ao vivo agora', rounds: null, icon: '⚡', color: '#ef4444',
  },
  {
    id: '2', name: 'Torneio Suíço Mensal', type: 'Suíço', timeControl: '10+5',
    status: 'upcoming', players: 32, maxPlayers: 64, prize: 'Troféu Digital',
    startTime: 'Hoje às 20:00', rounds: 7, icon: '🏆', color: '#d4a843',
  },
  {
    id: '3', name: 'Copa OitoPorOito', type: 'Eliminatório', timeControl: '15+10',
    status: 'upcoming', players: 16, maxPlayers: 32, prize: 'R$ 500',
    startTime: 'Amanhã às 15:00', rounds: 5, icon: '🥇', color: '#22c55e',
  },
  {
    id: '4', name: 'Arena Rápido Diário', type: 'Arena', timeControl: '5+3',
    status: 'upcoming', players: 12, maxPlayers: 50, prize: null,
    startTime: 'Hoje às 22:00', rounds: null, icon: '⏱', color: '#0a7ea4',
  },
  {
    id: '5', name: 'Torneio de Iniciantes', type: 'Suíço', timeControl: '10+0',
    status: 'finished', players: 24, maxPlayers: 24, prize: null,
    startTime: 'Encerrado', rounds: 5, icon: '📚', color: '#6a6a6a',
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  live: { label: '● AO VIVO', color: '#ef4444', bg: '#ef444422' },
  upcoming: { label: 'Em Breve', color: '#22c55e', bg: '#22c55e22' },
  finished: { label: 'Encerrado', color: '#6a6a6a', bg: '#6a6a6a22' },
};

export default function TournamentsScreen() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');

  const filtered = TOURNAMENTS.filter(t => filter === 'all' || t.status === filter);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#d4a843', fontSize: 15 }}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' }}>Torneios</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, marginTop: 4 }}>
            Participe de torneios e mostre sua habilidade
          </Text>
        </View>

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { key: 'all', label: 'Todos' },
              { key: 'live', label: '● Ao Vivo' },
              { key: 'upcoming', label: 'Em Breve' },
              { key: 'finished', label: 'Encerrados' },
            ].map(f => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key as any)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: filter === f.key ? '#d4a843' : '#2c2c2c',
                  borderWidth: 1, borderColor: filter === f.key ? '#d4a843' : '#4a4a4a',
                }}
              >
                <Text style={{ color: filter === f.key ? '#1e1e1e' : '#9a9a9a', fontWeight: '600', fontSize: 13 }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Lista de Torneios */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {filtered.map(t => {
            const statusInfo = STATUS_LABELS[t.status];
            return (
              <View key={t.id} style={{
                backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: t.status === 'live' ? '#ef4444' : '#3a3a3a',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                  <View style={{
                    width: 48, height: 48, borderRadius: 12,
                    backgroundColor: t.color + '22', alignItems: 'center', justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Text style={{ fontSize: 24 }}>{t.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#f0f0f0', fontSize: 15, fontWeight: 'bold' }}>{t.name}</Text>
                    <Text style={{ color: '#9a9a9a', fontSize: 12, marginTop: 2 }}>
                      {t.type} • {t.timeControl} {t.rounds ? `• ${t.rounds} rodadas` : ''}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: statusInfo.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: statusInfo.color, fontSize: 11, fontWeight: '700' }}>{statusInfo.label}</Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#d4a843', fontSize: 16, fontWeight: 'bold' }}>{t.players}</Text>
                    <Text style={{ color: '#9a9a9a', fontSize: 11 }}>jogadores</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#f0f0f0', fontSize: 16, fontWeight: 'bold' }}>{t.maxPlayers}</Text>
                    <Text style={{ color: '#9a9a9a', fontSize: 11 }}>vagas</Text>
                  </View>
                  {t.prize && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: 'bold' }}>{t.prize}</Text>
                      <Text style={{ color: '#9a9a9a', fontSize: 11 }}>prêmio</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={{ color: '#9a9a9a', fontSize: 12 }}>{t.startTime}</Text>
                  </View>
                </View>

                {/* Barra de vagas */}
                <View style={{ height: 4, backgroundColor: '#3a3a3a', borderRadius: 2, marginBottom: 12 }}>
                  <View style={{
                    height: 4, borderRadius: 2,
                    backgroundColor: t.color,
                    width: `${Math.min(100, (t.players / t.maxPlayers) * 100)}%`,
                  }} />
                </View>

                {t.status !== 'finished' && (
                  <TouchableOpacity
                    onPress={() => !user && router.push('/(auth)/login' as any)}
                    style={{
                      backgroundColor: t.status === 'live' ? '#ef4444' : '#d4a843',
                      borderRadius: 10, padding: 12, alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#1e1e1e', fontWeight: 'bold', fontSize: 14 }}>
                      {t.status === 'live' ? 'Entrar Agora' : 'Inscrever-se'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
