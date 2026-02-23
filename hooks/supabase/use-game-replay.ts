import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface GameMove {
  id: string;
  game_id: string;
  move_number: number;
  player_id: string | null;
  from_square: string;
  to_square: string;
  san: string;           // Standard Algebraic Notation (ex: "e4", "Nf3", "O-O")
  fen_after: string;     // FEN da posição após o lance
  time_left: number | null;
  created_at: string;
}

export interface GameDetail {
  id: string;
  white_player_id: string | null;
  black_player_id: string | null;
  status: string;
  time_control: string | null;
  initial_time: number | null;
  increment: number | null;
  result: string | null;
  result_reason: string | null;
  winner_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  pgn: string | null;
  white_player?: PlayerInfo | null;
  black_player?: PlayerInfo | null;
}

export interface PlayerInfo {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  rating_blitz: number;
  rating_rapid: number;
  rating_classical: number;
}

// FEN inicial do xadrez
export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useGameReplay(gameId: string | null) {
  const [game, setGame] = useState<GameDetail | null>(null);
  const [moves, setMoves] = useState<GameMove[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = posição inicial
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000); // ms por lance
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Posição FEN atual
  const currentFen = currentIndex === -1
    ? INITIAL_FEN
    : moves[currentIndex]?.fen_after ?? INITIAL_FEN;

  // Lance atual
  const currentMove = currentIndex >= 0 ? moves[currentIndex] : null;

  // Total de lances
  const totalMoves = moves.length;

  // Carregar dados da partida e lances
  const load = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setError(null);

    // Buscar dados da partida
    const { data: gameData, error: gameErr } = await supabase
      .from('games')
      .select('id, white_player_id, black_player_id, status, time_control, initial_time, increment, result, result_reason, winner_id, started_at, ended_at, pgn')
      .eq('id', gameId)
      .single();

    if (gameErr || !gameData) {
      setError(gameErr?.message ?? 'Partida não encontrada');
      setLoading(false);
      return;
    }

    // Buscar perfis dos jogadores
    const playerIds = [gameData.white_player_id, gameData.black_player_id].filter(Boolean) as string[];
    let whitePl: PlayerInfo | null = null;
    let blackPl: PlayerInfo | null = null;

    if (playerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url, rating_blitz, rating_rapid, rating_classical')
        .in('user_id', playerIds);

      if (profiles) {
        whitePl = profiles.find((p: PlayerInfo) => p.user_id === gameData.white_player_id) ?? null;
        blackPl = profiles.find((p: PlayerInfo) => p.user_id === gameData.black_player_id) ?? null;
      }
    }

    setGame({ ...gameData, white_player: whitePl, black_player: blackPl });

    // Buscar lances ordenados
    const { data: movesData, error: movesErr } = await supabase
      .from('game_moves')
      .select('id, game_id, move_number, player_id, from_square, to_square, san, fen_after, time_left, created_at')
      .eq('game_id', gameId)
      .order('move_number', { ascending: true });

    if (movesErr) {
      setError(movesErr.message);
      setLoading(false);
      return;
    }

    setMoves(movesData ?? []);
    setCurrentIndex(-1);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    if (gameId) load();
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [gameId, load]);

  // ── Navegação ──────────────────────────────────────────────────────────────

  const goToStart = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(-1);
  }, []);

  const goToEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(totalMoves - 1);
  }, [totalMoves]);

  const goToPrev = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(-1, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = Math.min(totalMoves - 1, prev + 1);
      if (next === totalMoves - 1) setIsPlaying(false);
      return next;
    });
  }, [totalMoves]);

  const goToIndex = useCallback((index: number) => {
    setIsPlaying(false);
    setCurrentIndex(Math.max(-1, Math.min(totalMoves - 1, index)));
  }, [totalMoves]);

  // ── Reprodução automática ──────────────────────────────────────────────────

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev && currentIndex >= totalMoves - 1) {
        // Reiniciar do início se já está no fim
        setCurrentIndex(-1);
      }
      return !prev;
    });
  }, [currentIndex, totalMoves]);

  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }

    if (currentIndex >= totalMoves - 1) {
      setIsPlaying(false);
      return;
    }

    playTimerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= totalMoves - 1) setIsPlaying(false);
        return next;
      });
    }, playSpeed);

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentIndex, totalMoves, playSpeed]);

  return {
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
    refresh: load,
    // Helpers de estado
    canGoPrev: currentIndex > -1,
    canGoNext: currentIndex < totalMoves - 1,
    isAtStart: currentIndex === -1,
    isAtEnd: currentIndex === totalMoves - 1,
    progress: totalMoves > 0 ? (currentIndex + 1) / totalMoves : 0,
  };
}
