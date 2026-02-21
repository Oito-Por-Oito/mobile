import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

const LEARN_SECTIONS = [
  {
    id: 'lessons',
    icon: '📖',
    title: 'Lições',
    description: 'Aprenda xadrez passo a passo',
    color: '#60a5fa',
    items: [
      { title: 'Regras Básicas', level: 'Iniciante', lessons: 8, icon: '♟' },
      { title: 'Aberturas Fundamentais', level: 'Iniciante', lessons: 12, icon: '♙' },
      { title: 'Táticas Básicas', level: 'Intermediário', lessons: 15, icon: '⚔️' },
      { title: 'Finais de Jogo', level: 'Intermediário', lessons: 10, icon: '👑' },
      { title: 'Estratégia Avançada', level: 'Avançado', lessons: 20, icon: '🧠' },
    ],
  },
  {
    id: 'openings',
    icon: '♟',
    title: 'Aberturas',
    description: 'Domine as aberturas mais populares',
    color: '#a78bfa',
    items: [
      { title: 'Abertura Italiana', level: 'Iniciante', lessons: 6, icon: '🇮🇹' },
      { title: 'Defesa Siciliana', level: 'Intermediário', lessons: 10, icon: '🏰' },
      { title: 'Gambito da Rainha', level: 'Intermediário', lessons: 8, icon: '♛' },
      { title: 'Abertura Espanhola', level: 'Avançado', lessons: 12, icon: '🇪🇸' },
      { title: 'Defesa Francesa', level: 'Intermediário', lessons: 7, icon: '🇫🇷' },
    ],
  },
  {
    id: 'endgames',
    icon: '👑',
    title: 'Finais',
    description: 'Converta vantagens em vitórias',
    color: '#f59e0b',
    items: [
      { title: 'Rei e Peão vs Rei', level: 'Iniciante', lessons: 5, icon: '♔' },
      { title: 'Finais de Torre', level: 'Intermediário', lessons: 8, icon: '♖' },
      { title: 'Finais de Bispo', level: 'Intermediário', lessons: 6, icon: '♗' },
      { title: 'Finais de Dama', level: 'Avançado', lessons: 10, icon: '♕' },
    ],
  },
  {
    id: 'tactics',
    icon: '⚡',
    title: 'Táticas',
    description: 'Aprenda combinações táticas',
    color: '#ef4444',
    items: [
      { title: 'Garfo', level: 'Iniciante', lessons: 5, icon: '🍴' },
      { title: 'Cravada', level: 'Iniciante', lessons: 5, icon: '📌' },
      { title: 'Raio-X', level: 'Intermediário', lessons: 6, icon: '🎯' },
      { title: 'Ataque Duplo', level: 'Intermediário', lessons: 7, icon: '⚔️' },
      { title: 'Sacrifício', level: 'Avançado', lessons: 8, icon: '💎' },
    ],
  },
];

const VIDEOS = [
  { title: 'Como jogar xadrez para iniciantes', duration: '15:30', views: '120K', icon: '🎬' },
  { title: 'As 10 melhores aberturas', duration: '22:45', views: '89K', icon: '🎬' },
  { title: 'Táticas que todo jogador deve saber', duration: '18:20', views: '67K', icon: '🎬' },
  { title: 'Finais de torre: guia completo', duration: '30:15', views: '45K', icon: '🎬' },
];

