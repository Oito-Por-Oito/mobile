import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupabaseAuth } from '@/lib/auth-context';
import { useUserProgress } from '@/hooks/supabase/use-user-progress';
import { ScreenContainer } from '@/components/screen-container';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Home para visitantes não logados ───────────────────────────────────────
function HomeVisitor() {
  const router = useRouter();
  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: '#2c2c2c', borderWidth: 2, borderColor: '#d4a843',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <Text style={{ fontSize: 40 }}>♟</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#d4a843', marginBottom: 8 }}>
            OitoPorOito
          </Text>
          <Text style={{ color: '#9a9a9a', textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
            A plataforma de xadrez brasileira.{'\n'}Jogue, aprenda e evolua.
          </Text>
        </View>

        {/* CTA Buttons */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup' as any)}
          style={{
            backgroundColor: '#d4a843', borderRadius: 14,
            padding: 18, alignItems: 'center', marginBottom: 12,
          }}
        >
          <Text style={{ color: '#1e1e1e', fontWeight: 'bold', fontSize: 17 }}>Criar Conta Grátis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login' as any)}
          style={{
            backgroundColor: '#2c2c2c', borderRadius: 14,
            padding: 18, alignItems: 'center', marginBottom: 32,
            borderWidth: 1, borderColor: '#4a4a4a',
          }}
        >
          <Text style={{ color: '#f0f0f0', fontWeight: '600', fontSize: 17 }}>Entrar</Text>
        </TouchableOpacity>

        {/* Features */}
        {[
          { icon: '♟', title: 'Jogue Online', desc: 'Partidas em tempo real contra jogadores do mundo todo' },
          { icon: '🤖', title: 'Treine vs IA', desc: 'Desafie bots com diferentes níveis de dificuldade' },
          { icon: '🧩', title: 'Puzzles Diários', desc: 'Melhore seu jogo com puzzles táticos todos os dias' },
          { icon: '📚', title: 'Aprenda Xadrez', desc: 'Lições, cursos e análises para todos os níveis' },
          { icon: '🏆', title: 'Ranking', desc: 'Suba no ranking e mostre sua habilidade' },
        ].map((feature) => (
          <View
            key={feature.title}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: '#2c2c2c', borderRadius: 14,
              padding: 16, marginBottom: 12,
              borderWidth: 1, borderColor: '#3a3a3a',
            }}
          >
            <Text style={{ fontSize: 32, marginRight: 16 }}>{feature.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f0f0f0', fontWeight: '600', fontSize: 15, marginBottom: 4 }}>
                {feature.title}
              </Text>
              <Text style={{ color: '#9a9a9a', fontSize: 13, lineHeight: 18 }}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Dashboard para usuários logados ────────────────────────────────────────
function Dashboard() {
  const router = useRouter();
  const { profile } = useSupabaseAuth();
  const { progress, loading } = useUserProgress();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const displayName = profile?.display_name || profile?.username || 'Jogador';

  if (loading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#d4a843" size="large" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Welcome Card */}
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16,
          padding: 20, marginBottom: 16,
          borderWidth: 1, borderColor: '#4a4a4a',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: '#3a3a3a', borderWidth: 2, borderColor: '#d4a843',
              alignItems: 'center', justifyContent: 'center', marginRight: 14,
              overflow: 'hidden',
            }}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 60, height: 60 }} />
              ) : (
                <Text style={{ fontSize: 28 }}>👤</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#9a9a9a', fontSize: 13 }}>{getGreeting()},</Text>
              <Text style={{ color: '#d4a843', fontSize: 20, fontWeight: 'bold' }}>{displayName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Text style={{ fontSize: 14 }}>🔥</Text>
                <Text style={{ color: '#f0f0f0', fontSize: 13, marginLeft: 4 }}>
                  {progress?.streak || 0} dias de sequência
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16,
          padding: 16, marginBottom: 16,
          borderWidth: 1, borderColor: '#4a4a4a',
        }}>
          <Text style={{ color: '#d4a843', fontSize: 16, fontWeight: '600', marginBottom: 14 }}>
            ⚡ Ações Rápidas
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              { label: '🎮 Jogar Agora', tab: 'play' },
              { label: '🧩 Puzzle Diário', tab: 'puzzles' },
              { label: '📚 Aprender', tab: 'learn' },
              { label: '🏆 Ranking', tab: 'more' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push(`/(tabs)/${action.tab}` as any)}
                style={{
                  backgroundColor: '#3a3a3a', borderRadius: 10,
                  paddingVertical: 10, paddingHorizontal: 14,
                  borderWidth: 1, borderColor: '#4a4a4a',
                  minWidth: '45%', flex: 1,
                }}
              >
                <Text style={{ color: '#f0f0f0', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Player Stats */}
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16,
          padding: 16, marginBottom: 16,
          borderWidth: 1, borderColor: '#4a4a4a',
        }}>
          <Text style={{ color: '#d4a843', fontSize: 16, fontWeight: '600', marginBottom: 14 }}>
            📊 Suas Estatísticas
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
            {[
              { label: 'Blitz', value: profile?.rating_blitz || 800, icon: '⚡' },
              { label: 'Rápido', value: profile?.rating_rapid || 800, icon: '⏱' },
              { label: 'Clássico', value: profile?.rating_classical || 800, icon: '♟' },
            ].map((rating) => (
              <View
                key={rating.label}
                style={{
                  flex: 1, alignItems: 'center',
                  backgroundColor: '#3a3a3a', borderRadius: 12,
                  padding: 12, marginHorizontal: 4,
                  borderWidth: 1, borderColor: '#4a4a4a',
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>{rating.icon}</Text>
                <Text style={{ color: '#d4a843', fontSize: 18, fontWeight: 'bold' }}>{rating.value}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 12 }}>{rating.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {[
              { label: 'Partidas', value: progress?.stats.totalGames || 0 },
              { label: 'Vitórias', value: progress?.stats.wins || 0 },
              { label: 'Derrotas', value: progress?.stats.losses || 0 },
              { label: 'Empates', value: progress?.stats.draws || 0 },
            ].map((stat) => (
              <View key={stat.label} style={{ alignItems: 'center' }}>
                <Text style={{ color: '#f0f0f0', fontSize: 18, fontWeight: 'bold' }}>{stat.value}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 12 }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Daily Goals */}
        {progress && (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 16,
            padding: 16, marginBottom: 16,
            borderWidth: 1, borderColor: '#4a4a4a',
          }}>
            <Text style={{ color: '#d4a843', fontSize: 16, fontWeight: '600', marginBottom: 14 }}>
              🎯 Metas Diárias
            </Text>
            {[
              { label: 'Puzzles', current: progress.dailyGoals.puzzles.current, target: progress.dailyGoals.puzzles.target, icon: '🧩' },
              { label: 'Partidas', current: progress.dailyGoals.games.current, target: progress.dailyGoals.games.target, icon: '♟' },
              { label: 'Estudo (min)', current: progress.dailyGoals.studyMinutes.current, target: progress.dailyGoals.studyMinutes.target, icon: '📚' },
            ].map((goal) => {
              const pct = Math.min((goal.current / goal.target) * 100, 100);
              return (
                <View key={goal.label} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#f0f0f0', fontSize: 14 }}>{goal.icon} {goal.label}</Text>
                    <Text style={{ color: '#9a9a9a', fontSize: 13 }}>{goal.current}/{goal.target}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: '#3a3a3a', borderRadius: 3 }}>
                    <View style={{
                      height: 6, borderRadius: 3,
                      backgroundColor: pct >= 100 ? '#22c55e' : '#d4a843',
                      width: `${pct}%`,
                    }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Activity */}
        {progress && progress.recentActivity.length > 0 && (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 16,
            padding: 16, marginBottom: 16,
            borderWidth: 1, borderColor: '#4a4a4a',
          }}>
            <Text style={{ color: '#d4a843', fontSize: 16, fontWeight: '600', marginBottom: 14 }}>
              🕐 Atividade Recente
            </Text>
            {progress.recentActivity.slice(0, 5).map((activity) => (
              <View
                key={activity.id}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#3a3a3a',
                }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 16 }}>
                    {activity.type === 'game' ? '♟' : activity.type === 'puzzle' ? '🧩' : '📚'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#f0f0f0', fontSize: 14 }}>{activity.description}</Text>
                  <Text style={{ color: '#9a9a9a', fontSize: 12, marginTop: 2 }}>{activity.time}</Text>
                </View>
                {activity.result && (
                  <View style={{
                    backgroundColor: activity.result === 'win' ? 'rgba(34,197,94,0.2)' :
                      activity.result === 'loss' ? 'rgba(239,68,68,0.2)' : 'rgba(212,168,67,0.2)',
                    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
                  }}>
                    <Text style={{
                      fontSize: 12, fontWeight: '600',
                      color: activity.result === 'win' ? '#4ade80' :
                        activity.result === 'loss' ? '#f87171' : '#d4a843',
                    }}>
                      {activity.result === 'win' ? 'Vitória' : activity.result === 'loss' ? 'Derrota' : 'Empate'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, loading } = useSupabaseAuth();

  if (loading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#d4a843" size="large" />
        </View>
      </ScreenContainer>
    );
  }

  return user ? <Dashboard /> : <HomeVisitor />;
}
