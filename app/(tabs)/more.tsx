import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';
import { useFriends } from '@/hooks/supabase/use-friendship';

const SOCIAL_ITEMS = [
  { icon: '👥', title: 'Amigos', description: 'Gerencie seus amigos e desafie-os', route: '/friends', badgeKey: 'friends' },
  { icon: '🏛️', title: 'Clubes', description: 'Junte-se a clubes de xadrez', route: '/clubs' },
  { icon: '💬', title: 'Fórum', description: 'Discuta xadrez com a comunidade', route: '/forum' },
  { icon: '🏆', title: 'Ranking', description: 'Veja os melhores jogadores', route: '/ranking' },
  { icon: '📰', title: 'Notícias', description: 'Últimas notícias do xadrez mundial', route: '/news' },
  { icon: '🎓', title: 'Coaches', description: 'Encontre um treinador de xadrez', route: '/coaches' },
];

const QUICK_STATS_ITEMS = [
  { icon: '🏆', title: 'Torneios', description: 'Participe de torneios online', route: '/tournaments' },
  { icon: '📊', title: 'Estatísticas', description: 'Análise detalhada do seu jogo', route: '/stats' },
  { icon: '🎯', title: 'Metas', description: 'Defina e acompanhe seus objetivos', route: '/goals' },
];

export default function MoreScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useSupabaseAuth();
  const { totalPending } = useFriends();

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 20, paddingTop: 8 }}>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' }}>Mais</Text>
        </View>

        {/* User Profile Card */}
        {user && profile ? (
          <TouchableOpacity
            onPress={() => router.push('/profile' as any)}
            style={{
              backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16, marginBottom: 20,
              borderWidth: 1, borderColor: '#4a4a4a', flexDirection: 'row', alignItems: 'center',
            }}
          >
            <View style={{
              width: 60, height: 60, borderRadius: 30,
              backgroundColor: '#3a3a3a', borderWidth: 2, borderColor: '#d4a843',
              alignItems: 'center', justifyContent: 'center', marginRight: 14, overflow: 'hidden',
            }}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 60, height: 60 }} />
              ) : (
                <Text style={{ fontSize: 28 }}>👤</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#d4a843', fontSize: 18, fontWeight: 'bold' }}>
                {profile.display_name || profile.username || 'Jogador'}
              </Text>
              <Text style={{ color: '#9a9a9a', fontSize: 13 }}>
                {profile.rating_rapid || 800} • {profile.total_games || 0} partidas
              </Text>
            </View>
            <Text style={{ color: '#4a4a4a', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        ) : (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 16, padding: 20, marginBottom: 20,
            borderWidth: 1, borderColor: '#4a4a4a', alignItems: 'center',
          }}>
            <Text style={{ color: '#f0f0f0', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              Faça login para acessar todos os recursos
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login' as any)}
                style={{
                  backgroundColor: '#d4a843', borderRadius: 12, padding: 12,
                  flex: 1, alignItems: 'center',
                }}
              >
                <Text style={{ color: '#1e1e1e', fontWeight: 'bold' }}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/signup' as any)}
                style={{
                  backgroundColor: '#3a3a3a', borderRadius: 12, padding: 12,
                  flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#4a4a4a',
                }}
              >
                <Text style={{ color: '#f0f0f0', fontWeight: '600' }}>Criar Conta</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Social Section */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Comunidade
        </Text>
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16, marginBottom: 20,
          borderWidth: 1, borderColor: '#4a4a4a', overflow: 'hidden',
        }}>
          {SOCIAL_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => handleNavigation(item.route)}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: 16,
                borderBottomWidth: idx < SOCIAL_ITEMS.length - 1 ? 1 : 0,
                borderBottomColor: '#3a3a3a',
              }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center',
                marginRight: 14,
              }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#f0f0f0', fontSize: 15, fontWeight: '500' }}>{item.title}</Text>
                  {(item as any).badgeKey === 'friends' && totalPending > 0 && (
                    <View style={{ backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{totalPending}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: '#9a9a9a', fontSize: 12 }}>{item.description}</Text>
              </View>
              <Text style={{ color: '#4a4a4a', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Competição
        </Text>
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16, marginBottom: 20,
          borderWidth: 1, borderColor: '#4a4a4a', overflow: 'hidden',
        }}>
          {QUICK_STATS_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => handleNavigation(item.route)}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: 16,
                borderBottomWidth: idx < QUICK_STATS_ITEMS.length - 1 ? 1 : 0,
                borderBottomColor: '#3a3a3a',
              }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center',
                marginRight: 14,
              }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f0f0f0', fontSize: 15, fontWeight: '500' }}>{item.title}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 12 }}>{item.description}</Text>
              </View>
              <Text style={{ color: '#4a4a4a', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings & Account */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Conta
        </Text>
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16, marginBottom: 20,
          borderWidth: 1, borderColor: '#4a4a4a', overflow: 'hidden',
        }}>
          <TouchableOpacity
            onPress={() => router.push('/settings' as any)}
            style={{
              flexDirection: 'row', alignItems: 'center', padding: 16,
              borderBottomWidth: 1, borderBottomColor: '#3a3a3a',
            }}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center', marginRight: 14,
            }}>
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </View>
            <Text style={{ color: '#f0f0f0', fontSize: 15, fontWeight: '500', flex: 1 }}>Configurações</Text>
            <Text style={{ color: '#4a4a4a', fontSize: 18 }}>›</Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity
              onPress={signOut}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}>
                <Text style={{ fontSize: 20 }}>🚪</Text>
              </View>
              <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '500' }}>Sair da Conta</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App info */}
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text style={{ color: '#4a4a4a', fontSize: 12 }}>OitoPorOito Mobile v1.0.0</Text>
          <Text style={{ color: '#4a4a4a', fontSize: 12, marginTop: 4 }}>Plataforma de Xadrez Brasileira</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
