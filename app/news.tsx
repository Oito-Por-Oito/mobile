import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

const NEWS_ITEMS = [
  {
    id: 1,
    title: 'Magnus Carlsen vence torneio de blitz em Oslo',
    summary: 'O campeão mundial mostrou mais uma vez seu domínio no xadrez de ritmo acelerado.',
    category: 'Torneios',
    date: '20 Fev 2026',
    readTime: '3 min',
    icon: '🏆',
  },
  {
    id: 2,
    title: 'Novas regras da FIDE para 2026 entram em vigor',
    summary: 'A federação internacional de xadrez anuncia mudanças importantes nas regras de torneios.',
    category: 'FIDE',
    date: '19 Fev 2026',
    readTime: '5 min',
    icon: '📋',
  },
  {
    id: 3,
    title: 'Jovem prodígio brasileiro conquista título de Grande Mestre',
    summary: 'Com apenas 15 anos, o brasileiro se torna o mais jovem GM da história do país.',
    category: 'Brasil',
    date: '18 Fev 2026',
    readTime: '4 min',
    icon: '🇧🇷',
  },
  {
    id: 4,
    title: 'Campeonato Brasileiro de Xadrez 2026: inscrições abertas',
    summary: 'A CBX abre inscrições para o maior torneio de xadrez do Brasil.',
    category: 'Brasil',
    date: '17 Fev 2026',
    readTime: '2 min',
    icon: '📝',
  },
  {
    id: 5,
    title: 'Análise: As melhores partidas do Torneio dos Candidatos',
    summary: 'Especialistas analisam os lances mais brilhantes da disputa pelo título mundial.',
    category: 'Análise',
    date: '16 Fev 2026',
    readTime: '8 min',
    icon: '🔍',
  },
  {
    id: 6,
    title: 'IA de xadrez supera humanos em análise de posições complexas',
    summary: 'Novo estudo mostra avanços impressionantes na inteligência artificial aplicada ao xadrez.',
    category: 'Tecnologia',
    date: '15 Fev 2026',
    readTime: '6 min',
    icon: '🤖',
  },
];

const CATEGORIES = ['Todos', 'Torneios', 'Brasil', 'FIDE', 'Análise', 'Tecnologia'];

export default function NewsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredNews = selectedCategory === 'Todos'
    ? NEWS_ITEMS
    : NEWS_ITEMS.filter(n => n.category === selectedCategory);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ color: '#9a9a9a', fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#f0f0f0' }}>📰 Notícias</Text>
        </View>

        {/* Quick links to subsections */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {[
            { label: '📰 Xadrez Hoje', route: '/news/chess-today' },
            { label: '📝 Artigos', route: '/news/articles' },
          ].map(link => (
            <TouchableOpacity key={link.route} onPress={() => router.push(link.route as any)}
              style={{ backgroundColor: '#2c2c2c', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#3a3a3a' }}>
              <Text style={{ color: '#d4a843', fontSize: 12, fontWeight: '600' }}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={{
                  backgroundColor: selectedCategory === cat ? '#d4a843' : '#2c2c2c',
                  borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16,
                  borderWidth: 1, borderColor: selectedCategory === cat ? '#d4a843' : '#4a4a4a',
                }}
              >
                <Text style={{
                  color: selectedCategory === cat ? '#1e1e1e' : '#9a9a9a',
                  fontSize: 13, fontWeight: selectedCategory === cat ? '600' : '400',
                }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Featured news */}
        {selectedCategory === 'Todos' && (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 20, padding: 20, marginBottom: 16,
            borderWidth: 1, borderColor: '#d4a843' + '40',
          }}>
            <View style={{
              backgroundColor: '#d4a843' + '20', borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12,
            }}>
              <Text style={{ color: '#d4a843', fontSize: 12, fontWeight: '600' }}>⭐ DESTAQUE</Text>
            </View>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>{NEWS_ITEMS[0].icon}</Text>
            <Text style={{ color: '#f0f0f0', fontSize: 18, fontWeight: 'bold', lineHeight: 26, marginBottom: 8 }}>
              {NEWS_ITEMS[0].title}
            </Text>
            <Text style={{ color: '#9a9a9a', fontSize: 14, lineHeight: 22, marginBottom: 12 }}>
              {NEWS_ITEMS[0].summary}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#9a9a9a', fontSize: 12 }}>
                {NEWS_ITEMS[0].date} • {NEWS_ITEMS[0].readTime} de leitura
              </Text>
              <View style={{
                backgroundColor: '#3a3a3a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
              }}>
                <Text style={{ color: '#d4a843', fontSize: 12 }}>{NEWS_ITEMS[0].category}</Text>
              </View>
            </View>
          </View>
        )}

        {/* News list */}
        {filteredNews.slice(selectedCategory === 'Todos' ? 1 : 0).map((news) => (
          <TouchableOpacity
            key={news.id}
            style={{
              backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16, marginBottom: 12,
              borderWidth: 1, borderColor: '#4a4a4a', flexDirection: 'row', alignItems: 'flex-start',
            }}
          >
            <View style={{
              width: 56, height: 56, borderRadius: 12,
              backgroundColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center',
              marginRight: 14, flexShrink: 0,
            }}>
              <Text style={{ fontSize: 28 }}>{news.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f0f0f0', fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 4 }}>
                {news.title}
              </Text>
              <Text style={{ color: '#9a9a9a', fontSize: 12, lineHeight: 18, marginBottom: 8 }}>
                {news.summary}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#666', fontSize: 11 }}>
                  {news.date} • {news.readTime}
                </Text>
                <View style={{
                  backgroundColor: '#3a3a3a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                }}>
                  <Text style={{ color: '#9a9a9a', fontSize: 11 }}>{news.category}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