export default function LearnScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'courses' | 'videos' | 'analysis'>('courses');
  const [expandedSection, setExpandedSection] = useState<string | null>('lessons');

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 20, paddingTop: 8 }}>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' }}>📚 Aprender</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, marginTop: 4 }}>
            Lições, cursos e análises para todos os níveis
          </Text>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: '#2c2c2c', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {[
            { id: 'courses', label: 'Cursos' },
            { id: 'videos', label: 'Vídeos' },
            { id: 'analysis', label: 'Análise' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                backgroundColor: activeTab === tab.id ? '#d4a843' : 'transparent',
              }}
            >
              <Text style={{
                color: activeTab === tab.id ? '#1e1e1e' : '#9a9a9a',
                fontWeight: activeTab === tab.id ? 'bold' : '500',
                fontSize: 14,
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Courses Tab */}
        {activeTab === 'courses' && LEARN_SECTIONS.map((section) => (
          <View key={section.id} style={{ marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              style={{
                backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16,
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 1, borderColor: expandedSection === section.id ? section.color + '60' : '#4a4a4a',
              }}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: section.color + '20', alignItems: 'center', justifyContent: 'center',
                marginRight: 14, borderWidth: 1, borderColor: section.color + '40',
              }}>
                <Text style={{ fontSize: 24 }}>{section.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f0f0f0', fontWeight: '600', fontSize: 16 }}>{section.title}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 13 }}>{section.description}</Text>
              </View>
              <Text style={{ color: '#9a9a9a', fontSize: 18 }}>
                {expandedSection === section.id ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expandedSection === section.id && (
              <View style={{
                backgroundColor: '#252525', borderRadius: 12, marginTop: 4,
                borderWidth: 1, borderColor: '#4a4a4a',
                overflow: 'hidden',
              }}>
                {section.items.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={{
                      flexDirection: 'row', alignItems: 'center', padding: 14,
                      borderBottomWidth: idx < section.items.length - 1 ? 1 : 0,
                      borderBottomColor: '#3a3a3a',
                    }}
                  >
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#f0f0f0', fontSize: 14, fontWeight: '500' }}>{item.title}</Text>
                      <Text style={{ color: '#9a9a9a', fontSize: 12, marginTop: 2 }}>
                        {item.lessons} lições • {item.level}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: '#3a3a3a', borderRadius: 8,
                      paddingHorizontal: 8, paddingVertical: 4,
                    }}>
                      <Text style={{ color: '#9a9a9a', fontSize: 11 }}>{item.level}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <View>
            <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Vídeos em Destaque
            </Text>
            {VIDEOS.map((video, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 12,
                  borderWidth: 1, borderColor: '#4a4a4a', flexDirection: 'row', alignItems: 'center',
                }}
              >
                <View style={{
                  width: 80, height: 56, backgroundColor: '#3a3a3a', borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center', marginRight: 14,
                }}>
                  <Text style={{ fontSize: 28 }}>{video.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#f0f0f0', fontSize: 14, fontWeight: '500', lineHeight: 20 }}>
                    {video.title}
                  </Text>
                  <Text style={{ color: '#9a9a9a', fontSize: 12, marginTop: 4 }}>
                    {video.duration} • {video.views} visualizações
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <View>
            <View style={{
              backgroundColor: '#2c2c2c', borderRadius: 16, padding: 24,
              borderWidth: 1, borderColor: '#4a4a4a', alignItems: 'center',
            }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
              <Text style={{ color: '#f0f0f0', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                Análise de Partidas
              </Text>
              <Text style={{ color: '#9a9a9a', textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>
                Analise suas partidas com o motor de xadrez e descubra onde melhorar
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#d4a843', borderRadius: 12, padding: 14, paddingHorizontal: 28,
                }}
              >
                <Text style={{ color: '#1e1e1e', fontWeight: 'bold', fontSize: 15 }}>
                  Analisar Partida
                </Text>
              </TouchableOpacity>
            </View>

            {/* Analysis features */}
            {[
              { icon: '📊', title: 'Avaliação por Lance', desc: 'Veja a avaliação do motor para cada lance' },
              { icon: '❌', title: 'Erros e Imprecisões', desc: 'Identifique onde você errou' },
              { icon: '💡', title: 'Lances Alternativos', desc: 'Descubra os melhores lances possíveis' },
              { icon: '📈', title: 'Precisão Geral', desc: 'Calcule sua precisão na partida' },
            ].map((feature, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginTop: 12,
                  borderWidth: 1, borderColor: '#4a4a4a', flexDirection: 'row', alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 28, marginRight: 14 }}>{feature.icon}</Text>
                <View>
                  <Text style={{ color: '#f0f0f0', fontWeight: '600', fontSize: 14 }}>{feature.title}</Text>
                  <Text style={{ color: '#9a9a9a', fontSize: 13 }}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
