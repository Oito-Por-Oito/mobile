import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';

const PLANS = [
  { id: 'patron', name: 'Patrono', emoji: '♟️', price: 'R$ 9,90/mês', color: '#2563eb20', border: '#2563eb40', benefits: ['Sem anúncios', 'Tabuleiros premium', 'Badge exclusivo', 'Análise ilimitada'] },
  { id: 'supporter', name: 'Apoiador', emoji: '⭐', price: 'R$ 19,90/mês', color: '#7c3aed20', border: '#7c3aed40', popular: true, benefits: ['Tudo do Patrono', 'Cursos premium', 'Puzzles ilimitados', 'Suporte prioritário', 'Acesso antecipado'] },
  { id: 'champion', name: 'Campeão', emoji: '👑', price: 'R$ 39,90/mês', color: '#d4a84320', border: '#d4a84360', benefits: ['Tudo do Apoiador', 'Coaching mensal', 'Torneios VIP', 'Badge dourado', 'Análise com GM'] },
];

const RECENT_PATRONS = [
  { name: 'GrandMaster_BR', emoji: '♟️', time: '2 min atrás' },
  { name: 'XadrezLover99', emoji: '⚡', time: '8 min atrás' },
  { name: 'TorreDoRei', emoji: '🏰', time: '15 min atrás' },
  { name: 'PeaoCoroado', emoji: '👑', time: '22 min atrás' },
  { name: 'BishopMaster', emoji: '🎯', time: '34 min atrás' },
];

const STATS = [
  { value: '12.847', label: 'Patronos ativos' },
  { value: 'R$ 48k', label: 'Arrecadados/mês' },
  { value: '99.9%', label: 'Uptime' },
  { value: '0', label: 'Anúncios' },
];

export default function DonateScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>❤️ Apoie o OitoPorOito</Text>
          <Text style={styles.subtitle}>Mantenha o xadrez brasileiro gratuito e acessível para todos</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          {STATS.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Plans */}
        <Text style={styles.sectionLabel}>Escolha seu plano</Text>
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, { backgroundColor: plan.color, borderColor: plan.border }, selectedPlan === plan.id && styles.planCardSelected]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.85}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>⭐ MAIS POPULAR</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text style={styles.planEmoji}>{plan.emoji}</Text>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
            </View>
            <View style={styles.benefitsList}>
              {plan.benefits.map(b => (
                <View key={b} style={styles.benefitRow}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>
            {selectedPlan === plan.id && (
              <TouchableOpacity
                style={styles.subscribeBtn}
                onPress={() => Linking.openURL('https://oitoporoito.com/donate')}
                activeOpacity={0.8}
              >
                <Text style={styles.subscribeBtnText}>Assinar {plan.name} →</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}

        {/* Recent patrons */}
        <Text style={styles.sectionLabel}>Patronos Recentes</Text>
        <View style={styles.patronsCard}>
          {RECENT_PATRONS.map((p, i) => (
            <View key={i} style={styles.patronRow}>
              <Text style={styles.patronEmoji}>{p.emoji}</Text>
              <Text style={styles.patronName}>{p.name}</Text>
              <Text style={styles.patronTime}>{p.time}</Text>
            </View>
          ))}
        </View>

        {/* One-time donation */}
        <View style={styles.oneTimeCard}>
          <Text style={styles.oneTimeTitle}>💝 Doação Única</Text>
          <Text style={styles.oneTimeDesc}>Prefere fazer uma contribuição única? Também aceitamos via PIX, PayPal e cartão de crédito.</Text>
          <TouchableOpacity
            style={styles.oneTimeBtn}
            onPress={() => Linking.openURL('https://oitoporoito.com/donate')}
            activeOpacity={0.8}
          >
            <Text style={styles.oneTimeBtnText}>Fazer Doação Única</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#d4a843', fontSize: 14 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f0f0f0' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4, lineHeight: 20 },
  statsCard: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#3a3a3a' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#d4a843' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: '#3a3a3a' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#d4a843', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  planCard: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  planCardSelected: { borderColor: '#d4a843' },
  popularBadge: { backgroundColor: '#d4a84320', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  popularText: { fontSize: 10, fontWeight: '800', color: '#d4a843', letterSpacing: 0.5 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  planEmoji: { fontSize: 32 },
  planInfo: {},
  planName: { fontSize: 18, fontWeight: '800', color: '#f0f0f0' },
  planPrice: { fontSize: 14, color: '#d4a843', fontWeight: '600', marginTop: 2 },
  benefitsList: { gap: 6, marginBottom: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkIcon: { fontSize: 14, color: '#22c55e', fontWeight: '800' },
  benefitText: { fontSize: 13, color: '#ccc' },
  subscribeBtn: { marginTop: 14, backgroundColor: '#d4a843', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  subscribeBtnText: { color: '#1a1a1a', fontWeight: '800', fontSize: 15 },
  patronsCard: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#3a3a3a', gap: 10 },
  patronRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  patronEmoji: { fontSize: 20 },
  patronName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#f0f0f0' },
  patronTime: { fontSize: 11, color: '#888' },
  oneTimeCard: { backgroundColor: '#2c2c2c', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#3a3a3a' },
  oneTimeTitle: { fontSize: 16, fontWeight: '700', color: '#f0f0f0', marginBottom: 6 },
  oneTimeDesc: { fontSize: 13, color: '#888', lineHeight: 18, marginBottom: 14 },
  oneTimeBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  oneTimeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
