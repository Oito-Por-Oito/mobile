import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnlineGame } from '@/hooks/supabase/use-online-game';
import { useSupabaseAuth } from '@/lib/auth-context';
import { ScreenContainer } from '@/components/screen-container';
import Chessboard from 'react-native-chessboard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 16, 400);

interface GameRoomProps {
  gameId: string;
  onLeaveGame: () => void;
  onRematchAccepted: (newGameId: string) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function PlayerBar({ player, timeLeft, isActive, isTop }: {
  player: any; timeLeft: number; isActive: boolean; isTop: boolean;
}) {
  const isLow = timeLeft < 30000;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: '#2c2c2c', borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: isActive ? '#d4a843' : '#4a4a4a',
      marginVertical: 4,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center',
          marginRight: 10, borderWidth: 1, borderColor: '#4a4a4a',
        }}>
          <Text style={{ fontSize: 20 }}>👤</Text>
        </View>
        <View>
          <Text style={{ color: '#f0f0f0', fontWeight: '600', fontSize: 14 }}>
            {player?.display_name || player?.username || 'Jogador'}
          </Text>
          <Text style={{ color: '#9a9a9a', fontSize: 12 }}>
            {player?.rating_rapid || player?.rating_blitz || 800}
          </Text>
        </View>
      </View>
      <View style={{
        backgroundColor: isActive ? (isLow ? '#ef4444' : '#1e1e1e') : '#3a3a3a',
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: isActive ? (isLow ? '#ef4444' : '#d4a843') : '#4a4a4a',
        minWidth: 70, alignItems: 'center',
      }}>
        <Text style={{
          color: isActive ? (isLow ? '#ef4444' : '#d4a843') : '#9a9a9a',
          fontWeight: 'bold', fontSize: 18, fontVariant: ['tabular-nums'],
        }}>
          {formatTime(timeLeft)}
        </Text>
      </View>
    </View>
  );
}

