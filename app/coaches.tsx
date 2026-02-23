import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

const COACHES = [
  {
    id: '1', name: 'GM Carlos Henrique', title: 'GM', rating: 2540, country: '🇧🇷',
    specialties: ['Aberturas', 'Estratégia', 'Finais'],
    price: 'R$ 120/h', students: 48, rating_stars: 4.9, reviews: 132,
    bio: 'Grande Mestre com 15 anos de experiência no ensino. Especialista em aberturas e posição.',
    available: true,
  },
  {
    id: '2', name: 'IM Fernanda Oliveira', title: 'IM', rating: 2380, country: '🇧🇷',
    specialties: ['Táticas', 'Xadrez Feminino', 'Iniciantes'],
    price: 'R$ 90/h', students: 67, rating_stars: 4.8, reviews: 89,
    bio: 'Mestre Internacional e campeã brasileira feminina. Excelente para iniciantes e intermediários.',
    available: true,
  },
  {
    id: '3', name: 'FM Ricardo Santos', title: 'FM', rating: 2280, country: '🇧🇷',
    specialties: ['Blitz', 'Táticas', 'Abertura Siciliana'],
    price: 'R$ 70/h', students: 35, rating_stars: 4.7, reviews: 54,
    bio: 'Mestre FIDE especializado em jogo tático e blitz. Método dinâmico e divertido.',
    available: false,
  },
  {
    id: '4', name: 'CM Ana Paula Lima', title: 'CM', rating: 2180, country: '🇧🇷',
    specialties: ['Iniciantes', 'Crianças', 'Fundamentos'],
    price: 'R$ 50/h', students: 92, rating_stars: 5.0, reviews: 201,
    bio: 'Especialista em ensino para crianças e iniciantes. Método lúdico e eficiente.',
    available: true,
  },
];

const TITLE_COLORS: Record<string, string> = {
  GM: '#ffd700',
  IM: '#c0c0c0',
  FM: '#cd7f32',
  CM: '#9a9a9a',
};

export default function CoachesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'available'>('all');

  const filtered = COACHES.filter(c => filter === 'all' || c.available);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#d4a843', fontSize: 15 }}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' }}>Coaches</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, marginTop: 4 }}>
            Encontre um treinador de xadrez certificado
          </Text>
        </View>

        {/* Filtros */}
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[{ key: 'all', label: 'Todos' }, { key: 'available', label: 'Disponíveis' }].map(f => (
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

        {/* Lista de Coaches */}
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {filtered.map(coach => (
            <View key={coach.id} style={{
              backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: '#3a3a3a',
            }}>
              {/* Header do card */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center',
                  marginRight: 12, borderWidth: 2, borderColor: TITLE_COLORS[coach.title] || '#4a4a4a',
                }}>
                  <Text style={{ fontSize: 26 }}>{coach.country}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <View style={{
                      backgroundColor: TITLE_COLORS[coach.title] + '33',
                      borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
                    }}>
                      <Text style={{ color: TITLE_COLORS[coach.title], fontSize: 11, fontWeight: '700' }}>
                        {coach.title}
                      </Text>
                    </View>
                    <Text style={{ color: '#f0f0f0', fontSize: 16, fontWeight: 'bold' }}>{coach.name}</Text>
                  </View>
                  <Text style={{ color: '#9a9a9a', fontSize: 12, marginTop: 2 }}>
                    Rating {coach.rating} • {coach.students} alunos
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Text style={{ color: '#f59e0b', fontSize: 12 }}>{'★'.repeat(Math.floor(coach.rating_stars))}</Text>
                    <Text style={{ color: '#9a9a9a', fontSize: 11 }}>{coach.rating_stars} ({coach.reviews})</Text>
                  </View>
                </View>
                {coach.available ? (
                  <View style={{ backgroundColor: '#22c55e22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '600' }}>Disponível</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#6a6a6a22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#6a6a6a', fontSize: 11, fontWeight: '600' }}>Ocupado</Text>
                  </View>
                )}
              </View>

              <Text style={{ color: '#b0b0b0', fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
                {coach.bio}
              </Text>

              {/* Especialidades */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {coach.specialties.map(s => (
                  <View key={s} style={{
                    backgroundColor: '#3a3a3a', borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 4,
                  }}>
                    <Text style={{ color: '#9a9a9a', fontSize: 12 }}>{s}</Text>
                  </View>
                ))}
              </View>

              {/* Preço e botão */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: '#d4a843', fontSize: 16, fontWeight: 'bold' }}>{coach.price}</Text>
                <TouchableOpacity
                  disabled={!coach.available}
                  style={{
                    backgroundColor: coach.available ? '#d4a843' : '#3a3a3a',
                    borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: coach.available ? '#1e1e1e' : '#6a6a6a', fontWeight: 'bold', fontSize: 14 }}>
                    {coach.available ? 'Agendar Aula' : 'Indisponível'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
