import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

const CATEGORIES = ['Todos', 'Iniciante', 'Abertura', 'Tática', 'Estratégia', 'Final', 'Avançado'];

const COURSES = [
  { id: 1, title: 'Xadrez para Iniciantes', category: 'Iniciante', lessons: 12, duration: '2h 30min', students: 3421, rating: 4.8, free: true, emoji: '♟️', instructor: 'Prof. Lima', progress: 0 },
  { id: 2, title: 'Táticas Essenciais', category: 'Tática', lessons: 18, duration: '3h 45min', students: 2156, rating: 4.9, free: true, emoji: '⚔️', instructor: 'IM Souza', progress: 0 },
  { id: 3, title: 'Aberturas para Brancas', category: 'Abertura', lessons: 15, duration: '3h 20min', students: 1876, rating: 4.7, free: false, emoji: '♔', instructor: 'GM Ferreira', progress: 0 },
  { id: 4, title: 'Finais de Peões', category: 'Final', lessons: 10, duration: '2h 00min', students: 1243, rating: 4.6, free: false, emoji: '🏁', instructor: 'IM Alves', progress: 0 },
  { id: 5, title: 'Estratégia Avançada', category: 'Avançado', lessons: 30, duration: '7h 00min', students: 876, rating: 4.9, free: false, emoji: '🎯', instructor: 'GM Petrov', progress: 0 },
  { id: 6, title: 'Defesa Siciliana Completa', category: 'Abertura', lessons: 20, duration: '4h 50min', students: 1543, rating: 4.7, free: false, emoji: '🛡️', instructor: 'IM Costa', progress: 0 },
];

export default function CoursesScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('Todos');
  const filtered = COURSES.filter(c => activeCategory === 'Todos' || c.category === activeCategory);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🎓 Cursos</Text>
          <Text style={styles.subtitle}>Cursos completos para evoluir seu jogo</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map(course => (
          <TouchableOpacity key={course.id} style={styles.courseCard} activeOpacity={0.85}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseEmoji}>{course.emoji}</Text>
              <View style={styles.courseInfo}>
                <View style={styles.courseTopRow}>
                  <Text style={styles.courseName}>{course.title}</Text>
                  {course.free ? (
                    <View style={styles.freeBadge}><Text style={styles.freeText}>GRÁTIS</Text></View>
                  ) : (
                    <View style={styles.premiumBadge}><Text style={styles.premiumText}>PREMIUM</Text></View>
                  )}
                </View>
                <Text style={styles.courseInstructor}>por {course.instructor}</Text>
              </View>
            </View>
            <View style={styles.courseStats}>
              <Text style={styles.courseStat}>📚 {course.lessons} lições</Text>
              <Text style={styles.courseStat}>⏱ {course.duration}</Text>
              <Text style={styles.courseStat}>👥 {course.students.toLocaleString()}</Text>
              <Text style={styles.courseStat}>⭐ {course.rating}</Text>
            </View>
            <TouchableOpacity style={styles.startBtn} activeOpacity={0.8}>
              <Text style={styles.startBtnText}>{course.progress > 0 ? `Continuar (${course.progress}%)` : 'Começar Curso'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#d4a843', fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2c2c2c', borderWidth: 1, borderColor: '#3a3a3a' },
  catBtnActive: { backgroundColor: '#d4a84320', borderColor: '#d4a843' },
  catText: { fontSize: 13, color: '#888', fontWeight: '600' },
  catTextActive: { color: '#d4a843' },
  courseCard: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#3a3a3a' },
  courseHeader: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  courseEmoji: { fontSize: 32, marginTop: 2 },
  courseInfo: { flex: 1 },
  courseTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  courseName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#f0f0f0' },
  freeBadge: { backgroundColor: '#22c55e20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  freeText: { fontSize: 10, fontWeight: '800', color: '#22c55e' },
  premiumBadge: { backgroundColor: '#d4a84320', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  premiumText: { fontSize: 10, fontWeight: '800', color: '#d4a843' },
  courseInstructor: { fontSize: 12, color: '#888' },
  courseStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  courseStat: { fontSize: 12, color: '#aaa' },
  startBtn: { backgroundColor: '#d4a84320', borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#d4a84340' },
  startBtnText: { color: '#d4a843', fontWeight: '700', fontSize: 14 },
});
