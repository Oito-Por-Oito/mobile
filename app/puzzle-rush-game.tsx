import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions, Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Chess } from 'chess.js';
import Chessboard from 'react-native-chessboard';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';
import { usePuzzleRush, RushMode, RushPuzzle } from '@/hooks/supabase/use-puzzle-rush';

const { width: SCREEN_W } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_W - 32, 380);

const MODE_SECONDS: Record<RushMode, number | null> = {
  '3min': 180,
  '5min': 300,
  'survival': null,
};
const MAX_LIVES = 3;
const ERROR_PENALTY_S = 10;

type GamePhase = 'loading' | 'playing' | 'finished';

export default function PuzzleRushGameScreen() {
  const router = useRouter();
  const { mode, userRating } = useLocalSearchParams<{ mode: RushMode; userRating: string }>();
  const { user } = useSupabaseAuth();
  const { loadPuzzles, startSession, finishSession } = usePuzzleRush();

  const [phase, setPhase] = useState<GamePhase>('loading');
  const [puzzles, setPuzzles] = useState<RushPuzzle[]>([]);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [moveIndex, setMoveIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [puzzleTimes, setPuzzleTimes] = useState<number[]>([]);
  const [puzzleStart, setPuzzleStart] = useState(Date.now());
  const [isNewRecord, setIsNewRecord] = useState(false);

  const chessRef = useRef<Chess>(new Chess());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPuzzle = puzzles[puzzleIndex];

  // ── Inicialização ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const rating = parseInt(userRating ?? '1200', 10);
      const list = await loadPuzzles(rating, mode ?? '5min', 60);
      if (list.length === 0) {
        Alert.alert('Erro', 'Não foi possível carregar puzzles. Tente novamente.');
        router.back();
        return;
      }
      setPuzzles(list);

      if (user) {
        const sid = await startSession(user.id, mode ?? '5min');
        setSessionId(sid);
      }

      const totalSecs = MODE_SECONDS[mode ?? '5min'];
      setTimeLeft(totalSecs);
      setPhase('playing');
      setPuzzleStart(Date.now());
    })();
  }, []);

  // ── Carregar puzzle no tabuleiro ───────────────────────────────────────────
  useEffect(() => {
    if (!currentPuzzle || phase !== 'playing') return;
    chessRef.current = new Chess(currentPuzzle.fen);
    setMoveIndex(0);
    setPuzzleStart(Date.now());
  }, [puzzleIndex, phase]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft === null) return; // survival sem timer

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ── Fim de jogo ────────────────────────────────────────────────────────────
  const endGame = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('finished');

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const allTimes = [...puzzleTimes];
    const avgTime = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
    const highestRating = puzzles.slice(0, score).reduce((max, p) => Math.max(max, p.rating), 0);

    if (sessionId && user) {
      await finishSession({
        sessionId,
        score,
        errors,
        timeSpentS: elapsed,
        highestRating,
        avgTimePer: Math.round(avgTime * 10) / 10,
      });
    }
  }, [score, errors, puzzleTimes, sessionId, user, puzzles]);

  // ── Validar lance do usuário ───────────────────────────────────────────────
  const handleMove = useCallback(({ move }: { move: { from: string; to: string; promotion?: string } }) => {
    if (!currentPuzzle || phase !== 'playing') return false;

    const expectedUci = currentPuzzle.solution_uci[moveIndex];
    const madeUci = move.from + move.to + (move.promotion ?? '');

    if (madeUci === expectedUci) {
      // Lance correto
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFeedback('correct');
      setTimeout(() => setFeedback(null), 500);

      const nextMoveIdx = moveIndex + 1;

      if (nextMoveIdx >= currentPuzzle.solution_uci.length) {
        // Puzzle resolvido!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const elapsed = (Date.now() - puzzleStart) / 1000;
        setPuzzleTimes(prev => [...prev, elapsed]);
        setScore(s => s + 1);

        const nextIdx = puzzleIndex + 1;
        if (nextIdx >= puzzles.length) {
          endGame();
        } else {
          setPuzzleIndex(nextIdx);
        }
      } else {
        // Próximo lance da solução (resposta do adversário)
        setMoveIndex(nextMoveIdx);
        const chess = chessRef.current;
        chess.move(expectedUci);
        // Aplicar resposta automática do adversário
        const opponentUci = currentPuzzle.solution_uci[nextMoveIdx];
        if (opponentUci) {
          setTimeout(() => {
            chess.move(opponentUci);
            setMoveIndex(nextMoveIdx + 1);
          }, 400);
        }
      }
      return true;
    } else {
      // Lance errado
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 600);
      setErrors(e => e + 1);

      if (mode === 'survival') {
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
          endGame();
        }
      } else {
        // Penalidade de tempo
        setTimeLeft(prev => prev !== null ? Math.max(0, prev - ERROR_PENALTY_S) : null);
      }
      return false;
    }
  }, [currentPuzzle, moveIndex, phase, puzzleIndex, puzzles, lives, mode, puzzleStart]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `🏆 Corrida de Puzzles — OitoPorOito\n\nModo: ${mode === '3min' ? '3 Minutos' : mode === '5min' ? '5 Minutos' : 'Sobrevivência'}\nScore: ${score} puzzles\nErros: ${errors}\n\nJogue em oitoporoito.com.br`,
      });
    } catch {}
  }, [score, errors, mode]);

  // ── Formatação ─────────────────────────────────────────────────────────────
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const timerColor = timeLeft !== null && timeLeft <= 30 ? '#ef4444' : '#d4a843';

  // ── Tela de resultado ──────────────────────────────────────────────────────
  if (phase === 'finished') {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.resultContainer}>
          <Text style={styles.resultEmoji}>{score >= 20 ? '🏆' : score >= 10 ? '🎯' : '⚡'}</Text>
          <Text style={styles.resultTitle}>Corrida Encerrada!</Text>
          {isNewRecord && (
            <View style={styles.newRecordBadge}>
              <Text style={styles.newRecordText}>🎉 Novo Recorde!</Text>
            </View>
          )}
          <View style={styles.resultStats}>
            <View style={styles.resultStatItem}>
              <Text style={styles.resultStatValue}>{score}</Text>
              <Text style={styles.resultStatLabel}>Puzzles resolvidos</Text>
            </View>
            <View style={styles.resultStatDivider} />
            <View style={styles.resultStatItem}>
              <Text style={styles.resultStatValue}>{errors}</Text>
              <Text style={styles.resultStatLabel}>Erros</Text>
            </View>
            <View style={styles.resultStatDivider} />
            <View style={styles.resultStatItem}>
              <Text style={styles.resultStatValue}>
                {score + errors > 0 ? Math.round((score / (score + errors)) * 100) : 0}%
              </Text>
              <Text style={styles.resultStatLabel}>Precisão</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>📤 Compartilhar resultado</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playAgainBtn}
            onPress={() => router.replace('/puzzle-rush' as any)}
          >
            <Text style={styles.playAgainText}>▶ Jogar Novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backResultBtn} onPress={() => router.back()}>
            <Text style={styles.backResultText}>← Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // ── Tela de loading ────────────────────────────────────────────────────────
  if (phase === 'loading' || !currentPuzzle) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⚡ Carregando puzzles...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ── Tela de jogo ───────────────────────────────────────────────────────────
  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.gameContainer}>
        {/* HUD */}
        <View style={styles.hud}>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>Score</Text>
            <Text style={styles.hudValue}>{score}</Text>
          </View>

          {mode === 'survival' ? (
            <View style={styles.hudItem}>
              <Text style={styles.hudLabel}>Vidas</Text>
              <Text style={styles.hudValue}>
                {Array.from({ length: MAX_LIVES }, (_, i) => i < lives ? '❤️' : '🖤').join('')}
              </Text>
            </View>
          ) : (
            <View style={styles.hudItem}>
              <Text style={styles.hudLabel}>Tempo</Text>
              <Text style={[styles.hudValue, { color: timerColor }]}>
                {timeLeft !== null ? formatTime(timeLeft) : '—'}
              </Text>
            </View>
          )}

          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>Erros</Text>
            <Text style={[styles.hudValue, { color: errors > 0 ? '#ef4444' : '#f0f0f0' }]}>{errors}</Text>
          </View>
        </View>

        {/* Info do puzzle */}
        <View style={styles.puzzleInfo}>
          <Text style={styles.puzzleTitle}>{currentPuzzle.title}</Text>
          <Text style={styles.puzzleRating}>⭐ {currentPuzzle.rating}</Text>
        </View>

        {/* Feedback */}
        {feedback && (
          <View style={[styles.feedbackBanner, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={styles.feedbackText}>
              {feedback === 'correct' ? '✓ Correto!' : `✗ Errado! ${mode !== 'survival' ? `-${ERROR_PENALTY_S}s` : `-1 vida`}`}
            </Text>
          </View>
        )}

        {/* Tabuleiro */}
        <View style={[styles.boardWrapper, feedback === 'correct' && styles.boardCorrect, feedback === 'wrong' && styles.boardWrong]}>
          <Chessboard
            fen={currentPuzzle.fen}
            onMove={handleMove}
            boardSize={BOARD_SIZE}
          />
        </View>

        {/* Dica de turno */}
        <Text style={styles.turnHint}>
          {chessRef.current.turn() === 'w' ? '⬜ Brancas jogam' : '⬛ Pretas jogam'}
        </Text>

        {/* Botão de desistir */}
        <TouchableOpacity style={styles.giveUpBtn} onPress={() => {
          Alert.alert('Encerrar corrida?', 'Seu progresso será salvo.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Encerrar', style: 'destructive', onPress: endGame },
          ]);
        }}>
          <Text style={styles.giveUpText}>Encerrar corrida</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#d4a843', fontSize: 18, fontWeight: '600' },
  gameContainer: { flex: 1, padding: 16, alignItems: 'center' },
  hud: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', backgroundColor: '#2c2c2c', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#4a4a4a' },
  hudItem: { alignItems: 'center', flex: 1 },
  hudLabel: { color: '#9a9a9a', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  hudValue: { color: '#f0f0f0', fontSize: 20, fontWeight: 'bold', marginTop: 2, fontVariant: ['tabular-nums'] },
  puzzleInfo: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  puzzleTitle: { color: '#9a9a9a', fontSize: 13 },
  puzzleRating: { color: '#d4a843', fontSize: 13, fontWeight: '600' },
  feedbackBanner: { width: '100%', borderRadius: 10, paddingVertical: 8, alignItems: 'center', marginBottom: 8 },
  feedbackCorrect: { backgroundColor: '#22c55e30', borderWidth: 1, borderColor: '#22c55e' },
  feedbackWrong: { backgroundColor: '#ef444430', borderWidth: 1, borderColor: '#ef4444' },
  feedbackText: { color: '#f0f0f0', fontWeight: '600', fontSize: 14 },
  boardWrapper: { borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  boardCorrect: { borderColor: '#22c55e' },
  boardWrong: { borderColor: '#ef4444' },
  turnHint: { color: '#9a9a9a', fontSize: 13, marginTop: 10 },
  giveUpBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, borderWidth: 1, borderColor: '#4a4a4a' },
  giveUpText: { color: '#9a9a9a', fontSize: 14 },
  // Resultado
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  resultEmoji: { fontSize: 72, marginBottom: 12 },
  resultTitle: { color: '#f0f0f0', fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  newRecordBadge: { backgroundColor: '#d4a84320', borderWidth: 1, borderColor: '#d4a843', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16 },
  newRecordText: { color: '#d4a843', fontWeight: 'bold', fontSize: 14 },
  resultStats: { flexDirection: 'row', backgroundColor: '#2c2c2c', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#4a4a4a', width: '100%' },
  resultStatItem: { flex: 1, alignItems: 'center' },
  resultStatValue: { color: '#d4a843', fontSize: 28, fontWeight: 'bold' },
  resultStatLabel: { color: '#9a9a9a', fontSize: 11, marginTop: 2, textAlign: 'center' },
  resultStatDivider: { width: 1, backgroundColor: '#4a4a4a', marginHorizontal: 8 },
  shareBtn: { backgroundColor: '#2c2c2c', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginBottom: 12, borderWidth: 1, borderColor: '#4a4a4a', width: '100%', alignItems: 'center' },
  shareBtnText: { color: '#f0f0f0', fontWeight: '600', fontSize: 15 },
  playAgainBtn: { backgroundColor: '#d4a843', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  playAgainText: { color: '#1a1a1a', fontWeight: 'bold', fontSize: 16 },
  backResultBtn: { paddingVertical: 10 },
  backResultText: { color: '#9a9a9a', fontSize: 14 },
});
