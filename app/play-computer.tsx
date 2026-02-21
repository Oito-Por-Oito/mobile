import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Chess } from 'chess.js';
import Chessboard from 'react-native-chessboard';
import { ScreenContainer } from '@/components/screen-container';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 16, 400);

const BOT_LEVELS = [
  { id: 1, name: 'Iniciante', description: 'Perfeito para aprender', icon: '🐣', depth: 1 },
  { id: 2, name: 'Fácil', description: 'Comete alguns erros', icon: '🐥', depth: 2 },
  { id: 3, name: 'Médio', description: 'Jogo equilibrado', icon: '🐦', depth: 3 },
  { id: 4, name: 'Difícil', description: 'Joga bem', icon: '🦅', depth: 5 },
  { id: 5, name: 'Expert', description: 'Muito desafiador', icon: '🦁', depth: 8 },
  { id: 6, name: 'Mestre', description: 'Quase impossível de vencer', icon: '👑', depth: 12 },
];

// Simple bot that makes random legal moves (depth 1) or uses basic evaluation
function getBotMove(chess: Chess, depth: number): string | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  if (depth <= 1) {
    // Random move
    const move = moves[Math.floor(Math.random() * moves.length)];
    return `${move.from}${move.to}${move.promotion || ''}`;
  }

  // Prefer captures and checks for higher levels
  const captures = moves.filter(m => m.captured);
  const checks = moves.filter(m => m.san.includes('+'));

  if (depth >= 3 && checks.length > 0 && Math.random() > 0.3) {
    const move = checks[Math.floor(Math.random() * checks.length)];
    return `${move.from}${move.to}${move.promotion || ''}`;
  }

  if (depth >= 2 && captures.length > 0 && Math.random() > 0.4) {
    const move = captures[Math.floor(Math.random() * captures.length)];
    return `${move.from}${move.to}${move.promotion || ''}`;
  }

  const move = moves[Math.floor(Math.random() * moves.length)];
  return `${move.from}${move.to}${move.promotion || ''}`;
}

