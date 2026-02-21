import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';

const PLAY_MODES = [
  {
    id: 'online',
    icon: '🌐',
    title: 'Jogar Online',
    subtitle: 'Partidas em tempo real contra outros jogadores',
    color: '#d4a843',
    requiresAuth: true,
    route: '/play-online',
  },
  {
    id: 'computer',
    icon: '🤖',
    title: 'Jogar vs Computador',
    subtitle: 'Treine contra bots com diferentes níveis',
    color: '#60a5fa',
    requiresAuth: false,
    route: '/play-computer',
  },
  {
    id: 'trainer',
    icon: '🎓',
    title: 'Treinador',
    subtitle: 'Aprenda com análise em tempo real',
    color: '#a78bfa',
    requiresAuth: false,
    route: '/play-trainer',
  },
];

const TIME_CONTROLS = [
  { label: '1 min', icon: '⚡', time: 60, type: 'bullet' },
  { label: '3 min', icon: '⚡', time: 180, type: 'blitz' },
  { label: '5 min', icon: '🔥', time: 300, type: 'blitz' },
  { label: '10 min', icon: '⏱', time: 600, type: 'rapid' },
  { label: '15 min', icon: '⏱', time: 900, type: 'rapid' },
  { label: '30 min', icon: '♟', time: 1800, type: 'classical' },
];

export default function PlayScreen() {
  const router = useRouter();
  const { user } = useSupabaseAuth();

  const handleModePress = (mode: typeof PLAY_MODES[0]) => {
    if (mode.requiresAuth && !user) {
      router.push('/(auth)/login' as any);
      return;
    }
    router.push(mode.route as any);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 24, paddingTop: 8 }}>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' }}>Jogar</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, marginTop: 4 }}>
            Escolha como quer jogar xadrez hoje
          </Text>
        </View>

        {/* Play Modes */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Modos de Jogo
        </Text>
        {PLAY_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            onPress={() => handleModePress(mode)}
            style={{
              backgroundColor: '#2c2c2c', borderRadius: 16,
              padding: 20, marginBottom: 12,
              borderWidth: 1, borderColor: '#4a4a4a',
              flexDirection: 'row', alignItems: 'center',
            }}
          >
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center',
              marginRight: 16, borderWidth: 2, borderColor: mode.color + '40',
            }}>
              <Text style={{ fontSize: 28 }}>{mode.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: '#f0f0f0', fontSize: 17, fontWeight: '600' }}>{mode.title}</Text>
                {mode.requiresAuth && !user && (
                  <View style={{
                    backgroundColor: '#d4a843' + '30', borderRadius: 6,
                    paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8,
                  }}>
                    <Text style={{ color: '#d4a843', fontSize: 11, fontWeight: '600' }}>LOGIN</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: '#9a9a9a', fontSize: 13, lineHeight: 18 }}>{mode.subtitle}</Text>
            </View>
            <Text style={{ color: '#4a4a4a', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Quick Play with time controls */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Jogo Rápido Online
        </Text>
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16,
          padding: 16, marginBottom: 16,
          borderWidth: 1, borderColor: '#4a4a4a',
        }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {TIME_CONTROLS.map((tc) => (
              <TouchableOpacity
                key={tc.label}
                onPress={() => {
                  if (!user) { router.push('/(auth)/login' as any); return; }
                  router.push({ pathname: '/play-online' as any, params: { time: tc.time, type: tc.type } });
                }}
                style={{
                  backgroundColor: '#3a3a3a', borderRadius: 12,
                  paddingVertical: 12, paddingHorizontal: 16,
                  alignItems: 'center', minWidth: '30%', flex: 1,
                  borderWidth: 1, borderColor: '#4a4a4a',
                }}
              >
                <Text style={{ fontSize: 18, marginBottom: 4 }}>{tc.icon}</Text>
                <Text style={{ color: '#f0f0f0', fontSize: 14, fontWeight: '600' }}>{tc.label}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 11, textTransform: 'capitalize' }}>{tc.type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Game History */}
        <TouchableOpacity
          onPress={() => user ? router.push('/game-history' as any) : router.push('/(auth)/login' as any)}
          style={{
            backgroundColor: '#2c2c2c', borderRadius: 16,
            padding: 16, marginBottom: 16,
            borderWidth: 1, borderColor: '#4a4a4a',
            flexDirection: 'row', alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, marginRight: 14 }}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f0f0f0', fontSize: 16, fontWeight: '600' }}>Histórico de Partidas</Text>
            <Text style={{ color: '#9a9a9a', fontSize: 13 }}>Veja e replaye suas partidas anteriores</Text>
          </View>
          <Text style={{ color: '#4a4a4a', fontSize: 20 }}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
