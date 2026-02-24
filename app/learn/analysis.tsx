import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

export default function LearnAnalysisScreen() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backText}>← Voltar</Text></TouchableOpacity>
          <Text style={styles.title}>📊 Análise de Partidas</Text>
          <Text style={styles.subtitle}>Analise suas partidas com engine de xadrez</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Analisar Partida</Text>
          <Text style={styles.cardDesc}>Cole o PGN ou FEN de uma partida para análise completa com Stockfish.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/history' as any)} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>Analisar do Histórico →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ Análise Rápida</Text>
          <Text style={styles.cardDesc}>Selecione uma partida recente para análise instantânea de precisão.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/history' as any)} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>Ver Histórico →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>A análise de precisão com Stockfish está disponível no replay de cada partida. Toque em qualquer partida no histórico e ative o botão 🔍 para ver a classificação de cada lance.</Text>
        </View>
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
  card: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#3a3a3a' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f0f0f0', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#aaa', lineHeight: 18, marginBottom: 12 },
  actionBtn: { backgroundColor: '#d4a84320', borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#d4a84340' },
  actionBtnText: { color: '#d4a843', fontWeight: '700', fontSize: 14 },
  infoBox: { backgroundColor: '#2563eb15', borderRadius: 12, padding: 14, flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: '#2563eb30' },
  infoIcon: { fontSize: 20 },
  infoText: { flex: 1, fontSize: 13, color: '#aaa', lineHeight: 18 },
});