export function GameRoom({ gameId, onLeaveGame, onRematchAccepted }: GameRoomProps) {
  const router = useRouter();
  const { profile } = useSupabaseAuth();
  const {
    game, chess, myColor, opponent, timeLeft, loading, error, moves,
    drawOffer, rematchOffer, rematchGameId,
    makeMove, resign, offerDraw, acceptDraw, declineDraw, cancelDraw,
    offerRematch, acceptRematch, declineRematch, cancelRematch,
    isMyTurn, isGameOver,
  } = useOnlineGame(gameId);

  const [showMoves, setShowMoves] = useState(false);

  const handleMove = useCallback(async ({ move }: { move: { from: string; to: string; promotion?: string } }) => {
    if (!isMyTurn || isGameOver) return;
    await makeMove(move.from, move.to, move.promotion);
  }, [isMyTurn, isGameOver, makeMove]);

  const handleResign = () => {
    Alert.alert('Abandonar partida', 'Tem certeza que deseja abandonar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abandonar', style: 'destructive', onPress: resign },
    ]);
  };

  React.useEffect(() => {
    if (rematchGameId) {
      onRematchAccepted(rematchGameId);
    }
  }, [rematchGameId, onRematchAccepted]);

  if (loading) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#d4a843" size="large" />
          <Text style={{ color: '#9a9a9a', marginTop: 12 }}>Carregando partida...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !game) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#f87171', marginBottom: 16, textAlign: 'center' }}>
            {error || 'Partida não encontrada'}
          </Text>
          <TouchableOpacity
            onPress={onLeaveGame}
            style={{ backgroundColor: '#3a3a3a', borderRadius: 12, padding: 14, paddingHorizontal: 24 }}
          >
            <Text style={{ color: '#f0f0f0', fontWeight: '600' }}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const isFlipped = myColor === 'black';
  const topPlayer = isFlipped ? (game.white_player || {}) : opponent;
  const bottomPlayer = isFlipped ? opponent : (game.white_player || {});
  const topTime = isFlipped ? timeLeft.white : timeLeft.black;
  const bottomTime = isFlipped ? timeLeft.black : timeLeft.white;
  const topIsActive = isFlipped ? game.current_turn === 'white' : game.current_turn === 'black';

  // Game result
  let resultText = '';
  if (isGameOver && game.result) {
    if (game.result === '1/2-1/2') resultText = 'Empate';
    else if (
      (game.result === '1-0' && myColor === 'white') ||
      (game.result === '0-1' && myColor === 'black')
    ) resultText = '🏆 Você venceu!';
    else resultText = '😔 Você perdeu';
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 8, alignItems: 'center' }}>
        {/* Back button */}
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity onPress={onLeaveGame} style={{ padding: 8 }}>
            <Text style={{ color: '#9a9a9a', fontSize: 16 }}>← Sair</Text>
          </TouchableOpacity>
          <Text style={{ color: '#d4a843', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
            {game.time_control} • {game.initial_time}min
          </Text>
        </View>

        {/* Top player */}
        <View style={{ width: BOARD_SIZE }}>
          <PlayerBar player={topPlayer} timeLeft={topTime} isActive={topIsActive} isTop />
        </View>

        {/* Chess Board */}
        <View style={{
          width: BOARD_SIZE, height: BOARD_SIZE,
          borderRadius: 8, overflow: 'hidden',
          borderWidth: 2, borderColor: '#4a4a4a',
          marginVertical: 8,
        }}>
          <Chessboard
            fen={game.fen}
            onMove={handleMove}
            boardSize={BOARD_SIZE}
            colors={{
              black: '#769656',
              white: '#eeeed2',
            }}
            gestureEnabled={isMyTurn && !isGameOver}
          />
        </View>

        {/* Bottom player */}
        <View style={{ width: BOARD_SIZE }}>
          <PlayerBar player={bottomPlayer} timeLeft={bottomTime} isActive={!topIsActive} isTop={false} />
        </View>

        {/* Game result overlay */}
        {isGameOver && resultText && (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 16,
            padding: 20, marginTop: 12, width: BOARD_SIZE,
            borderWidth: 1, borderColor: '#d4a843', alignItems: 'center',
          }}>
            <Text style={{ color: '#d4a843', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>
              {resultText}
            </Text>
            <Text style={{ color: '#9a9a9a', fontSize: 14, marginBottom: 16 }}>
              {game.result_reason === 'checkmate' ? 'Xeque-mate' :
                game.result_reason === 'resignation' ? 'Abandono' :
                  game.result_reason === 'timeout' ? 'Tempo esgotado' :
                    game.result_reason === 'agreement' ? 'Acordo mútuo' :
                      game.result_reason === 'stalemate' ? 'Afogamento' : game.result_reason}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={offerRematch}
                style={{
                  backgroundColor: '#d4a843', borderRadius: 10,
                  padding: 12, paddingHorizontal: 20, flex: 1, alignItems: 'center',
                }}
              >
                <Text style={{ color: '#1e1e1e', fontWeight: 'bold' }}>Revanche</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onLeaveGame}
                style={{
                  backgroundColor: '#3a3a3a', borderRadius: 10,
                  padding: 12, paddingHorizontal: 20, flex: 1, alignItems: 'center',
                  borderWidth: 1, borderColor: '#4a4a4a',
                }}
              >
                <Text style={{ color: '#f0f0f0', fontWeight: '600' }}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Draw offer */}
        {drawOffer && drawOffer !== profile?.id && (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 16,
            padding: 16, marginTop: 12, width: BOARD_SIZE,
            borderWidth: 1, borderColor: '#d4a843', alignItems: 'center',
          }}>
            <Text style={{ color: '#f0f0f0', marginBottom: 12 }}>Oponente ofereceu empate</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={acceptDraw}
                style={{ backgroundColor: '#22c55e', borderRadius: 10, padding: 12, flex: 1, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={declineDraw}
                style={{ backgroundColor: '#ef4444', borderRadius: 10, padding: 12, flex: 1, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Recusar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Rematch offer */}
        {rematchOffer && rematchOffer !== profile?.id && (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 16,
            padding: 16, marginTop: 12, width: BOARD_SIZE,
            borderWidth: 1, borderColor: '#d4a843', alignItems: 'center',
          }}>
            <Text style={{ color: '#f0f0f0', marginBottom: 12 }}>Oponente quer revanche!</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={acceptRematch}
                style={{ backgroundColor: '#d4a843', borderRadius: 10, padding: 12, flex: 1, alignItems: 'center' }}
              >
                <Text style={{ color: '#1e1e1e', fontWeight: 'bold' }}>Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={declineRematch}
                style={{ backgroundColor: '#3a3a3a', borderRadius: 10, padding: 12, flex: 1, alignItems: 'center' }}
              >
                <Text style={{ color: '#f0f0f0', fontWeight: '600' }}>Recusar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Game Controls */}
        {!isGameOver && (
          <View style={{
            flexDirection: 'row', gap: 10, marginTop: 12, width: BOARD_SIZE,
          }}>
            <TouchableOpacity
              onPress={() => {
                if (drawOffer === profile?.id) { cancelDraw(); }
                else { offerDraw(); }
              }}
              style={{
                backgroundColor: '#3a3a3a', borderRadius: 10,
                padding: 12, flex: 1, alignItems: 'center',
                borderWidth: 1, borderColor: '#4a4a4a',
              }}
            >
              <Text style={{ color: '#f0f0f0', fontSize: 13 }}>
                {drawOffer === profile?.id ? '↩ Cancelar' : '🤝 Empate'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleResign}
              style={{
                backgroundColor: '#3a3a3a', borderRadius: 10,
                padding: 12, flex: 1, alignItems: 'center',
                borderWidth: 1, borderColor: '#ef4444' + '60',
              }}
            >
              <Text style={{ color: '#ef4444', fontSize: 13 }}>🏳 Abandonar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowMoves(!showMoves)}
              style={{
                backgroundColor: '#3a3a3a', borderRadius: 10,
                padding: 12, flex: 1, alignItems: 'center',
                borderWidth: 1, borderColor: '#4a4a4a',
              }}
            >
              <Text style={{ color: '#f0f0f0', fontSize: 13 }}>📋 Lances</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Move history */}
        {showMoves && moves.length > 0 && (
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 12,
            padding: 12, marginTop: 12, width: BOARD_SIZE,
            borderWidth: 1, borderColor: '#4a4a4a',
            maxHeight: 200,
          }}>
            <Text style={{ color: '#d4a843', fontWeight: '600', marginBottom: 8 }}>Lances</Text>
            <ScrollView>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {moves.map((move, i) => (
                  <View key={move.id || i} style={{
                    backgroundColor: '#3a3a3a', borderRadius: 6,
                    paddingHorizontal: 8, paddingVertical: 4,
                  }}>
                    <Text style={{ color: '#f0f0f0', fontSize: 13 }}>
                      {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{move.san}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
