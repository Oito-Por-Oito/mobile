import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Chess } from 'chess.js';
import Chessboard from 'react-native-chessboard';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useDailyPuzzle, type DailyPuzzle, type WeekDay } from '@/hooks/supabase/use-daily-puzzle';
import { useSupabaseAuth } from '@/lib/auth-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 32, 400);

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty badge
// ─────────────────────────────────────────────────────────────────────────────
const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
  expert: 'Expert',
};
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
  expert: '#a855f7',
};

// ─────────────────────────────────────────────────────────────────────────────
// Week calendar strip
// ─────────────────────────────────────────────────────────────────────────────
function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
      {days.map((d) => (
        <View key={d.date} style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ color: '#9a9a9a', fontSize: 11, marginBottom: 4 }}>{d.label}</Text>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: d.isToday
                ? 'rgba(212,168,67,0.2)'
                : d.solved === true
                ? 'rgba(34,197,94,0.15)'
                : d.solved === false
                ? 'rgba(239,68,68,0.1)'
                : '#2a2a2a',
              borderWidth: d.isToday ? 1.5 : 0,
              borderColor: d.isToday ? '#d4a843' : 'transparent',
            }}
          >
            <Text style={{ fontSize: 14 }}>
              {d.solved === true ? '✓' : d.solved === false ? '✗' : d.isToday ? '?' : ''}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Puzzle board component
// ─────────────────────────────────────────────────────────────────────────────
type GameStatus = 'playing' | 'correct' | 'wrong' | 'solved';

interface PuzzleBoardProps {
  puzzle: DailyPuzzle;
  onSolved: (hintsUsed: number, attemptsCount: number) => void;
  onFailed: (hintsUsed: number, attemptsCount: number) => void;
}

