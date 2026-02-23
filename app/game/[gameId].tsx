import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Chessboard, { type ChessboardRef } from 'react-native-chessboard';
import { ScreenContainer } from '@/components/screen-container';
import { useGameReplay, INITIAL_FEN } from '@/hooks/supabase/use-game-replay';
import { useMoveAnalysis, CLASSIFICATION_CONFIG, type MoveClassification } from '@/hooks/use-move-analysis';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 32, 400);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const secs = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function formatTimeControl(initial: number | null, increment: number | null): string {
  if (!initial) return '—';
  const mins = Math.floor(initial / 60);
  return increment && increment > 0 ? `${mins}+${increment}` : `${mins} min`;
}

function resultLabel(result: string | null, reason: string | null): string {
  const reasons: Record<string, string> = {
    checkmate: 'Xeque-mate',
    resignation: 'Desistência',
    timeout: 'Tempo esgotado',
    stalemate: 'Afogamento',
    draw_agreement: 'Acordo de empate',
    insufficient_material: 'Material insuficiente',
    repetition: 'Repetição',
  };
  const r = reasons[reason ?? ''] ?? reason ?? '';
  if (result === 'draw') return `Empate${r ? ` — ${r}` : ''}`;
  if (result === 'white') return `Brancas vencem${r ? ` — ${r}` : ''}`;
  if (result === 'black') return `Pretas vencem${r ? ` — ${r}` : ''}`;
  return result ?? '—';
}

function resultColor(result: string | null): string {
  if (result === 'draw') return '#f59e0b';
  return '#22c55e';
}

function playerName(player: { display_name?: string | null; username: string } | null | undefined): string {
  if (!player) return 'Desconhecido';
  return player.display_name ?? player.username;
}

/** Format centipawn score for display (e.g. +1.2, -0.5, M3) */
function formatScore(score: number, mate: number | null): string {
  if (mate !== null) return mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`;
  const pawns = score / 100;
  return pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
}

// ─── Componente: Card de jogador com precisão ─────────────────────────────────

function PlayerCard({
  player,
  side,
  isWinner,
  timeLeft,
  accuracy,
}: {
  player: { display_name?: string | null; username: string; rating_blitz: number } | null | undefined;
  side: 'white' | 'black';
  isWinner: boolean;
  timeLeft?: number | null;
  accuracy?: number | null;
}) {
  const name = playerName(player);
  const initial = name[0]?.toUpperCase() ?? '?';

  return (
    <View style={[styles.playerCard, isWinner && styles.playerCardWinner]}>
      <View style={[styles.playerAvatar, { backgroundColor: side === 'white' ? '#f0f0f0' : '#2c2c2c', borderColor: side === 'white' ? '#d4a843' : '#666' }]}>
        <Text style={[styles.playerAvatarText, { color: side === 'white' ? '#1e1e1e' : '#f0f0f0' }]}>{initial}</Text>
      </View>
      <View style={styles.playerInfo}>
        <View style={styles.playerNameRow}>
          <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
          {isWinner && <Text style={styles.winnerBadge}>🏆</Text>}
        </View>
        <Text style={styles.playerRating}>
          {side === 'white' ? '♔' : '♚'} {player?.rating_blitz ?? '—'}
          {timeLeft != null && timeLeft > 0 ? `  ·  ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}` : ''}
        </Text>
      </View>
      {accuracy != null && (
        <View style={styles.accuracyBadge}>
          <Text style={styles.accuracyValue}>{accuracy.toFixed(0)}%</Text>
          <Text style={styles.accuracyLabel}>precisão</Text>
        </View>
      )}
    </View>
  );
}

// ─── Componente: Barra de avaliação ──────────────────────────────────────────

function EvalBar({ score, mate }: { score: number; mate: number | null }) {
  // Clamp score to ±800 cp for display
  const clampedScore = Math.max(-800, Math.min(800, score));
  // White advantage: 0 = all black, 1 = all white
  const whiteAdvantage = (clampedScore + 800) / 1600;
  const whiteHeight = `${Math.round(whiteAdvantage * 100)}%`;

  return (
    <View style={styles.evalBarContainer}>
      <View style={styles.evalBarTrack}>
        {/* Black side (top) */}
        <View style={[styles.evalBarBlack, { flex: 1 - whiteAdvantage }]} />
        {/* White side (bottom) */}
        <View style={[styles.evalBarWhite, { flex: whiteAdvantage }]} />
      </View>
      <Text style={styles.evalScore} numberOfLines={1}>
        {mate !== null
          ? (mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`)
          : (() => {
              const p = score / 100;
              return p >= 0 ? `+${p.toFixed(1)}` : p.toFixed(1);
            })()}
      </Text>
    </View>
  );
}

