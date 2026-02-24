import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Dimensions, Share, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Chess } from 'chess.js';
import Chessboard from 'react-native-chessboard';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';
import { usePuzzleProblems, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/hooks/supabase/use-puzzle-problems';
import type { Puzzle } from '@/hooks/supabase/use-puzzle-problems';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 32, 400);

type GameStatus = 'loading' | 'playing' | 'correct' | 'wrong' | 'solved';

// ─────────────────────────────────────────────────────────────────────────────
// Timer hook
// ─────────────────────────────────────────────────────────────────────────────
function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs(s => s + 1), 1000);
    } else if (ref.current) {
      clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);
  const reset = () => setSecs(0);
  return { secs, reset };
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Puzzle board
// ─────────────────────────────────────────────────────────────────────────────
function PuzzleBoard({
  puzzle,
  onSolved,
  onFailed,
}: {
  puzzle: Puzzle;
  onSolved: (params: { hintsUsed: number; attemptsCount: number; timeSecs: number }) => void;
  onFailed: () => void;
}) {
  const [chess] = useState(() => { const c = new Chess(); c.load(puzzle.fen); return c; });
  const [fen, setFen] = useState(puzzle.fen);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [moveIndex, setMoveIndex] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [hintMove, setHintMove] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState(false);
  const { secs } = useTimer(status === 'playing');

  const handleMove = useCallback(({ move }: { move: { from: string; to: string } }) => {
    if (status !== 'playing') return;

    const expectedUCI = puzzle.solution[moveIndex];
    const madeUCI = `${move.from}${move.to}`;
    const isCorrect = madeUCI === expectedUCI || madeUCI === expectedUCI.slice(0, 4);

    if (isCorrect) {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      chess.move({ from: move.from, to: move.to, promotion: 'q' });
      setFen(chess.fen());
      setHintMove(null);

      const nextIndex = moveIndex + 1;
      if (nextIndex >= puzzle.solution.length) {
        setStatus('solved');
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSolved({ hintsUsed, attemptsCount: attemptsCount + 1, timeSecs: secs });
      } else {
        setMoveIndex(nextIndex);
        setStatus('correct');
        setTimeout(() => setStatus('playing'), 600);

        // Play opponent's response if there is one
        const opponentUCI = puzzle.solution[nextIndex];
        if (opponentUCI) {
          setTimeout(() => {
            const from = opponentUCI.slice(0, 2);
            const to = opponentUCI.slice(2, 4);
            const promo = opponentUCI[4] ?? 'q';
            chess.move({ from, to, promotion: promo });
            setFen(chess.fen());
            setMoveIndex(nextIndex + 1);
          }, 700);
        }
      }
    } else {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus('wrong');
      setWrongFlash(true);
      setAttemptsCount(a => a + 1);
      setTimeout(() => {
        chess.load(puzzle.fen);
        setFen(puzzle.fen);
        setMoveIndex(0);
        setHintMove(null);
        setWrongFlash(false);
        setStatus('playing');
      }, 900);
    }
  }, [chess, puzzle, moveIndex, status, hintsUsed, attemptsCount, secs, onSolved]);

  const handleHint = () => {
    if (hintsUsed >= 3 || status !== 'playing') return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const move = puzzle.solution[moveIndex];
    setHintMove(move ? move.slice(0, 2) : null);
    setHintsUsed(h => h + 1);
  };

  const handleGiveUp = () => {
    setStatus('wrong');
    onFailed();
  };

  const diffColor = DIFFICULTY_COLORS[puzzle.difficulty] ?? '#888';
  const diffLabel = DIFFICULTY_LABELS[puzzle.difficulty] ?? puzzle.difficulty;

  return (
    <View>
      {/* Puzzle info */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>{puzzle.title}</Text>
          {puzzle.description && (
            <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{puzzle.description}</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{
            backgroundColor: `${diffColor}22`, borderRadius: 6,
            paddingHorizontal: 8, paddingVertical: 3,
          }}>
            <Text style={{ color: diffColor, fontSize: 12, fontWeight: '600' }}>{diffLabel}</Text>
          </View>
          <Text style={{ color: '#d4a843', fontSize: 12 }}>★ {puzzle.rating}</Text>
        </View>
      </View>

      {/* Status bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, paddingHorizontal: 4,
      }}>
        <Text style={{ color: '#888', fontSize: 13 }}>
          {puzzle.player_to_move === 'white' ? '⬜ Brancas jogam' : '⬛ Pretas jogam'}
        </Text>
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600' }}>
          ⏱ {fmtTime(secs)}
        </Text>
      </View>

      {/* Board */}
      <View style={{
        width: BOARD_SIZE, height: BOARD_SIZE, borderRadius: 12, overflow: 'hidden',
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: status === 'solved' ? '#22c55e'
          : wrongFlash ? '#ef4444'
          : status === 'correct' ? '#22c55e'
          : '#2a2a2a',
      }}>
        <Chessboard
          fen={fen}
          boardSize={BOARD_SIZE}
          onMove={handleMove}
          colors={{
            black: '#769656',
            white: '#eeeed2',
            lastMoveHighlight: 'rgba(212,168,67,0.4)',
            checkmateHighlight: 'rgba(239,68,68,0.6)',
            promotionPieceButton: '#d4a843',
          }}
        />
      </View>

      {/* Hint square indicator */}
      {hintMove && (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: '#d4a843', fontSize: 13 }}>
            💡 Dica: mova a peça em <Text style={{ fontWeight: '700' }}>{hintMove.toUpperCase()}</Text>
          </Text>
        </View>
      )}

      {/* Feedback */}
      {status === 'solved' && (
        <View style={{
          backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 12, padding: 14,
          marginTop: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
        }}>
          <Text style={{ color: '#22c55e', fontSize: 20, fontWeight: '700' }}>✓ Puzzle Resolvido!</Text>
          <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
            Tempo: {fmtTime(secs)} · {hintsUsed > 0 ? `${hintsUsed} dica${hintsUsed > 1 ? 's' : ''}` : 'Sem dicas'}
          </Text>
        </View>
      )}

      {/* Controls */}
      {status !== 'solved' && (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <TouchableOpacity
            onPress={handleHint}
            disabled={hintsUsed >= 3 || status !== 'playing'}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 12,
              backgroundColor: '#1a1a1a', alignItems: 'center',
              borderWidth: 1, borderColor: '#2a2a2a',
              opacity: hintsUsed >= 3 ? 0.4 : 1,
            }}
          >
            <Text style={{ color: '#d4a843', fontWeight: '600' }}>
              💡 Dica ({3 - hintsUsed})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGiveUp}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 12,
              backgroundColor: '#1a1a1a', alignItems: 'center',
              borderWidth: 1, borderColor: '#2a2a2a',
            }}
          >
            <Text style={{ color: '#ef4444', fontWeight: '600' }}>Desistir</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PuzzleSolveScreen() {
  const router = useRouter();
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();
  const { user } = useSupabaseAuth();
  const { recordAttempt, getNextPuzzle } = usePuzzleProblems();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [solveParams, setSolveParams] = useState<{ hintsUsed: number; attemptsCount: number; timeSecs: number } | null>(null);

  // Load puzzle by ID
  useEffect(() => {
    if (!puzzleId) return;
    setLoading(true);
    supabase
      .from('puzzles')
      .select('*')
      .eq('id', puzzleId)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Puzzle não encontrado.');
        } else {
          setPuzzle(data as Puzzle);
        }
        setLoading(false);
      });
  }, [puzzleId]);

  const handleSolved = useCallback(async (params: { hintsUsed: number; attemptsCount: number; timeSecs: number }) => {
    setSolved(true);
    setSolveParams(params);
    if (user && puzzle) {
      await recordAttempt({
        puzzleId: puzzle.id,
        solved: true,
        hintsUsed: params.hintsUsed,
        attemptsCount: params.attemptsCount,
        timeSpentSecs: params.timeSecs,
      });
    }
  }, [user, puzzle, recordAttempt]);

  const handleFailed = useCallback(async () => {
    setFailed(true);
    if (user && puzzle) {
      await recordAttempt({
        puzzleId: puzzle.id,
        solved: false,
        hintsUsed: 0,
        attemptsCount: 1,
        timeSpentSecs: null,
      });
    }
  }, [user, puzzle, recordAttempt]);

  const handleNext = useCallback(async () => {
    const next = await getNextPuzzle();
    if (next) {
      router.replace({ pathname: '/puzzle-solve', params: { puzzleId: next.id } });
    } else {
      router.back();
    }
  }, [getNextPuzzle, router]);

  const handleShare = useCallback(async () => {
    if (!puzzle || !solveParams) return;
    const stars = solveParams.hintsUsed === 0 ? '⭐⭐⭐' : solveParams.hintsUsed === 1 ? '⭐⭐' : '⭐';
    const msg = `♟ Resolvi "${puzzle.title}" no OitoPorOito!\n${stars} ${fmtTime(solveParams.timeSecs)} · Rating ${puzzle.rating}`;
    await Share.share({ message: msg });
  }, [puzzle, solveParams]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#d4a843" size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (error || !puzzle) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#ef4444', fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
            {error ?? 'Puzzle não encontrado.'}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{
            backgroundColor: '#d4a843', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
          }}>
            <Text style={{ color: '#000', fontWeight: '700' }}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingTop: 8, paddingBottom: 8,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#d4a843', fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1, marginLeft: 8 }}>
          Resolver Puzzle
        </Text>
        {!user && (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login' as any)}
            style={{
              backgroundColor: 'rgba(212,168,67,0.15)', borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 6,
              borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)',
            }}
          >
            <Text style={{ color: '#d4a843', fontSize: 12, fontWeight: '600' }}>Entrar para salvar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <PuzzleBoard
          key={puzzle.id}
          puzzle={puzzle}
          onSolved={handleSolved}
          onFailed={handleFailed}
        />

        {/* Post-solve actions */}
        {(solved || failed) && (
          <View style={{ marginTop: 20, gap: 10 }}>
            {solved && (
              <TouchableOpacity
                onPress={handleShare}
                style={{
                  backgroundColor: '#1a1a1a', borderRadius: 14, paddingVertical: 14,
                  alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a',
                  flexDirection: 'row', justifyContent: 'center', gap: 8,
                }}
              >
                <Text style={{ fontSize: 16 }}>📤</Text>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Compartilhar resultado</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNext}
              style={{
                backgroundColor: '#d4a843', borderRadius: 14, paddingVertical: 14,
                alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
              }}
            >
              <Text style={{ fontSize: 16 }}>♟</Text>
              <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>Próximo Puzzle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                backgroundColor: '#1a1a1a', borderRadius: 14, paddingVertical: 14,
                alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a',
              }}
            >
              <Text style={{ color: '#888', fontWeight: '600' }}>Voltar à lista</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Puzzle details */}
        <View style={{
          backgroundColor: '#1a1a1a', borderRadius: 14, padding: 16,
          marginTop: 20, borderWidth: 1, borderColor: '#2a2a2a',
        }}>
          <Text style={{ color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 10, letterSpacing: 0.5 }}>
            DETALHES DO PUZZLE
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {puzzle.theme.map(t => (
              <View key={t} style={{
                backgroundColor: 'rgba(212,168,67,0.1)', borderRadius: 8,
                paddingHorizontal: 10, paddingVertical: 4,
                borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)',
              }}>
                <Text style={{ color: '#d4a843', fontSize: 12 }}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 20, marginTop: 12 }}>
            <Text style={{ color: '#666', fontSize: 12 }}>
              Jogado {puzzle.times_played}x
            </Text>
            <Text style={{ color: '#666', fontSize: 12 }}>
              Resolvido {puzzle.times_solved}x
            </Text>
            {puzzle.times_played > 0 && (
              <Text style={{ color: '#666', fontSize: 12 }}>
                Taxa: {Math.round((puzzle.times_solved / puzzle.times_played) * 100)}%
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}


