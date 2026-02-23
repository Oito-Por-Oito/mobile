import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'general', label: 'Geral' },
  { id: 'openings', label: 'Aberturas' },
  { id: 'tactics', label: 'Táticas' },
  { id: 'endgames', label: 'Finais' },
  { id: 'news', label: 'Notícias' },
];

const SAMPLE_POSTS = [
  {
    id: '1', category: 'openings', title: 'Qual é a melhor resposta para 1.e4 como pretas?',
    author: 'GrandeMestre_BR', avatar: '♟', replies: 24, views: 312,
    lastActivity: '2h atrás', pinned: true,
    preview: 'Estou pensando em adotar a Siciliana, mas a Francesa também parece sólida...',
  },
  {
    id: '2', category: 'tactics', title: 'Puzzle difícil que encontrei numa partida — alguém resolve?',
    author: 'TaticoNato', avatar: '🧩', replies: 8, views: 145,
    lastActivity: '4h atrás', pinned: false,
    preview: 'Brancas jogam e vencem em 3 lances. FEN: r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
  },
  {
    id: '3', category: 'general', title: 'Dicas para melhorar no blitz sem estudar muito?',
    author: 'BlitzFanático', avatar: '⚡', replies: 31, views: 489,
    lastActivity: '6h atrás', pinned: false,
    preview: 'Jogo há 2 anos e estou travado no 1200 de blitz. Alguém tem dicas práticas?',
  },
  {
    id: '4', category: 'endgames', title: 'Torre vs Bispo: como converter a vantagem?',
    author: 'EndgameKing', avatar: '🏆', replies: 15, views: 203,
    lastActivity: '1d atrás', pinned: false,
    preview: 'Sempre perco esses finais mesmo tendo vantagem material. Algum recurso bom?',
  },
  {
    id: '5', category: 'news', title: 'Magnus Carlsen anuncia novo torneio online — inscrições abertas',
    author: 'XadrezNews', avatar: '📰', replies: 42, views: 1240,
    lastActivity: '2d atrás', pinned: false,
    preview: 'O campeão mundial anunciou hoje um torneio online com premiação de $50.000...',
  },
  {
    id: '6', category: 'general', title: 'Qual tabuleiro físico vocês recomendam para iniciantes?',
    author: 'NovoJogador2024', avatar: '👶', replies: 19, views: 278,
    lastActivity: '3d atrás', pinned: false,
    preview: 'Quero comprar um tabuleiro para estudar em casa. Qual a melhor relação custo-benefício?',
  },
];

export default function ForumScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredPosts = SAMPLE_POSTS.filter(p =>
    selectedCategory === 'all' || p.category === selectedCategory
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#d4a843', fontSize: 15 }}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' }}>Fórum</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, marginTop: 4 }}>
            Discuta xadrez com a comunidade
          </Text>
        </View>

        {/* Novo Post */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <TouchableOpacity style={{
            backgroundColor: '#d4a843', borderRadius: 12, padding: 14,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}>
            <Text style={{ fontSize: 18 }}>✏️</Text>
            <Text style={{ color: '#1e1e1e', fontWeight: 'bold', fontSize: 15 }}>Criar Nova Discussão</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros por categoria */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: selectedCategory === cat.id ? '#d4a843' : '#2c2c2c',
                  borderWidth: 1, borderColor: selectedCategory === cat.id ? '#d4a843' : '#4a4a4a',
                }}
              >
                <Text style={{ color: selectedCategory === cat.id ? '#1e1e1e' : '#9a9a9a', fontWeight: '600', fontSize: 13 }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Posts */}
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {filteredPosts.map(post => (
            <TouchableOpacity
              key={post.id}
              style={{
                backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16,
                borderWidth: 1, borderColor: post.pinned ? '#d4a843' : '#3a3a3a',
              }}
            >
              {post.pinned && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 }}>
                  <Text style={{ fontSize: 12 }}>📌</Text>
                  <Text style={{ color: '#d4a843', fontSize: 11, fontWeight: '600' }}>FIXADO</Text>
                </View>
              )}
              <Text style={{ color: '#f0f0f0', fontSize: 15, fontWeight: '600', marginBottom: 6, lineHeight: 21 }}>
                {post.title}
              </Text>
              <Text style={{ color: '#9a9a9a', fontSize: 12, lineHeight: 17, marginBottom: 10 }}>
                {post.preview}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>{post.avatar}</Text>
                  <Text style={{ color: '#d4a843', fontSize: 12, fontWeight: '500' }}>{post.author}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Text style={{ color: '#6a6a6a', fontSize: 12 }}>💬 {post.replies}</Text>
                  <Text style={{ color: '#6a6a6a', fontSize: 12 }}>👁 {post.views}</Text>
                  <Text style={{ color: '#6a6a6a', fontSize: 12 }}>{post.lastActivity}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
