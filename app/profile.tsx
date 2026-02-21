import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, updateProfile, loading } = useSupabaseAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#f0f0f0', fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            Faça login para ver seu perfil
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

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ display_name: displayName, bio });
    setSaving(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } else {
      setEditing(false);
    }
  };

  const winRate = profile && profile.total_games > 0
    ? Math.round((profile.wins / profile.total_games) * 100)
    : 0;

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ color: '#9a9a9a', fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#f0f0f0', flex: 1 }}>Perfil</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={{ color: '#d4a843', fontSize: 15, fontWeight: '600' }}>
              {editing ? 'Cancelar' : 'Editar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 20, padding: 24, marginBottom: 16,
          borderWidth: 1, borderColor: '#4a4a4a', alignItems: 'center',
        }}>
          {/* Avatar */}
          <View style={{
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: '#3a3a3a', borderWidth: 3, borderColor: '#d4a843',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden',
          }}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={{ width: 90, height: 90 }} />
            ) : (
              <Text style={{ fontSize: 40 }}>👤</Text>
            )}
          </View>

          {editing ? (
            <View style={{ width: '100%' }}>
              <Text style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 6 }}>Nome de exibição</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                style={{
                  backgroundColor: '#3a3a3a', borderRadius: 10,
                  borderWidth: 1, borderColor: '#4a4a4a',
                  padding: 12, color: '#f0f0f0', fontSize: 16, marginBottom: 12,
                }}
                placeholder="Seu nome"
                placeholderTextColor="#666"
              />
              <Text style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 6 }}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                style={{
                  backgroundColor: '#3a3a3a', borderRadius: 10,
                  borderWidth: 1, borderColor: '#4a4a4a',
                  padding: 12, color: '#f0f0f0', fontSize: 15,
                  height: 80, textAlignVertical: 'top', marginBottom: 16,
                }}
                placeholder="Fale sobre você..."
                placeholderTextColor="#666"
                multiline
              />
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  backgroundColor: '#d4a843', borderRadius: 12, padding: 14,
                  alignItems: 'center', opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#1e1e1e" />
                ) : (
                  <Text style={{ color: '#1e1e1e', fontWeight: 'bold', fontSize: 15 }}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={{ color: '#d4a843', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>
                {profile?.display_name || profile?.username || 'Jogador'}
              </Text>
              <Text style={{ color: '#9a9a9a', fontSize: 14, marginBottom: 4 }}>
                @{profile?.username || user.email?.split('@')[0]}
              </Text>
              {profile?.bio && (
                <Text style={{ color: '#9a9a9a', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                  {profile.bio}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#f0f0f0', fontWeight: 'bold', fontSize: 16 }}>
                    {profile?.streak_days || 0}
                  </Text>
                  <Text style={{ color: '#9a9a9a', fontSize: 12 }}>🔥 Sequência</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#f0f0f0', fontWeight: 'bold', fontSize: 16 }}>
                    {profile?.total_games || 0}
                  </Text>
                  <Text style={{ color: '#9a9a9a', fontSize: 12 }}>♟ Partidas</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#f0f0f0', fontWeight: 'bold', fontSize: 16 }}>
                    {profile?.puzzles_solved || 0}
                  </Text>
                  <Text style={{ color: '#9a9a9a', fontSize: 12 }}>🧩 Puzzles</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Ratings */}
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16, marginBottom: 16,
          borderWidth: 1, borderColor: '#4a4a4a',
        }}>
          <Text style={{ color: '#d4a843', fontWeight: '600', fontSize: 16, marginBottom: 14 }}>
            ⚡ Ratings
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[
              { label: 'Blitz', value: profile?.rating_blitz || 800, icon: '⚡' },
              { label: 'Rápido', value: profile?.rating_rapid || 800, icon: '⏱' },
              { label: 'Clássico', value: profile?.rating_classical || 800, icon: '♟' },
            ].map((rating) => (
              <View
                key={rating.label}
                style={{
                  flex: 1, alignItems: 'center', backgroundColor: '#3a3a3a',
                  borderRadius: 12, padding: 12, marginHorizontal: 4,
                  borderWidth: 1, borderColor: '#4a4a4a',
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{rating.icon}</Text>
                <Text style={{ color: '#d4a843', fontSize: 20, fontWeight: 'bold' }}>{rating.value}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 12 }}>{rating.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Game Stats */}
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16, marginBottom: 16,
          borderWidth: 1, borderColor: '#4a4a4a',
        }}>
          <Text style={{ color: '#d4a843', fontWeight: '600', fontSize: 16, marginBottom: 14 }}>
            📊 Estatísticas de Jogo
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
            {[
              { label: 'Vitórias', value: profile?.wins || 0, color: '#22c55e' },
              { label: 'Derrotas', value: profile?.losses || 0, color: '#ef4444' },
              { label: 'Empates', value: profile?.draws || 0, color: '#f59e0b' },
            ].map((stat) => (
              <View key={stat.label} style={{ alignItems: 'center' }}>
                <Text style={{ color: stat.color, fontSize: 22, fontWeight: 'bold' }}>{stat.value}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 13 }}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Win rate bar */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: '#9a9a9a', fontSize: 13 }}>Taxa de vitória</Text>
              <Text style={{ color: '#f0f0f0', fontSize: 13, fontWeight: '600' }}>{winRate}%</Text>
            </View>
            <View style={{ height: 8, backgroundColor: '#3a3a3a', borderRadius: 4 }}>
              <View style={{
                height: 8, borderRadius: 4, backgroundColor: '#22c55e',
                width: `${winRate}%`,
              }} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
            <View>
              <Text style={{ color: '#9a9a9a', fontSize: 13 }}>Precisão média</Text>
              <Text style={{ color: '#f0f0f0', fontSize: 16, fontWeight: '600' }}>
                {Math.round(profile?.accuracy || 0)}%
              </Text>
            </View>
            <View>
              <Text style={{ color: '#9a9a9a', fontSize: 13 }}>Total de partidas</Text>
              <Text style={{ color: '#f0f0f0', fontSize: 16, fontWeight: '600' }}>
                {profile?.total_games || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Account info */}
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16, marginBottom: 16,
          borderWidth: 1, borderColor: '#4a4a4a',
        }}>
          <Text style={{ color: '#d4a843', fontWeight: '600', fontSize: 16, marginBottom: 14 }}>
            👤 Conta
          </Text>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#9a9a9a', fontSize: 14 }}>Email</Text>
              <Text style={{ color: '#f0f0f0', fontSize: 14 }}>{user.email}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#9a9a9a', fontSize: 14 }}>Membro desde</Text>
              <Text style={{ color: '#f0f0f0', fontSize: 14 }}>
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '-'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