export default function PlayComputerScreen() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<typeof BOT_LEVELS[0] | null>(null);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [gameStarted, setGameStarted] = useState(false);
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [moves, setMoves] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [gameOver, setGameOver] = useState<{ result: string; reason: string } | null>(null);
  const [showMoves, setShowMoves] = useState(false);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkGameOver = useCallback((chessInstance: Chess) => {
    if (chessInstance.isGameOver()) {
      let result = '';
      let reason = '';
      if (chessInstance.isCheckmate()) {
        const winner = chessInstance.turn() === 'w' ? 'Pretas' : 'Brancas';
        result = `${winner} vencem`;
        reason = 'Xeque-mate';
      } else if (chessInstance.isDraw()) {
        result = 'Empate';
        reason = chessInstance.isStalemate() ? 'Afogamento' :
          chessInstance.isInsufficientMaterial() ? 'Material insuficiente' :
            chessInstance.isThreefoldRepetition() ? 'Repetição tripla' : 'Regra dos 50 lances';
      }
      setGameOver({ result, reason });
      return true;
    }
    return false;
  }, []);

  const makeBotMove = useCallback(() => {
    if (!selectedLevel) return;
    setIsThinking(true);

    const delay = 300 + Math.random() * 700 * (selectedLevel.depth / 12);
    botTimeoutRef.current = setTimeout(() => {
      const moveStr = getBotMove(chess, selectedLevel.depth);
      if (moveStr) {
        const from = moveStr.slice(0, 2);
        const to = moveStr.slice(2, 4);
        const promotion = moveStr.slice(4) || undefined;
        chess.move({ from, to, promotion: promotion || 'q' });
        const newFen = chess.fen();
        setFen(newFen);
        setMoves(chess.history());
        checkGameOver(chess);
      }
      setIsThinking(false);
    }, delay);
  }, [chess, selectedLevel, checkGameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const isPlayerTurn = (chess.turn() === 'w') === (playerColor === 'white');
    if (!isPlayerTurn && !isThinking) {
      makeBotMove();
    }
  }, [fen, gameStarted, playerColor, chess, gameOver, isThinking, makeBotMove]);

  useEffect(() => {
    return () => { if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current); };
  }, []);

  const handleMove = useCallback(({ move }: { move: { from: string; to: string; promotion?: string } }) => {
    if (!gameStarted || gameOver || isThinking) return;
    const isPlayerTurn = (chess.turn() === 'w') === (playerColor === 'white');
    if (!isPlayerTurn) return;

    try {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const newFen = chess.fen();
      setFen(newFen);
      setMoves(chess.history());
      if (!checkGameOver(chess)) {
        // Bot will play via useEffect
      }
    } catch (e) {
      // Invalid move
    }
  }, [gameStarted, gameOver, isThinking, chess, playerColor, checkGameOver]);

  const startGame = () => {
    if (!selectedLevel) return;
    chess.reset();
    setFen(chess.fen());
    setMoves([]);
    setGameOver(null);
    setIsThinking(false);
    setGameStarted(true);
  };

  const resetGame = () => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    chess.reset();
    setFen(chess.fen());
    setMoves([]);
    setGameOver(null);
    setIsThinking(false);
    setGameStarted(false);
  };

  // Setup screen
  if (!gameStarted) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingTop: 8 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
              <Text style={{ color: '#9a9a9a', fontSize: 24 }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#f0f0f0' }}>🤖 Jogar vs Computador</Text>
          </View>

          {/* Color selection */}
          <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Jogar com as
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            {(['white', 'black'] as const).map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setPlayerColor(color)}
                style={{
                  flex: 1, backgroundColor: playerColor === color ? '#d4a843' : '#2c2c2c',
                  borderRadius: 14, padding: 16, alignItems: 'center',
                  borderWidth: 1, borderColor: playerColor === color ? '#d4a843' : '#4a4a4a',
                }}
              >
                <Text style={{ fontSize: 32, marginBottom: 8 }}>{color === 'white' ? '♔' : '♚'}</Text>
                <Text style={{
                  color: playerColor === color ? '#1e1e1e' : '#f0f0f0',
                  fontWeight: '600', fontSize: 15,
                }}>
                  {color === 'white' ? 'Brancas' : 'Pretas'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Level selection */}
          <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Nível do Computador
          </Text>
          {BOT_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              onPress={() => setSelectedLevel(level)}
              style={{
                backgroundColor: selectedLevel?.id === level.id ? '#d4a843' + '20' : '#2c2c2c',
                borderRadius: 14, padding: 16, marginBottom: 10,
                borderWidth: 1.5,
                borderColor: selectedLevel?.id === level.id ? '#d4a843' : '#4a4a4a',
                flexDirection: 'row', alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 28, marginRight: 14 }}>{level.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f0f0f0', fontWeight: '600', fontSize: 15 }}>{level.name}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 13 }}>{level.description}</Text>
              </View>
              {selectedLevel?.id === level.id && (
                <Text style={{ color: '#d4a843', fontSize: 20 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Start button */}
          <TouchableOpacity
            onPress={startGame}
            disabled={!selectedLevel}
            style={{
              backgroundColor: selectedLevel ? '#d4a843' : '#3a3a3a',
              borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 8,
              borderWidth: 1, borderColor: selectedLevel ? '#d4a843' : '#4a4a4a',
            }}
          >
            <Text style={{
              color: selectedLevel ? '#1e1e1e' : '#9a9a9a',
              fontWeight: 'bold', fontSize: 18,
            }}>
              {selectedLevel ? `Jogar vs ${selectedLevel.name}` : 'Selecione o nível'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // Game screen
  const isPlayerTurn = (chess.turn() === 'w') === (playerColor === 'white');

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 8, alignItems: 'center' }}>
        {/* Header */}
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <TouchableOpacity onPress={resetGame} style={{ padding: 8 }}>
            <Text style={{ color: '#9a9a9a', fontSize: 16 }}>← Sair</Text>
          </TouchableOpacity>
          <Text style={{ color: '#d4a843', fontWeight: '600' }}>
            {selectedLevel?.icon} {selectedLevel?.name}
          </Text>
          <TouchableOpacity onPress={() => setShowMoves(!showMoves)} style={{ padding: 8 }}>
            <Text style={{ color: '#9a9a9a', fontSize: 16 }}>📋</Text>
          </TouchableOpacity>
        </View>

        {/* Bot info */}
        <View style={{
          width: BOARD_SIZE, backgroundColor: '#2c2c2c', borderRadius: 12,
          padding: 12, flexDirection: 'row', alignItems: 'center',
          borderWidth: 1, borderColor: !isPlayerTurn ? '#d4a843' : '#4a4a4a',
          marginBottom: 8,
        }}>
          <Text style={{ fontSize: 28, marginRight: 10 }}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f0f0f0', fontWeight: '600' }}>
              Computador ({selectedLevel?.name})
            </Text>
            <Text style={{ color: '#9a9a9a', fontSize: 12 }}>
              {playerColor === 'white' ? 'Pretas' : 'Brancas'}
            </Text>
          </View>
          {isThinking && <ActivityIndicator color="#d4a843" size="small" />}
        </View>

        {/* Board */}
        <View style={{
          width: BOARD_SIZE, height: BOARD_SIZE,
          borderRadius: 8, overflow: 'hidden',
          borderWidth: 2, borderColor: '#4a4a4a',
          marginVertical: 8,
        }}>
          <Chessboard
            fen={fen}
            onMove={handleMove}
            boardSize={BOARD_SIZE}
            colors={{ black: '#769656', white: '#eeeed2' }}
            gestureEnabled={isPlayerTurn && !gameOver && !isThinking}
          />
        </View>

        {/* Player info */}
        <View style={{
          width: BOARD_SIZE, backgroundColor: '#2c2c2c', borderRadius: 12,
          padding: 12, flexDirection: 'row', alignItems: 'center',
          borderWidth: 1, borderColor: isPlayerTurn ? '#d4a843' : '#4a4a4a',
          marginBottom: 8,
        }}>
          <Text style={{ fontSize: 28, marginRight: 10 }}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#f0f0f0', fontWeight: '600' }}>Você</Text>
            <Text style={{ color: '#9a9a9a', fontSize: 12 }}>
              {playerColor === 'white' ? 'Brancas' : 'Pretas'}
            </Text>
          </View>
          {isPlayerTurn && !gameOver && (
            <View style={{ backgroundColor: '#d4a843' + '30', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#d4a843', fontSize: 12, fontWeight: '600' }}>Sua vez</Text>
            </View>
          )}
        </View>

        {/* Game over */}
        {gameOver && (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 16, padding: 20,
            width: BOARD_SIZE, borderWidth: 1, borderColor: '#d4a843',
            alignItems: 'center', marginTop: 8,
          }}>
            <Text style={{ color: '#d4a843', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>
              {gameOver.result}
            </Text>
            <Text style={{ color: '#9a9a9a', marginBottom: 16 }}>{gameOver.reason}</Text>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity
                onPress={startGame}
                style={{
                  backgroundColor: '#d4a843', borderRadius: 10,
                  padding: 12, flex: 1, alignItems: 'center',
                }}
              >
                <Text style={{ color: '#1e1e1e', fontWeight: 'bold' }}>Jogar Novamente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={resetGame}
                style={{
                  backgroundColor: '#3a3a3a', borderRadius: 10,
                  padding: 12, flex: 1, alignItems: 'center',
                  borderWidth: 1, borderColor: '#4a4a4a',
                }}
              >
                <Text style={{ color: '#f0f0f0', fontWeight: '600' }}>Mudar Nível</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Controls */}
        {!gameOver && (
          <View style={{ flexDirection: 'row', gap: 10, width: BOARD_SIZE, marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Abandonar', 'Deseja abandonar a partida?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Abandonar', style: 'destructive', onPress: resetGame },
                ]);
              }}
              style={{
                backgroundColor: '#3a3a3a', borderRadius: 10, padding: 12,
                flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' + '60',
              }}
            >
              <Text style={{ color: '#ef4444', fontSize: 13 }}>🏳 Abandonar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (chess.history().length === 0) return;
                chess.undo(); // undo bot move
                chess.undo(); // undo player move
                setFen(chess.fen());
                setMoves(chess.history());
                setGameOver(null);
              }}
              style={{
                backgroundColor: '#3a3a3a', borderRadius: 10, padding: 12,
                flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#4a4a4a',
              }}
            >
              <Text style={{ color: '#f0f0f0', fontSize: 13 }}>↩ Desfazer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Move history */}
        {showMoves && moves.length > 0 && (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 12, padding: 12,
            marginTop: 12, width: BOARD_SIZE, borderWidth: 1, borderColor: '#4a4a4a',
          }}>
            <Text style={{ color: '#d4a843', fontWeight: '600', marginBottom: 8 }}>Lances</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {moves.map((san, i) => (
                <View key={i} style={{
                  backgroundColor: '#3a3a3a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
                }}>
                  <Text style={{ color: '#f0f0f0', fontSize: 13 }}>
                    {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{san}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
