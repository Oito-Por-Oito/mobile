import React, { useState } from 'react';
import {
  Modal, View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { TIME_CONTROL_OPTIONS, ColorPreference, useChallenge } from '@/hooks/supabase/use-challenge';

type Friend = {
  user_id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
};

type Props = {
  friend: Friend;
  visible: boolean;
  onClose: () => void;
  onSent?: () => void;
};

const COLOR_OPTIONS: { value: ColorPreference; label: string; icon: string }[] = [
  { value: 'white', label: 'Brancas', icon: '⬜' },
  { value: 'black', label: 'Pretas', icon: '⬛' },
  { value: 'random', label: 'Aleatório', icon: '🎲' },
];

export default function ChallengeModal({ friend, visible, onClose, onSent }: Props) {
  const colors = useColors();
  const { sendChallenge, loading, error, pendingChallenge, cancelChallenge } = useChallenge(friend.user_id);

  const [selectedTime, setSelectedTime] = useState(TIME_CONTROL_OPTIONS[2]); // Blitz 3+0
  const [colorPref, setColorPref] = useState<ColorPreference>('random');
  const [sent, setSent] = useState(false);

  const friendName = friend.display_name || friend.username || 'Jogador';

  const handleSend = async () => {
    const result = await sendChallenge({
      timeControl: selectedTime.timeControl,
      initialTime: selectedTime.initialTime,
      increment: selectedTime.increment,
      colorPreference: colorPref,
    });
    if (result) {
      setSent(true);
      onSent?.();
    }
  };

  const handleCancel = async () => {
    if (pendingChallenge) {
      await cancelChallenge(pendingChallenge.id);
    }
    setSent(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={[styles.title, { color: colors.foreground }]}>
              ♟ Desafiar {friendName}
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Escolha o controle de tempo e sua cor preferida
            </Text>
          </View>

          {sent ? (
            // Sent state
            <View style={styles.sentContainer}>
              <Text style={styles.sentIcon}>⏳</Text>
              <Text style={[styles.sentTitle, { color: colors.foreground }]}>
                Desafio enviado!
              </Text>
              <Text style={[styles.sentSubtitle, { color: colors.muted }]}>
                Aguardando {friendName} aceitar...
              </Text>
              <Pressable
                onPress={handleCancel}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.muted }]}>
                  Cancelar desafio
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {/* Time control */}
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Controle de Tempo</Text>
              <View style={styles.timeGrid}>
                {TIME_CONTROL_OPTIONS.map((opt) => {
                  const isSelected = selectedTime.label === opt.label;
                  return (
                    <Pressable
                      key={opt.label}
                      onPress={() => setSelectedTime(opt)}
                      style={[
                        styles.timeCard,
                        {
                          backgroundColor: isSelected ? colors.primary + '25' : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.timeIcon}>{opt.icon}</Text>
                      <Text style={[styles.timeLabel, { color: isSelected ? colors.primary : colors.foreground }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Color preference */}
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Sua Cor</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((opt) => {
                  const isSelected = colorPref === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setColorPref(opt.value)}
                      style={[
                        styles.colorCard,
                        {
                          backgroundColor: isSelected ? colors.primary + '25' : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                          flex: 1,
                        },
                      ]}
                    >
                      <Text style={styles.colorIcon}>{opt.icon}</Text>
                      <Text style={[styles.colorLabel, { color: isSelected ? colors.primary : colors.foreground }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {error && (
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  onPress={onClose}
                  style={[styles.cancelBtn, { borderColor: colors.border, flex: 1 }]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.muted }]}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleSend}
                  disabled={loading}
                  style={[styles.sendBtn, { backgroundColor: colors.primary, flex: 1 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.sendBtnText}>Enviar Desafio ♟</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  timeIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorCard: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  colorIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  cancelBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sendBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  sentContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 12,
  },
  sentIcon: {
    fontSize: 48,
  },
  sentTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sentSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
