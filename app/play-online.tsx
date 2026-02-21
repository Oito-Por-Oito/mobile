import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';
import { useMatchmaking } from '@/hooks/supabase/use-matchmaking';
import { GameRoom } from '@/components/play/GameRoom';

const TIME_CONTROLS = [
  { label: '1 min', time: 60, increment: 0, type: 'bullet', icon: '⚡' },
  { label: '2+1', time: 120, increment: 1, type: 'bullet', icon: '⚡' },
  { label: '3 min', time: 180, increment: 0, type: 'blitz', icon: '🔥' },
  { label: '3+2', time: 180, increment: 2, type: 'blitz', icon: '🔥' },
  { label: '5 min', time: 300, increment: 0, type: 'blitz', icon: '🔥' },
  { label: '10 min', time: 600, increment: 0, type: 'rapid', icon: '⏱' },
  { label: '15+10', time: 900, increment: 10, type: 'rapid', icon: '⏱' },
  { label: '30 min', time: 1800, increment: 0, type: 'classical', icon: '♟' },
];

export default function PlayOnlineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, profile } = useSupabaseAuth();
  const { isSearching, error, matchedGame, joinQueue, leaveQueue, clearMatchedGame, setMatchedGame } = useMatchmaking();
  const [selectedTime, setSelectedTime] = useState<typeof TIME_CONTROLS[0] | null>(null);

  if (!user) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#f0f0f0', fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            Faça login para jogar online
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

  if (matchedGame) {
    return (
      <GameRoom
        gameId={matchedGame.id}
        onLeaveGame={clearMatchedGame}
        onRematchAccepted={(newGameId) => setMatchedGame({ id: newGameId })}
      />
    );
  }

  if (isSearching) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{
            width: 100, height: 100, borderRadius: 50,
            borderWidth: 4, borderColor: '#d4a843',
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          }}>
            <ActivityIndicator color="#d4a843" size="large" />
          </View>
          <Text style={{ color: '#d4a843', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
            Procurando oponente...
          </Text>
          <Text style={{ color: '#9a9a9a', textAlign: 'center', marginBottom: 32 }}>
            Aguarde enquanto encontramos um adversário à sua altura
          </Text>
          {selectedTime && (
            <View style={{
              backgroundColor: '#2c2c2c', borderRadius: 12, padding: 12,
              borderWidth: 1, borderColor: '#4a4a4a', marginBottom: 24,
            }}>
              <Text style={{ color: '#f0f0f0', textAlign: 'center' }}>
                {selectedTime.label} • {selectedTime.type}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={leaveQueue}
            style={{
              backgroundColor: '#3a3a3a', borderRadius: 12,
              padding: 16, paddingHorizontal: 32,
              borderWidth: 1, borderColor: '#ef4444',
            }}
          >
            <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 16 }}>Cancelar busca</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingTop: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ color: '#9a9a9a', fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#f0f0f0' }}>⚔️ Jogar Online</Text>
            <Text style={{ color: '#9a9a9a', fontSize: 13 }}>
              Rating: {profile?.rating_rapid || 800} (Rápido)
            </Text>
          </View>
        </View>

        {error && (
          <View style={{
            backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 12,
            borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', padding: 12, marginBottom: 16,
          }}>
            <Text style={{ color: '#f87171', textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        {/* Time Control Selection */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Controle de Tempo
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {TIME_CONTROLS.map((tc) => (
            <TouchableOpacity
              key={tc.label}
              onPress={() => setSelectedTime(tc)}
              style={{
                backgroundColor: selectedTime?.label === tc.label ? '#d4a843' : '#2c2c2c',
                borderRadius: 12, padding: 14, alignItems: 'center',
                minWidth: '22%', flex: 1,
                borderWidth: 1,
                borderColor: selectedTime?.label === tc.label ? '#d4a843' : '#4a4a4a',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>{tc.icon}</Text>
              <Text style={{
                color: selectedTime?.label === tc.label ? '#1e1e1e' : '#f0f0f0',
                fontSize: 14, fontWeight: '600',
              }}>{tc.label}</Text>
              <Text style={{
                color: selectedTime?.label === tc.label ? '#1e1e1e' + 'aa' : '#9a9a9a',
                fontSize: 11, textTransform: 'capitalize',
              }}>{tc.type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Play Button */}
        <TouchableOpacity
          onPress={() => {
            if (!selectedTime) {
              Alert.alert('Selecione um tempo', 'Escolha um controle de tempo para jogar.');
              return;
            }
            joinQueue(selectedTime.type, selectedTime.time, selectedTime.increment);
          }}
          style={{
            backgroundColor: selectedTime ? '#d4a843' : '#3a3a3a',
            borderRadius: 16, padding: 20, alignItems: 'center',
            borderWidth: 1, borderColor: selectedTime ? '#d4a843' : '#4a4a4a',
          }}
        >
          <Text style={{
            color: selectedTime ? '#1e1e1e' : '#9a9a9a',
            fontWeight: 'bold', fontSize: 18,
          }}>
            {selectedTime ? `Jogar ${selectedTime.label}` : 'Selecione um tempo'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
