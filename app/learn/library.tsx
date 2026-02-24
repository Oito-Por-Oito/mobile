import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
const BOOKS = [
  { id: 1, title: 'My System', author: 'Nimzowitsch', level: 'Avançado', emoji: '📖' },
  { id: 2, title: 'Chess Fundamentals', author: 'Capablanca', level: 'Iniciante', emoji: '📗' },
  { id: 3, title: 'Zurique 1953', author: 'Bronstein', level: 'Intermediário', emoji: '📘' },
  { id: 4, title: 'How to Reassess Your Chess', author: 'Silman', level: 'Intermediário', emoji: '📙' },
  { id: 5, title: 'Logical Chess Move by Move', author: 'Chernev', level: 'Iniciante', emoji: '📚' },
];
export default function LibraryScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.title}>📚 Biblioteca</Text>
          <Text style={styles.subtitle}>Livros e recursos de xadrez recomendados</Text>
        </View>
        {BOOKS.map(book => (
          <View key={book.id} style={styles.bookCard}>
            <Text style={styles.bookEmoji}>{book.emoji}</Text>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>por {book.author}</Text>
              <View style={styles.levelBadge}><Text style={styles.levelText}>{book.level}</Text></View>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#d4a843', fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  bookCard: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3a3a3a' },
  bookEmoji: { fontSize: 32 },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 15, fontWeight: '700', color: '#f0f0f0' },
  bookAuthor: { fontSize: 12, color: '#888', marginTop: 2 },
  levelBadge: { backgroundColor: '#d4a84320', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 6 },
  levelText: { fontSize: 11, color: '#d4a843', fontWeight: '600' },
});
