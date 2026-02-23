import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { usePendingChallenges, Challenge } from '@/hooks/supabase/use-challenge';

function SingleBanner({ challenge, onAccept, onDecline, colors }: {
  challenge: Challenge;
  onAccept: (c: Challenge) => void;
  onDecline: (id: string) => void;
  colors: any;
}) {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const challenger = challenge.challenger as any;
  const name = challenger?.display_name || challenger?.username || 'Jogador';
  const rating = challenger?.rating_blitz || challenger?.rating_rapid || '?';

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, []);

  const timeLabel = (() => {
    const mins = Math.floor(challenge.initial_time / 60);
    const inc = challenge.increment;
    return `${mins}+${inc}`;
  })();

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.bannerLeft}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '30', borderColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {name[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.bannerInfo}>
          <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
            ♟ Desafio de {name}
          </Text>
          <Text style={[styles.bannerSub, { color: colors.muted }]}>
            {challenge.time_control} · {timeLabel} · {rating} pts
          </Text>
        </View>
      </View>
      <View style={styles.bannerActions}>
        <Pressable
          onPress={() => onDecline(challenge.id)}
          style={[styles.declineBtn, { borderColor: colors.error + '60' }]}
        >
          <Text style={[styles.declineBtnText, { color: colors.error }]}>✕</Text>
        </Pressable>
        <Pressable
          onPress={() => onAccept(challenge)}
          style={[styles.acceptBtn, { backgroundColor: colors.success }]}
        >
          <Text style={styles.acceptBtnText}>✓ Aceitar</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function ChallengeBanner() {
  const colors = useColors();
  const router = useRouter();
  const { incomingChallenges, acceptChallenge, declineChallenge } = usePendingChallenges();

  if (incomingChallenges.length === 0) return null;

  const handleAccept = async (challenge: Challenge) => {
    const gameId = await acceptChallenge(challenge);
    if (gameId) {
      router.push(`/play-online?gameId=${gameId}`);
    }
  };

  const handleDecline = async (challengeId: string) => {
    await declineChallenge(challengeId);
  };

  // Show only the most recent challenge
  const latest = incomingChallenges[0];

  return (
    <View style={styles.container} pointerEvents="box-none">
      <SingleBanner
        key={latest.id}
        challenge={latest}
        onAccept={handleAccept}
        onDecline={handleDecline}
        colors={colors}
      />
      {incomingChallenges.length > 1 && (
        <View style={[styles.moreBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.moreBadgeText}>+{incomingChallenges.length - 1} desafio(s)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 6,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  declineBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  acceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  moreBadge: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
