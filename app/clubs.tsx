import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';

const SAMPLE_CLUBS = [
  { id: '1', name: 'Xadrez Brasil', members: 1240, games: 8450, description: 'O maior clube de xadrez do Brasil. Partidas diárias e torneios semanais.', icon: '🇧🇷', isJoined: false },
  { id: '2', name: 'Gambito Siciliano', members: 532, games: 3210, description: 'Clube especializado em aberturas sicilianas e jogo de ataque.', icon: '♟', isJoined: true },
  { id: '3', name: 'Endgame Masters', members: 287, games: 1890, description: 'Estudo aprofundado de finais de partida. Para jogadores sérios.', icon: '🏆', isJoined: false },
  { id: '4', name: 'Blitz Warriors', members: 945, games: 12300, description: 'Clube de blitz e bullet. Partidas rápidas e emocionantes.', icon: '⚡', isJoined: false },
  { id: '5', name: 'Escola de Xadrez SP', members: 178, games: 920, description: 'Clube educacional para iniciantes e intermediários de São Paulo.', icon: '📚', isJoined: false },
  { id: '6', name: 'Posição Fechada', members: 412, games: 2670, description: 'Para quem gosta de estruturas fechadas e jogo estratégico lento.', icon: '🔒', isJoined: true },
];

const CATEGORIES = ['Todos', 'Meus Clubes', 'Populares', 'Novos'];

export default function ClubsScreen() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [clubs, setClubs] = useState(SAMPLE_CLUBS);

  const filteredClubs = clubs.filter(club => {
    if (selectedCategory === 'Meus Clubes') return club.isJoined;
    if (selectedCategory === 'Populares') return club.members >= 400;
    return true;
  });

  const toggleJoin = (clubId: string) => {
    if (!user) {
      router.push('/(auth)/login' as any);
      return;
    }
    setClubs(prev => prev.map(c => c.id === clubId ? { ...c, isJoined: !c.isJoined } : c));
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#d4a843', fontSize: 15 }}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' }}>Clubes</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, marginTop: 4 }}>
            Junte-se a clubes e jogue com a comunidade
          </Text>
        </View>

        {/* Criar Clube */}
        {user && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <TouchableOpacity style={{
              backgroundColor: '#d4a843', borderRadius: 12, padding: 14,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            }}>
              <Text style={{ fontSize: 18 }}>+</Text>
              <Text style={{ color: '#1e1e1e', fontWeight: 'bold', fontSize: 15 }}>Criar Novo Clube</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: selectedCategory === cat ? '#d4a843' : '#2c2c2c',
                  borderWidth: 1, borderColor: selectedCategory === cat ? '#d4a843' : '#4a4a4a',
                }}
              >
                <Text style={{ color: selectedCategory === cat ? '#1e1e1e' : '#9a9a9a', fontWeight: '600', fontSize: 13 }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Lista de Clubes */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {filteredClubs.map(club => (
            <View key={club.id} style={{
              backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: club.isJoined ? '#d4a843' : '#3a3a3a',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 24 }}>{club.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: '#f0f0f0', fontSize: 16, fontWeight: 'bold' }}>{club.name}</Text>
                    {club.isJoined && (
                      <View style={{ backgroundColor: '#d4a84322', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: '#d4a843', fontSize: 11, fontWeight: '600' }}>Membro</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: '#9a9a9a', fontSize: 12, marginTop: 2 }}>
                    {club.members.toLocaleString('pt-BR')} membros • {club.games.toLocaleString('pt-BR')} partidas
                  </Text>
                </View>
              </View>
              <Text style={{ color: '#b0b0b0', fontSize: 13, lineHeight: 18, marginBottom: 12 }}>
                {club.description}
              </Text>
              <TouchableOpacity
                onPress={() => toggleJoin(club.id)}
                style={{
                  borderRadius: 10, padding: 10, alignItems: 'center',
                  backgroundColor: club.isJoined ? '#3a3a3a' : '#d4a84322',
                  borderWidth: 1, borderColor: club.isJoined ? '#4a4a4a' : '#d4a843',
                }}
              >
                <Text style={{ color: club.isJoined ? '#9a9a9a' : '#d4a843', fontWeight: '600', fontSize: 14 }}>
                  {club.isJoined ? 'Sair do Clube' : 'Entrar no Clube'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
