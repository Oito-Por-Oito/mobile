import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';

const PRESET_GOALS = [
  { id: 'rating_1500', icon: '🎯', title: 'Alcançar 1500 de Rating', category: 'Rating', target: 1500, current: 1285, unit: 'pts', type: 'rating' },
  { id: 'puzzles_100', icon: '🧩', title: 'Resolver 100 Puzzles', category: 'Puzzles', target: 100, current: 67, unit: 'puzzles', type: 'count' },
  { id: 'streak_30', icon: '🔥', title: 'Sequência de 30 Dias', category: 'Consistência', target: 30, current: 14, unit: 'dias', type: 'streak' },
  { id: 'games_50', icon: '♟', title: 'Jogar 50 Partidas', category: 'Partidas', target: 50, current: 32, unit: 'partidas', type: 'count' },
  { id: 'accuracy_85', icon: '📊', title: 'Precisão Média de 85%', category: 'Qualidade', target: 85, current: 78, unit: '%', type: 'percentage' },
  { id: 'win_rate_60', icon: '🏆', title: 'Win Rate de 60%', category: 'Resultados', target: 60, current: 54, unit: '%', type: 'percentage' },
];

function GoalCard({ goal }: { goal: typeof PRESET_GOALS[0] }) {
  const progress = Math.min(1, goal.current / goal.target);
  const percentage = Math.round(progress * 100);
  const isComplete = progress >= 1;

  return (
    <View style={{
      backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: isComplete ? '#22c55e' : '#3a3a3a',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: isComplete ? '#22c55e22' : '#3a3a3a',
          alignItems: 'center', justifyContent: 'center', marginRight: 12,
        }}>
          <Text style={{ fontSize: 22 }}>{isComplete ? '✅' : goal.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#f0f0f0', fontSize: 14, fontWeight: '600' }}>{goal.title}</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 12, marginTop: 1 }}>{goal.category}</Text>
        </View>
        <Text style={{ color: isComplete ? '#22c55e' : '#d4a843', fontSize: 15, fontWeight: 'bold' }}>
          {percentage}%
        </Text>
      </View>

      {/* Barra de progresso */}
      <View style={{ height: 6, backgroundColor: '#3a3a3a', borderRadius: 3, marginBottom: 6 }}>
        <View style={{
          height: 6, borderRadius: 3,
          backgroundColor: isComplete ? '#22c55e' : '#d4a843',
          width: `${percentage}%`,
        }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#9a9a9a', fontSize: 12 }}>
          {goal.current} / {goal.target} {goal.unit}
        </Text>
        {isComplete ? (
          <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '600' }}>Concluído! 🎉</Text>
        ) : (
          <Text style={{ color: '#9a9a9a', fontSize: 12 }}>
            Faltam {goal.target - goal.current} {goal.unit}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function GoalsScreen() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filtered = PRESET_GOALS.filter(g => {
    const isComplete = g.current >= g.target;
    if (filter === 'active') return !isComplete;
    if (filter === 'completed') return isComplete;
    return true;
  });

  const completedCount = PRESET_GOALS.filter(g => g.current >= g.target).length;
  const totalCount = PRESET_GOALS.length;

  if (!user) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>🎯</Text>
          <Text style={{ color: '#f0f0f0', fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            Metas de Evolução
          </Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            Faça login para definir e acompanhar suas metas de xadrez
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

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#d4a843', fontSize: 15 }}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' }}>Metas</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, marginTop: 4 }}>
            Defina e acompanhe seus objetivos de xadrez
          </Text>
        </View>

        {/* Resumo */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16,
            borderWidth: 1, borderColor: '#3a3a3a', flexDirection: 'row', alignItems: 'center',
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f0f0f0', fontSize: 15, fontWeight: '600' }}>
                {completedCount} de {totalCount} metas concluídas
              </Text>
              <View style={{ height: 6, backgroundColor: '#3a3a3a', borderRadius: 3, marginTop: 8 }}>
                <View style={{
                  height: 6, borderRadius: 3, backgroundColor: '#22c55e',
                  width: `${(completedCount / totalCount) * 100}%`,
                }} />
              </View>
            </View>
            <Text style={{ fontSize: 36, marginLeft: 16 }}>
              {completedCount === totalCount ? '🏆' : '🎯'}
            </Text>
          </View>
        </View>

        {/* Filtros */}
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'all', label: 'Todas' },
            { key: 'active', label: 'Em Progresso' },
            { key: 'completed', label: 'Concluídas' },
          ].map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key as any)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
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

        {/* Lista de Metas */}
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {filtered.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
