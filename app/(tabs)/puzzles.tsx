import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Chess } from 'chess.js';
import Chessboard from 'react-native-chessboard';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';
import { useDailyPuzzle } from '@/hooks/supabase/use-daily-puzzle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 32, 380);

// ─────────────────────────────────────────────────────────────────────────────
// Sample puzzles for non-daily modes (Rush, Battle, Custom)
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_PUZZLES = [
  {
    id: 1,
    title: 'Mate em 1',
    description: 'Brancas jogam e dão xeque-mate em 1 lance',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    solution: ['f3g5'],
    difficulty: 'Fácil',
    rating: 800,
    theme: 'Mate',
    playerToMove: 'white',
  },
  {
    id: 2,
    title: 'Garfo de Cavalo',
    description: 'Encontre o garfo tático',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    solution: ['f3e5'],
    difficulty: 'Médio',
    rating: 1200,
    theme: 'Garfo',
    playerToMove: 'white',
  },
  {
    id: 3,
    title: 'Ataque à Descoberta',
    description: 'Use o ataque à descoberta para ganhar material',
    fen: '4k3/8/8/3n4/8/8/3Q4/4K3 w - - 0 1',
    solution: ['d2h6'],
    difficulty: 'Difícil',
    rating: 1600,
    theme: 'Descoberta',
    playerToMove: 'white',
  },
];