// ─── Componente: Resumo de precisão ──────────────────────────────────────────

function AccuracySummary({
  white,
  black,
}: {
  white: { accuracy: number; brilliant: number; excellent: number; good: number; inaccuracy: number; mistake: number; blunder: number };
  black: { accuracy: number; brilliant: number; excellent: number; good: number; inaccuracy: number; mistake: number; blunder: number };
}) {
  const rows: Array<{ key: MoveClassification; label: string; symbol: string; color: string }> = [
    { key: 'brilliant', label: 'Brilhante', symbol: '!!', color: '#00b5ff' },
    { key: 'excellent', label: 'Excelente', symbol: '!', color: '#22c55e' },
    { key: 'good', label: 'Bom', symbol: '', color: '#9a9a9a' },
    { key: 'inaccuracy', label: 'Imprecisão', symbol: '?!', color: '#f59e0b' },
    { key: 'mistake', label: 'Erro', symbol: '?', color: '#f97316' },
    { key: 'blunder', label: 'Blunder', symbol: '??', color: '#ef4444' },
  ];

  return (
    <View style={styles.accuracySummary}>
      <Text style={styles.sectionTitle}>Resumo da Análise</Text>

      {/* Accuracy row */}
      <View style={styles.accuracyRow}>
        <View style={styles.accuracyCol}>
          <Text style={styles.accuracyBigValue}>{white.accuracy.toFixed(0)}%</Text>
          <Text style={styles.accuracyColLabel}>Brancas</Text>
        </View>
        <View style={styles.accuracyDivider} />
        <View style={styles.accuracyCol}>
          <Text style={styles.accuracyBigValue}>{black.accuracy.toFixed(0)}%</Text>
          <Text style={styles.accuracyColLabel}>Pretas</Text>
        </View>
      </View>

      {/* Classification breakdown */}
      {rows.map((row) => {
        const wCount = white[row.key];
        const bCount = black[row.key];
        if (wCount === 0 && bCount === 0) return null;
        return (
          <View key={row.key} style={styles.classRow}>
            <Text style={[styles.classSymbol, { color: row.color }]}>{row.symbol || '—'}</Text>
            <Text style={styles.classLabel}>{row.label}</Text>
            <View style={styles.classCountsRow}>
              <Text style={[styles.classCount, { color: wCount > 0 ? row.color : '#444' }]}>{wCount}</Text>
              <Text style={styles.classCountSep}>/</Text>
              <Text style={[styles.classCount, { color: bCount > 0 ? row.color : '#444' }]}>{bCount}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Componente: Lista de lances com classificação ────────────────────────────

function MoveList({
  moves,
  currentIndex,
  onSelect,
  getClassification,
}: {
  moves: Array<{ move_number: number; san: string }>;
  currentIndex: number;
  onSelect: (index: number) => void;
  getClassification: (index: number) => typeof CLASSIFICATION_CONFIG[MoveClassification] | null;
}) {
  const pairs: Array<{
    moveNum: number;
    white: { san: string; idx: number } | null;
    black: { san: string; idx: number } | null;
  }> = [];

  for (let i = 0; i < moves.length; i += 2) {
    const pairNum = Math.floor(i / 2) + 1;
    pairs.push({
      moveNum: pairNum,
      white: moves[i] ? { san: moves[i].san, idx: i } : null,
      black: moves[i + 1] ? { san: moves[i + 1].san, idx: i + 1 } : null,
    });
  }

  return (
    <ScrollView style={styles.moveList} contentContainerStyle={styles.moveListContent} showsVerticalScrollIndicator={false}>
      {pairs.map((pair) => (
        <View key={pair.moveNum} style={styles.movePair}>
          <Text style={styles.movePairNum}>{pair.moveNum}.</Text>

          {/* Lance das brancas */}
          {pair.white ? (
            <TouchableOpacity
              style={[styles.moveBtn, currentIndex === pair.white.idx && styles.moveBtnActive]}
              onPress={() => onSelect(pair.white!.idx)}
              activeOpacity={0.7}
            >
              <View style={styles.moveBtnInner}>
                <Text style={[styles.moveBtnText, currentIndex === pair.white.idx && styles.moveBtnTextActive]}>
                  {pair.white.san}
                </Text>
                {(() => {
                  const cls = getClassification(pair.white.idx);
                  if (!cls || !cls.symbol) return null;
                  return (
                    <Text style={[styles.moveClassSymbol, { color: cls.color }]}>{cls.symbol}</Text>
                  );
                })()}
              </View>
            </TouchableOpacity>
          ) : <View style={styles.moveBtn} />}

          {/* Lance das pretas */}
          {pair.black ? (
            <TouchableOpacity
              style={[styles.moveBtn, currentIndex === pair.black.idx && styles.moveBtnActive]}
              onPress={() => onSelect(pair.black!.idx)}
              activeOpacity={0.7}
            >
              <View style={styles.moveBtnInner}>
                <Text style={[styles.moveBtnText, currentIndex === pair.black.idx && styles.moveBtnTextActive]}>
                  {pair.black.san}
                </Text>
                {(() => {
                  const cls = getClassification(pair.black.idx);
                  if (!cls || !cls.symbol) return null;
                  return (
                    <Text style={[styles.moveClassSymbol, { color: cls.color }]}>{cls.symbol}</Text>
                  );
                })()}
              </View>
            </TouchableOpacity>
          ) : <View style={styles.moveBtn} />}
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function GameReplayScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const router = useRouter();
  const boardRef = useRef<ChessboardRef>(null);
  const [boardReady, setBoardReady] = useState(false);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);

  const {
    game,
    moves,
    currentIndex,
    currentFen,
    currentMove,
    totalMoves,
    loading,
    error,
    isPlaying,
    playSpeed,
    setPlaySpeed,
    goToStart,
    goToEnd,
    goToPrev,
    goToNext,
    goToIndex,
    togglePlay,
    canGoPrev,
    canGoNext,
    refresh,
  } = useGameReplay(gameId ?? null);

  // Construir array de FENs para análise: [initial, ...fen_after_each_move]
  const fens = useMemo(() => {
    if (!moves.length) return [];
    return [INITIAL_FEN, ...moves.map((m) => m.fen_after)];
  }, [moves]);

  const {
    analysis,
    loading: analysisLoading,
    error: analysisError,
    getClassification,
    retry: retryAnalysis,
  } = useMoveAnalysis(fens, analysisEnabled);

  // Avaliação do lance atual
  const currentMoveAnalysis = currentIndex >= 0 ? analysis?.moves[currentIndex] : null;
  const currentScore = currentMoveAnalysis?.scoreAfter ?? 0;
  const currentMate = currentMoveAnalysis?.mate ?? null;

  // Sincronizar o tabuleiro com o FEN atual
  useEffect(() => {
    if (!boardReady) return;
    try {
      boardRef.current?.resetBoard(currentFen);
      if (currentMove) {
        boardRef.current?.resetAllHighlightedSquares();
        // Colorir o destaque com a cor da classificação se disponível
        const cls = currentMoveAnalysis
          ? CLASSIFICATION_CONFIG[currentMoveAnalysis.classification]
          : null;
        const highlightColor = cls ? cls.color + '44' : '#d4a84355';
        const highlightColorDest = cls ? cls.color + 'aa' : '#d4a843aa';
        boardRef.current?.highlight({ square: currentMove.from_square as any, color: highlightColor });
        boardRef.current?.highlight({ square: currentMove.to_square as any, color: highlightColorDest });
      } else {
        boardRef.current?.resetAllHighlightedSquares();
      }
    } catch {
      // Ignorar erros de sincronização do tabuleiro
    }
  }, [currentFen, currentMove, boardReady, currentMoveAnalysis]);

  const handleBoardReady = useCallback(() => {
    setBoardReady(true);
  }, []);

  const speedOptions = [
    { label: '0.5×', value: 2000 },
    { label: '1×', value: 1000 },
    { label: '2×', value: 500 },
    { label: '3×', value: 333 },
  ];

  if (loading) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Replay</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#d4a843" />
          <Text style={styles.loaderText}>Carregando partida...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !game) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Replay</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.centerLoader}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error ?? 'Partida não encontrada'}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const isWhiteWinner = game.winner_id === game.white_player_id;
  const isBlackWinner = game.winner_id === game.black_player_id;
  const whiteTimeLeft = currentMove?.player_id === game.white_player_id ? currentMove.time_left : null;
  const blackTimeLeft = currentMove?.player_id === game.black_player_id ? currentMove.time_left : null;

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Replay</Text>
          <Text style={styles.headerSubtitle}>
            {formatTimeControl(game.initial_time, game.increment)}
            {' · '}
            {formatDuration(game.started_at, game.ended_at)}
          </Text>
        </View>
        {/* Botão de análise */}
        <TouchableOpacity
          style={[styles.analyzeBtn, analysisEnabled && styles.analyzeBtnActive]}
          onPress={() => setAnalysisEnabled((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={[styles.analyzeBtnText, analysisEnabled && styles.analyzeBtnTextActive]}>
            {analysisEnabled ? '🔍' : '🔍'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Resultado */}
        <View style={[styles.resultBanner, { borderColor: resultColor(game.result) + '44' }]}>
          <Text style={[styles.resultText, { color: resultColor(game.result) }]}>
            {resultLabel(game.result, game.result_reason)}
          </Text>
        </View>

        {/* Jogador preto (topo) */}
        <PlayerCard
          player={game.black_player}
          side="black"
          isWinner={isBlackWinner}
          timeLeft={blackTimeLeft}
          accuracy={analysis?.black.accuracy ?? null}
        />

        {/* Tabuleiro + barra de avaliação */}
        <View style={styles.boardRow}>
          {/* Barra de avaliação (só quando análise ativa) */}
          {analysisEnabled && analysis && (
            <EvalBar score={currentScore} mate={currentMate} />
          )}

          {/* Tabuleiro */}
          <View style={styles.boardContainer}>
            <Chessboard
              ref={boardRef}
              fen={INITIAL_FEN}
              boardSize={analysisEnabled && analysis ? BOARD_SIZE - 24 : BOARD_SIZE}
              gestureEnabled={false}
              withLetters
              withNumbers
              colors={{
                white: '#f0d9b5',
                black: '#b58863',
                lastMoveHighlight: '#d4a84333',
                checkmateHighlight: '#ef444466',
              }}
              durations={{ move: 150 }}
              onMove={handleBoardReady as any}
            />
          </View>
        </View>

        {/* Indicador de posição + classificação do lance */}
        <View style={styles.positionIndicator}>
          <Text style={styles.positionText}>
            {currentIndex === -1
              ? 'Posição inicial'
              : `Lance ${currentIndex + 1} de ${totalMoves}`}
          </Text>
          <View style={styles.positionRight}>
            {currentMove && (
              <Text style={styles.sanText}>{currentMove.san}</Text>
            )}
            {currentMoveAnalysis && (() => {
              const cls = CLASSIFICATION_CONFIG[currentMoveAnalysis.classification];
              return (
                <View style={[styles.classificationBadge, { backgroundColor: cls.bgColor, borderColor: cls.color + '66' }]}>
                  {cls.symbol ? (
                    <Text style={[styles.classificationSymbol, { color: cls.color }]}>{cls.symbol}</Text>
                  ) : null}
                  <Text style={[styles.classificationLabel, { color: cls.color }]}>{cls.label}</Text>
                </View>
              );
            })()}
          </View>
        </View>

        {/* Jogador branco (base) */}
        <PlayerCard
          player={game.white_player}
          side="white"
          isWinner={isWhiteWinner}
          timeLeft={whiteTimeLeft}
          accuracy={analysis?.white.accuracy ?? null}
        />

        {/* Controles de navegação */}
        <View style={styles.controls}>
          {/* Barra de progresso */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${totalMoves > 0 ? ((currentIndex + 1) / totalMoves) * 100 : 0}%` },
              ]}
            />
          </View>

          {/* Botões de navegação */}
          <View style={styles.navButtons}>
            <TouchableOpacity style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]} onPress={goToStart} disabled={!canGoPrev} activeOpacity={0.7}>
              <Text style={[styles.navBtnText, !canGoPrev && styles.navBtnTextDisabled]}>⏮</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]} onPress={goToPrev} disabled={!canGoPrev} activeOpacity={0.7}>
              <Text style={[styles.navBtnText, !canGoPrev && styles.navBtnTextDisabled]}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtnPlay, isPlaying && styles.navBtnPlayActive]} onPress={togglePlay} activeOpacity={0.8}>
              <Text style={styles.navBtnPlayText}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]} onPress={goToNext} disabled={!canGoNext} activeOpacity={0.7}>
              <Text style={[styles.navBtnText, !canGoNext && styles.navBtnTextDisabled]}>▶</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]} onPress={goToEnd} disabled={!canGoNext} activeOpacity={0.7}>
              <Text style={[styles.navBtnText, !canGoNext && styles.navBtnTextDisabled]}>⏭</Text>
            </TouchableOpacity>
          </View>

          {/* Velocidade de reprodução */}
          <View style={styles.speedRow}>
            <Text style={styles.speedLabel}>Velocidade:</Text>
            {speedOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.speedBtn, playSpeed === opt.value && styles.speedBtnActive]}
                onPress={() => setPlaySpeed(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.speedBtnText, playSpeed === opt.value && styles.speedBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Banner de análise em progresso */}
        {analysisEnabled && analysisLoading && (
          <View style={styles.analysisBanner}>
            <ActivityIndicator size="small" color="#d4a843" />
            <Text style={styles.analysisBannerText}>Analisando com Stockfish...</Text>
          </View>
        )}

        {analysisEnabled && analysisError && (
          <View style={styles.analysisErrorBanner}>
            <Text style={styles.analysisErrorText}>⚠️ {analysisError}</Text>
            <TouchableOpacity onPress={retryAnalysis} style={styles.analysisRetryBtn}>
              <Text style={styles.analysisRetryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resumo de precisão */}
        {analysisEnabled && analysis && (
          <AccuracySummary white={analysis.white} black={analysis.black} />
        )}

        {/* Lista de lances */}
        {totalMoves > 0 ? (
          <View style={styles.moveListContainer}>
            <Text style={styles.sectionTitle}>Lances ({totalMoves})</Text>
            <MoveList
              moves={moves}
              currentIndex={currentIndex}
              onSelect={goToIndex}
              getClassification={getClassification}
            />
          </View>
        ) : (
          <View style={styles.noMovesContainer}>
            <Text style={styles.noMovesIcon}>♟</Text>
            <Text style={styles.noMovesText}>Lances não registrados</Text>
            <Text style={styles.noMovesSubtext}>Esta partida não possui lances salvos para replay.</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#3a3a3a',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { color: '#9a9a9a', fontSize: 24 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#f0f0f0', fontSize: 17, fontWeight: '600' },
  headerSubtitle: { color: '#9a9a9a', fontSize: 12, marginTop: 1 },
  analyzeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2c2c2c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  analyzeBtnActive: { backgroundColor: '#d4a84322', borderColor: '#d4a843' },
  analyzeBtnText: { fontSize: 16 },
  analyzeBtnTextActive: { color: '#d4a843' },

  scrollContent: { paddingBottom: 40 },

  // Resultado
  resultBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  resultText: { fontSize: 14, fontWeight: '700' },

  // Player card
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    gap: 12,
  },
  playerCardWinner: { borderColor: '#d4a843' },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: { fontSize: 16, fontWeight: 'bold' },
  playerInfo: { flex: 1 },
  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playerName: { color: '#f0f0f0', fontSize: 14, fontWeight: '600', flex: 1 },
  winnerBadge: { fontSize: 14 },
  playerRating: { color: '#9a9a9a', fontSize: 12, marginTop: 2 },
  accuracyBadge: { alignItems: 'center' },
  accuracyValue: { color: '#d4a843', fontSize: 16, fontWeight: '700' },
  accuracyLabel: { color: '#9a9a9a', fontSize: 10 },

  // Board row (board + eval bar)
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  boardContainer: { alignItems: 'center' },

  // Eval bar
  evalBarContainer: {
    width: 20,
    alignItems: 'center',
    gap: 4,
  },
  evalBarTrack: {
    width: 14,
    height: BOARD_SIZE - 24,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  evalBarBlack: { backgroundColor: '#2c2c2c', minHeight: 4 },
  evalBarWhite: { backgroundColor: '#f0f0f0', minHeight: 4 },
  evalScore: {
    color: '#9a9a9a',
    fontSize: 9,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Position indicator
  positionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  positionText: { color: '#9a9a9a', fontSize: 12 },
  positionRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sanText: {
    color: '#d4a843',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  classificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    gap: 3,
  },
  classificationSymbol: { fontSize: 11, fontWeight: '700' },
  classificationLabel: { fontSize: 11, fontWeight: '600' },

  // Controls
  controls: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#2c2c2c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    gap: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#3a3a3a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d4a843',
    borderRadius: 2,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: '#f0f0f0', fontSize: 18 },
  navBtnTextDisabled: { color: '#666' },
  navBtnPlay: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d4a843',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPlayActive: { backgroundColor: '#b8923a' },
  navBtnPlayText: { color: '#1e1e1e', fontSize: 22, fontWeight: 'bold' },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  speedLabel: { color: '#9a9a9a', fontSize: 12 },
  speedBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  speedBtnActive: { backgroundColor: '#d4a84322', borderColor: '#d4a843' },
  speedBtnText: { color: '#9a9a9a', fontSize: 12, fontWeight: '500' },
  speedBtnTextActive: { color: '#d4a843' },

  // Analysis banners
  analysisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d4a84344',
  },
  analysisBannerText: { color: '#d4a843', fontSize: 13 },
  analysisErrorBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#ef444411',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ef444444',
    alignItems: 'center',
    gap: 8,
  },
  analysisErrorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  analysisRetryBtn: {
    backgroundColor: '#ef444422',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  analysisRetryText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },

  // Accuracy summary
  accuracySummary: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#2c2c2c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 24,
  },
  accuracyCol: { alignItems: 'center', flex: 1 },
  accuracyBigValue: { color: '#d4a843', fontSize: 28, fontWeight: '700' },
  accuracyColLabel: { color: '#9a9a9a', fontSize: 12, marginTop: 2 },
  accuracyDivider: { width: 1, height: 40, backgroundColor: '#3a3a3a' },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#3a3a3a',
    gap: 8,
  },
  classSymbol: { fontSize: 13, fontWeight: '700', width: 24, textAlign: 'center' },
  classLabel: { color: '#9a9a9a', fontSize: 13, flex: 1 },
  classCountsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  classCount: { fontSize: 13, fontWeight: '600', width: 20, textAlign: 'center' },
  classCountSep: { color: '#444', fontSize: 12 },

  // Move list
  moveListContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#2c2c2c',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  sectionTitle: {
    color: '#f0f0f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  moveList: { maxHeight: 220 },
  moveListContent: { gap: 4 },
  movePair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  movePairNum: {
    color: '#666',
    fontSize: 12,
    width: 28,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  moveBtn: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  moveBtnActive: { backgroundColor: '#d4a843' },
  moveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moveBtnText: {
    color: '#9a9a9a',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  moveBtnTextActive: { color: '#1e1e1e', fontWeight: '700' },
  moveClassSymbol: { fontSize: 11, fontWeight: '700' },

  // No moves
  noMovesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    gap: 8,
  },
  noMovesIcon: { fontSize: 40, marginBottom: 4 },
  noMovesText: { color: '#f0f0f0', fontSize: 15, fontWeight: '600' },
  noMovesSubtext: { color: '#9a9a9a', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Loader / error
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  loaderText: { color: '#9a9a9a', fontSize: 14 },
  errorIcon: { fontSize: 40 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#d4a843',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryText: { color: '#1e1e1e', fontWeight: '600', fontSize: 14 },
});
