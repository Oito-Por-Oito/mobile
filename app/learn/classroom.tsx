import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
const ROOMS = [
  { id: 1, name: 'Sala Iniciantes', teacher: 'Prof. Lima', students: 12, status: 'Ao Vivo', emoji: '🟢' },
  { id: 2, name: 'Táticas Avançadas', teacher: 'IM Souza', students: 8, status: 'Em breve', emoji: '🟡' },
  { id: 3, name: 'Aberturas Clássicas', teacher: 'GM Ferreira', students: 15, status: 'Ao Vivo', emoji: '🟢' },
];
export default function ClassroomScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.title}>🏫 Sala de Aula</Text>
          <Text style={styles.subtitle}>Aulas ao vivo com instrutores certificados</Text>
        </View>
        {ROOMS.map(room => (
          <TouchableOpacity key={room.id} style={styles.card} activeOpacity={0.85}>
            <View style={styles.cardRow}>
              <Text style={styles.statusEmoji}>{room.emoji}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomTeacher}>por {room.teacher}</Text>
                <Text style={styles.roomStudents}>👥 {room.students} alunos</Text>
              </View>
              <TouchableOpacity style={styles.joinBtn} activeOpacity={0.8}>
                <Text style={styles.joinBtnText}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  card: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#3a3a3a' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  roomName: { fontSize: 15, fontWeight: '700', color: '#f0f0f0' },
  roomTeacher: { fontSize: 12, color: '#888', marginTop: 2 },
  roomStudents: { fontSize: 12, color: '#aaa', marginTop: 2 },
  joinBtn: { backgroundColor: '#d4a843', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  joinBtnText: { color: '#1a1a1a', fontWeight: '700', fontSize: 13 },
});