function PuzzleBoard({ puzzle, onSolved, onFailed }: PuzzleBoardProps) {
  const [chess] = useState(() => {
    const c = new Chess();
    c.load(puzzle.fen);
    return c;
  });
  const [fen, setFen] = useState(puzzle.fen);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [moveIndex, setMoveIndex] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const solvedRef = useRef(false);

  const handleMove = useCallback(
    ({ move }: { move: { from: string; to: string } }) => {
      if (status !== 'playing' || solvedRef.current) return;

      const expectedUCI = puzzle.solution[moveIndex];
      const madeUCI = `${move.from}${move.to}`;

      // Accept if first 4 chars match (handles promotion variants)
      const isCorrect =
        madeUCI === expectedUCI ||
        madeUCI.startsWith(expectedUCI.slice(0, 4));

      if (isCorrect) {
        chess.move({ from: move.from, to: move.to, promotion: 'q' });
        setFen(chess.fen());
        setShowHint(false);

        const nextIndex = moveIndex + 1;
        if (nextIndex >= puzzle.solution.length) {
          // All moves solved!
          solvedRef.current = true;
          setStatus('solved');
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          setTimeout(() => onSolved(hintsUsed, attemptsCount + 1), 800);
        } else {
          setStatus('correct');
          setMoveIndex(nextIndex);
          setTimeout(() => setStatus('playing'), 600);
        }
      } else {
        // Wrong move — reset board
        const newAttempts = attemptsCount + 1;
        setAttemptsCount(newAttempts);
        setStatus('wrong');
        setWrongFlash(true);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setTimeout(() => {
          chess.load(puzzle.fen);
          setFen(puzzle.fen);
          setMoveIndex(0);
          setStatus('playing');
          setWrongFlash(false);
        }, 900);
      }
    },
    [chess, puzzle, moveIndex, status, hintsUsed, attemptsCount, onSolved]
  );

  const handleHint = () => {
    if (hintsUsed >= 3 || status !== 'playing') return;
    setHintsUsed(h => h + 1);
    setShowHint(true);
  };

  const currentSolution = puzzle.solution[moveIndex];
  const hintFrom = currentSolution?.slice(0, 2);
  const hintTo = currentSolution?.slice(2, 4);
  const sanHint = puzzle.solution_san?.[moveIndex];

  const borderColor =
    status === 'solved' || status === 'correct'
      ? '#22c55e'
      : wrongFlash
      ? '#ef4444'
      : '#3a3a3a';

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Puzzle info card */}
      <View
        style={{
          width: BOARD_SIZE,
          backgroundColor: '#1e1e1e',
          borderRadius: 14,
          padding: 14,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#3a3a3a',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#d4a843', fontWeight: 'bold', fontSize: 16 }}>
            {puzzle.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View
              style={{
                backgroundColor: DIFFICULTY_COLOR[puzzle.difficulty] + '20',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: DIFFICULTY_COLOR[puzzle.difficulty] + '50',
              }}
            >
              <Text style={{ color: DIFFICULTY_COLOR[puzzle.difficulty], fontSize: 11, fontWeight: '600' }}>
                {DIFFICULTY_LABEL[puzzle.difficulty]}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: '#3a3a3a',
              }}
            >
              <Text style={{ color: '#9a9a9a', fontSize: 11 }}>⭐ {puzzle.rating}</Text>
            </View>
          </View>
        </View>

        {puzzle.description ? (
          <Text style={{ color: '#9a9a9a', fontSize: 13, marginTop: 6 }}>{puzzle.description}</Text>
        ) : null}

        <Text style={{ color: '#f0f0f0', fontSize: 13, marginTop: 8 }}>
          {puzzle.player_to_move === 'white' ? '⬜ Brancas jogam' : '⬛ Pretas jogam'}
        </Text>
      </View>

      {/* Status banner */}
      {(status === 'correct' || status === 'wrong' || status === 'solved') && (
        <View
          style={{
            width: BOARD_SIZE,
            borderRadius: 10,
            padding: 10,
            marginBottom: 10,
            backgroundColor:
              status === 'solved' || status === 'correct'
                ? 'rgba(34,197,94,0.15)'
                : 'rgba(239,68,68,0.15)',
            borderWidth: 1,
            borderColor:
              status === 'solved' || status === 'correct' ? '#22c55e' : '#ef4444',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: status === 'solved' || status === 'correct' ? '#4ade80' : '#f87171',
              fontWeight: 'bold',
              fontSize: 14,
            }}
          >
            {status === 'solved'
              ? '🎉 Puzzle resolvido!'
              : status === 'correct'
              ? '✓ Bom lance! Continue...'
              : '✗ Lance incorreto — tente novamente'}
          </Text>
        </View>
      )}

      {/* Chessboard */}
      <View
        style={{
          width: BOARD_SIZE,
          height: BOARD_SIZE,
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: borderColor,
        }}
      >
        <Chessboard
          fen={fen}
          onMove={handleMove}
          boardSize={BOARD_SIZE}
          colors={{ black: '#769656', white: '#eeeed2' }}
          gestureEnabled={status === 'playing'}
        />
      </View>

      {/* Controls */}
      <View style={{ flexDirection: 'row', gap: 10, width: BOARD_SIZE, marginTop: 12 }}>
        <TouchableOpacity
          onPress={handleHint}
          disabled={hintsUsed >= 3 || status !== 'playing'}
          style={{
            flex: 1,
            backgroundColor: hintsUsed >= 3 ? '#1a1a1a' : '#2a2a2a',
            borderRadius: 10,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#3a3a3a',
            opacity: hintsUsed >= 3 ? 0.4 : 1,
          }}
        >
          <Text style={{ color: '#f0f0f0', fontSize: 13 }}>
            💡 Dica {hintsUsed > 0 ? `(${hintsUsed}/3)` : ''}
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            backgroundColor: '#2a2a2a',
            borderRadius: 10,
            padding: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#3a3a3a',
          }}
        >
          <Text style={{ color: '#9a9a9a', fontSize: 13 }}>
            🔄 {attemptsCount} tentativa{attemptsCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Hint box */}
      {showHint && (
        <View
          style={{
            width: BOARD_SIZE,
            backgroundColor: '#1e1e1e',
            borderRadius: 10,
            padding: 12,
            marginTop: 10,
            borderWidth: 1,
            borderColor: '#d4a843',
          }}
        >
          <Text style={{ color: '#d4a843', fontSize: 13 }}>
            💡 Mova a peça de{' '}
            <Text style={{ fontWeight: 'bold' }}>{hintFrom?.toUpperCase()}</Text>
            {' '}para{' '}
            <Text style={{ fontWeight: 'bold' }}>{hintTo?.toUpperCase()}</Text>
            {sanHint ? ` (${sanHint})` : ''}
          </Text>
        </View>
      )}

      {/* Themes */}
      {puzzle.theme.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: BOARD_SIZE, marginTop: 12 }}>
          {puzzle.theme.map(t => (
            <View
              key={t}
              style={{
                backgroundColor: '#2a2a2a',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderWidth: 1,
                borderColor: '#3a3a3a',
              }}
            >
              <Text style={{ color: '#9a9a9a', fontSize: 11 }}>{t}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Solved result card
// ─────────────────────────────────────────────────────────────────────────────
function SolvedCard({
  puzzle,
  streak,
  hintsUsed,
  attemptsCount,
  onShare,
}: {
  puzzle: DailyPuzzle;
  streak: number;
  hintsUsed: number;
  attemptsCount: number;
  onShare: () => void;
}) {
  const stars = hintsUsed === 0 ? '⭐⭐⭐' : hintsUsed === 1 ? '⭐⭐' : hintsUsed === 2 ? '⭐' : '';

  return (
    <View
      style={{
        backgroundColor: '#1e1e1e',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#22c55e',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
      <Text style={{ color: '#4ade80', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
        Puzzle Resolvido!
      </Text>
      <Text style={{ color: '#9a9a9a', fontSize: 14, marginBottom: 16 }}>
        {stars || 'Resolvido com dicas'}
      </Text>

      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#f0f0f0', fontSize: 22, fontWeight: 'bold' }}>{streak}</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 12 }}>🔥 Sequência</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#f0f0f0', fontSize: 22, fontWeight: 'bold' }}>{attemptsCount}</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 12 }}>Tentativas</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#f0f0f0', fontSize: 22, fontWeight: 'bold' }}>{hintsUsed}</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 12 }}>Dicas</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onShare}
        style={{
          backgroundColor: '#d4a843',
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 14 }}>
          📤 Compartilhar Resultado
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function DailyPuzzleScreen() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const { puzzle, attempt, streak, weekDays, loading, error, recordAttempt } = useDailyPuzzle();

  const [solvedInfo, setSolvedInfo] = useState<{
    hintsUsed: number;
    attemptsCount: number;
  } | null>(null);

  // If already solved today, show solved state immediately
  useEffect(() => {
    if (attempt?.solved) {
      setSolvedInfo({
        hintsUsed: attempt.hints_used,
        attemptsCount: attempt.attempts_count,
      });
    }
  }, [attempt]);

  const handleSolved = useCallback(
    async (hintsUsed: number, attemptsCount: number) => {
      setSolvedInfo({ hintsUsed, attemptsCount });
      if (user) {
        await recordAttempt({ solved: true, failed: false, hintsUsed, attemptsCount });
      }
    },
    [user, recordAttempt]
  );

  const handleFailed = useCallback(
    async (hintsUsed: number, attemptsCount: number) => {
      if (user) {
        await recordAttempt({ solved: false, failed: true, hintsUsed, attemptsCount });
      }
    },
    [user, recordAttempt]
  );

  const handleShare = useCallback(async () => {
    if (!puzzle || !solvedInfo) return;
    const stars =
      solvedInfo.hintsUsed === 0
        ? '⭐⭐⭐'
        : solvedInfo.hintsUsed === 1
        ? '⭐⭐'
        : solvedInfo.hintsUsed === 2
        ? '⭐'
        : '✓';
    const dateStr = new Date(puzzle.puzzle_date + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const msg =
      `🧩 Puzzle Diário OitoPorOito — ${dateStr}\n` +
      `${stars} ${DIFFICULTY_LABEL[puzzle.difficulty]} (${puzzle.rating})\n` +
      `Tentativas: ${solvedInfo.attemptsCount} | Dicas: ${solvedInfo.hintsUsed}\n` +
      `🔥 Sequência: ${streak} dias\n` +
      `\nJogue em oitoporoito.com`;
    try {
      await Share.share({ message: msg });
    } catch {}
  }, [puzzle, solvedInfo, streak]);

  // ── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#d4a843" size="large" />
          <Text style={{ color: '#9a9a9a', marginTop: 12 }}>Carregando puzzle do dia...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !puzzle) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
          <Text style={{ color: '#f0f0f0', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            Puzzle indisponível
          </Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, textAlign: 'center' }}>
            {error ?? 'Não foi possível carregar o puzzle de hoje.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 20,
              backgroundColor: '#d4a843',
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 24,
            }}
          >
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const dateStr = new Date(puzzle.puzzle_date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 12, padding: 4 }}
          >
            <Text style={{ color: '#9a9a9a', fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f0f0f0', fontWeight: 'bold', fontSize: 20 }}>
              📅 Puzzle do Dia
            </Text>
            <Text style={{ color: '#9a9a9a', fontSize: 12, textTransform: 'capitalize' }}>
              {dateStr}
            </Text>
          </View>
          {/* Streak badge */}
          <View
            style={{
              backgroundColor: 'rgba(212,168,67,0.15)',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: '#d4a843',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#d4a843', fontSize: 18, fontWeight: 'bold' }}>{streak}</Text>
            <Text style={{ color: '#9a9a9a', fontSize: 10 }}>🔥 dias</Text>
          </View>
        </View>

        {/* Week calendar */}
        <View
          style={{
            backgroundColor: '#1e1e1e',
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#3a3a3a',
          }}
        >
          <Text style={{ color: '#d4a843', fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Esta Semana
          </Text>
          <WeekStrip days={weekDays} />
        </View>

        {/* Puzzle board or solved card */}
        {solvedInfo ? (
          <>
            <SolvedCard
              puzzle={puzzle}
              streak={streak}
              hintsUsed={solvedInfo.hintsUsed}
              attemptsCount={solvedInfo.attemptsCount}
              onShare={handleShare}
            />
            {!user && (
              <View
                style={{
                  backgroundColor: '#1e1e1e',
                  borderRadius: 12,
                  padding: 14,
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: '#3a3a3a',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#9a9a9a', fontSize: 13, textAlign: 'center' }}>
                  Faça login para salvar sua sequência e acompanhar seu progresso!
                </Text>
              </View>
            )}
          </>
        ) : (
          <PuzzleBoard
            key={puzzle.puzzle_id}
            puzzle={puzzle}
            onSolved={handleSolved}
            onFailed={handleFailed}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