const PUZZLE_MODES = [
  { id: 'daily', icon: '📅', title: 'Puzzle Diário', description: 'Resolva o puzzle de hoje', color: '#22c55e' },
  { id: 'rush', icon: '⚡', title: 'Corrida de Puzzles', description: 'Resolva o máximo em 3 minutos', color: '#f59e0b' },
  { id: 'battle', icon: '⚔️', title: 'Batalha de Puzzles', description: 'Compita contra outros jogadores', color: '#ef4444' },
  { id: 'custom', icon: '🎯', title: 'Puzzles Personalizados', description: 'Filtre por tema e dificuldade', color: '#60a5fa' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PuzzleGame (for non-daily modes)
// ─────────────────────────────────────────────────────────────────────────────
function PuzzleGame({ puzzle, onSolve, onSkip }: {
  puzzle: typeof SAMPLE_PUZZLES[0];
  onSolve: () => void;
  onSkip: () => void;
}) {
  const [chess] = useState(() => { const c = new Chess(); c.load(puzzle.fen); return c; });
  const [fen, setFen] = useState(puzzle.fen);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [moveIndex, setMoveIndex] = useState(0);
  const [hint, setHint] = useState(false);

  const handleMove = useCallback(({ move }: { move: { from: string; to: string } }) => {
    if (status !== 'playing') return;
    const expectedMove = puzzle.solution[moveIndex];
    const madeMove = `${move.from}${move.to}`;

    if (madeMove === expectedMove || madeMove.startsWith(expectedMove.slice(0, 4))) {
      chess.move({ from: move.from, to: move.to, promotion: 'q' });
      setFen(chess.fen());
      const nextIndex = moveIndex + 1;
      if (nextIndex >= puzzle.solution.length) {
        setStatus('correct');
        setTimeout(onSolve, 1500);
      } else {
        setMoveIndex(nextIndex);
      }
    } else {
      setStatus('wrong');
      setTimeout(() => {
        chess.load(puzzle.fen);
        setFen(puzzle.fen);
        setMoveIndex(0);
        setStatus('playing');
      }, 1000);
    }
  }, [chess, puzzle, moveIndex, status, onSolve]);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        width: BOARD_SIZE, backgroundColor: '#2c2c2c', borderRadius: 12,
        padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#4a4a4a',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#d4a843', fontWeight: 'bold', fontSize: 16 }}>{puzzle.title}</Text>
          <View style={{ backgroundColor: '#3a3a3a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: '#9a9a9a', fontSize: 12 }}>{puzzle.difficulty}</Text>
          </View>
        </View>
        <Text style={{ color: '#9a9a9a', fontSize: 13, marginTop: 4 }}>{puzzle.description}</Text>
        <Text style={{ color: '#f0f0f0', fontSize: 13, marginTop: 8 }}>
          {puzzle.playerToMove === 'white' ? '⬜ Brancas jogam' : '⬛ Pretas jogam'}
        </Text>
      </View>

      {status !== 'playing' && (
        <View style={{
          width: BOARD_SIZE, borderRadius: 10, padding: 10, marginBottom: 8,
          backgroundColor: status === 'correct' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          borderWidth: 1, borderColor: status === 'correct' ? '#22c55e' : '#ef4444',
          alignItems: 'center',
        }}>
          <Text style={{ color: status === 'correct' ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
            {status === 'correct' ? '✓ Correto!' : '✗ Tente novamente'}
          </Text>
        </View>
      )}

      <View style={{
        width: BOARD_SIZE, height: BOARD_SIZE, borderRadius: 8, overflow: 'hidden',
        borderWidth: 2, borderColor: status === 'correct' ? '#22c55e' : status === 'wrong' ? '#ef4444' : '#4a4a4a',
      }}>
        <Chessboard
          fen={fen}
          onMove={handleMove}
          boardSize={BOARD_SIZE}
          colors={{ black: '#769656', white: '#eeeed2' }}
          gestureEnabled={status === 'playing'}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 10, width: BOARD_SIZE, marginTop: 10 }}>
        <TouchableOpacity
          onPress={() => setHint(true)}
          style={{ backgroundColor: '#3a3a3a', borderRadius: 10, padding: 12, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#4a4a4a' }}
        >
          <Text style={{ color: '#f0f0f0', fontSize: 13 }}>💡 Dica</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSkip}
          style={{ backgroundColor: '#3a3a3a', borderRadius: 10, padding: 12, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#4a4a4a' }}
        >
          <Text style={{ color: '#f0f0f0', fontSize: 13 }}>⏭ Pular</Text>
        </TouchableOpacity>
      </View>

      {hint && (
        <View style={{
          width: BOARD_SIZE, backgroundColor: '#2c2c2c', borderRadius: 10,
          padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#d4a843',
        }}>
          <Text style={{ color: '#d4a843', fontSize: 13 }}>
            💡 Dica: Mova a peça de {puzzle.solution[moveIndex]?.slice(0, 2)} para {puzzle.solution[moveIndex]?.slice(2, 4)}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Puzzle preview card (shown on the main puzzles screen)
// ─────────────────────────────────────────────────────────────────────────────
function DailyPuzzleCard({ onPress }: { onPress: () => void }) {
  const { puzzle, attempt, streak, loading } = useDailyPuzzle();

  const todayStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long',
  });

  const difficultyColor: Record<string, string> = {
    easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444', expert: '#a855f7',
  };
  const difficultyLabel: Record<string, string> = {
    easy: 'Fácil', medium: 'Médio', hard: 'Difícil', expert: 'Expert',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#1e1e1e',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: attempt?.solved ? '#22c55e' : '#d4a843',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 28, marginRight: 10 }}>📅</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#d4a843', fontWeight: 'bold', fontSize: 16 }}>
            Puzzle do Dia
          </Text>
          <Text style={{ color: '#9a9a9a', fontSize: 12 }}>{todayStr}</Text>
        </View>
        {/* Streak badge */}
        <View style={{
          backgroundColor: 'rgba(212,168,67,0.15)',
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: '#d4a843',
          alignItems: 'center',
        }}>
          <Text style={{ color: '#d4a843', fontSize: 16, fontWeight: 'bold' }}>{streak}</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 10 }}>🔥 dias</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#d4a843" size="small" style={{ marginVertical: 8 }} />
      ) : puzzle ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            backgroundColor: (difficultyColor[puzzle.difficulty] ?? '#9a9a9a') + '20',
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderWidth: 1,
            borderColor: (difficultyColor[puzzle.difficulty] ?? '#9a9a9a') + '50',
          }}>
            <Text style={{ color: difficultyColor[puzzle.difficulty] ?? '#9a9a9a', fontSize: 12, fontWeight: '600' }}>
              {difficultyLabel[puzzle.difficulty] ?? puzzle.difficulty}
            </Text>
          </View>
          <Text style={{ color: '#9a9a9a', fontSize: 12 }}>⭐ {puzzle.rating}</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 12 }}>•</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 12 }}>{puzzle.title}</Text>
        </View>
      ) : null}

      <View style={{
        marginTop: 12,
        backgroundColor: attempt?.solved ? '#22c55e' : '#d4a843',
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: 'center',
      }}>
        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13 }}>
          {attempt?.solved ? '✓ Já resolvido hoje!' : '▶ Resolver Agora'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function PuzzlesScreen() {
  const router = useRouter();
  const { user, profile } = useSupabaseAuth();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [solved, setSolved] = useState(0);
  const [skipped, setSkipped] = useState(0);

  const handleModeSelect = (modeId: string) => {
    if (modeId === 'daily') {
      router.push('/daily-puzzle');
    } else if (modeId === 'custom') {
      router.push('/puzzle-problems' as any);
    } else if (modeId === 'rush') {
      router.push('/puzzle-rush' as any);
    } else {
      setSelectedMode(modeId);
    }
  };

  const handleSolve = () => {
    setSolved(s => s + 1);
    if (currentPuzzleIndex < SAMPLE_PUZZLES.length - 1) {
      setCurrentPuzzleIndex(i => i + 1);
    } else {
      Alert.alert('Parabéns!', `Você resolveu ${solved + 1} puzzles!`, [
        { text: 'OK', onPress: () => { setSelectedMode(null); setCurrentPuzzleIndex(0); setSolved(0); } },
      ]);
    }
  };

  const handleSkip = () => {
    setSkipped(s => s + 1);
    if (currentPuzzleIndex < SAMPLE_PUZZLES.length - 1) {
      setCurrentPuzzleIndex(i => i + 1);
    } else {
      setSelectedMode(null);
      setCurrentPuzzleIndex(0);
    }
  };

  // ── Non-daily mode game view ─────────────────────────────────────────────
  if (selectedMode) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => { setSelectedMode(null); setCurrentPuzzleIndex(0); setSolved(0); }} style={{ marginRight: 12 }}>
              <Text style={{ color: '#9a9a9a', fontSize: 24 }}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f0f0f0', fontWeight: 'bold', fontSize: 18 }}>
                {PUZZLE_MODES.find(m => m.id === selectedMode)?.title}
              </Text>
              <Text style={{ color: '#9a9a9a', fontSize: 13 }}>
                Resolvidos: {solved} • Pulados: {skipped}
              </Text>
            </View>
          </View>

          <PuzzleGame
            puzzle={SAMPLE_PUZZLES[currentPuzzleIndex]}
            onSolve={handleSolve}
            onSkip={handleSkip}
          />
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Main hub ─────────────────────────────────────────────────────────────
  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 20, paddingTop: 8 }}>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#f0f0f0' }}>🧩 Puzzles</Text>
          <Text style={{ color: '#9a9a9a', fontSize: 14, marginTop: 4 }}>
            Melhore seu jogo com problemas táticos
          </Text>
        </View>

        {/* Daily puzzle card (with real data) */}
        <DailyPuzzleCard onPress={() => router.push('/daily-puzzle')} />

        {/* Stats if logged in */}
        {user && profile && (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 16, padding: 16, marginBottom: 20,
            borderWidth: 1, borderColor: '#4a4a4a',
          }}>
            <Text style={{ color: '#d4a843', fontWeight: '600', marginBottom: 12 }}>Suas Estatísticas</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#f0f0f0', fontSize: 22, fontWeight: 'bold' }}>
                  {profile.puzzles_solved || 0}
                </Text>
                <Text style={{ color: '#9a9a9a', fontSize: 12 }}>Resolvidos</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#f0f0f0', fontSize: 22, fontWeight: 'bold' }}>
                  {profile.streak_days || 0}
                </Text>
                <Text style={{ color: '#9a9a9a', fontSize: 12 }}>Sequência</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#f0f0f0', fontSize: 22, fontWeight: 'bold' }}>
                  {Math.round(profile.accuracy || 0)}%
                </Text>
                <Text style={{ color: '#9a9a9a', fontSize: 12 }}>Precisão</Text>
              </View>
            </View>
          </View>
        )}

        {/* Other puzzle modes (excluding daily — already shown above) */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Outros Modos
        </Text>
        {PUZZLE_MODES.filter(m => m.id !== 'daily').map((mode) => (
          <TouchableOpacity
            key={mode.id}
            onPress={() => handleModeSelect(mode.id)}
            style={{
              backgroundColor: '#2c2c2c', borderRadius: 16, padding: 18, marginBottom: 12,
              borderWidth: 1, borderColor: '#4a4a4a',
              flexDirection: 'row', alignItems: 'center',
            }}
          >
            <View style={{
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: mode.color + '20', alignItems: 'center', justifyContent: 'center',
              marginRight: 14, borderWidth: 1.5, borderColor: mode.color + '40',
            }}>
              <Text style={{ fontSize: 26 }}>{mode.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f0f0f0', fontSize: 16, fontWeight: '600' }}>{mode.title}</Text>
              <Text style={{ color: '#9a9a9a', fontSize: 13, marginTop: 2 }}>{mode.description}</Text>
            </View>
            <Text style={{ color: '#4a4a4a', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Themes */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          Por Tema
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {['Mate', 'Garfo', 'Cravada', 'Raio-X', 'Descoberta', 'Sacrifício', 'Promoção', 'Final'].map((theme) => (
            <TouchableOpacity
              key={theme}
              onPress={() => setSelectedMode('custom')}
              style={{
                backgroundColor: '#2c2c2c', borderRadius: 10,
                paddingVertical: 10, paddingHorizontal: 16,
                borderWidth: 1, borderColor: '#4a4a4a',
              }}
            >
              <Text style={{ color: '#f0f0f0', fontSize: 14 }}>{theme}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
