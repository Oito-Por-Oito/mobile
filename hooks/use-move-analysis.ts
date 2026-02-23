import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { INITIAL_FEN } from '@/hooks/supabase/use-game-replay';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MoveClassification =
  | 'brilliant'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder';

export interface MoveAnalysis {
  moveIndex: number;       // 0-based index in the moves array
  scoreBefore: number;     // centipawns before the move (side to move)
  scoreAfter: number;      // centipawns after the move (same player's perspective)
  delta: number;           // scoreAfter - scoreBefore (negative = bad)
  bestMove: string | null; // best UCI move before this move was played
  mate: number | null;     // forced mate if any
  classification: MoveClassification;
}

export interface PlayerAccuracy {
  totalMoves: number;
  brilliant: number;
  excellent: number;
  good: number;
  inaccuracy: number;
  mistake: number;
  blunder: number;
  /** Accuracy percentage (0–100). Based on centipawn loss per move. */
  accuracy: number;
}

export interface GameAnalysis {
  moves: MoveAnalysis[];
  white: PlayerAccuracy;
  black: PlayerAccuracy;
  /** Final evaluation score (from white's perspective in centipawns). */
  finalScore: number;
}

// ─── Helpers de classificação ─────────────────────────────────────────────────

export const CLASSIFICATION_CONFIG: Record<MoveClassification, {
  label: string;
  shortLabel: string;
  symbol: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  brilliant: {
    label: 'Brilhante',
    shortLabel: 'Brilhante',
    symbol: '!!',
    color: '#00b5ff',
    bgColor: '#00b5ff22',
    description: 'Lance genial — melhor jogada possível',
  },
  excellent: {
    label: 'Excelente',
    shortLabel: 'Excelente',
    symbol: '!',
    color: '#22c55e',
    bgColor: '#22c55e22',
    description: 'Melhor ou quase o melhor lance',
  },
  good: {
    label: 'Bom',
    shortLabel: 'Bom',
    symbol: '',
    color: '#9a9a9a',
    bgColor: '#9a9a9a11',
    description: 'Lance sólido e correto',
  },
  inaccuracy: {
    label: 'Imprecisão',
    shortLabel: 'Imprecisão',
    symbol: '?!',
    color: '#f59e0b',
    bgColor: '#f59e0b22',
    description: 'Leve erro — havia uma jogada melhor',
  },
  mistake: {
    label: 'Erro',
    shortLabel: 'Erro',
    symbol: '?',
    color: '#f97316',
    bgColor: '#f9731622',
    description: 'Erro claro que piora a posição',
  },
  blunder: {
    label: 'Blunder',
    shortLabel: 'Blunder',
    symbol: '??',
    color: '#ef4444',
    bgColor: '#ef444422',
    description: 'Erro grave — perde material ou posição decisiva',
  },
};

/**
 * Compute accuracy percentage from centipawn loss.
 * Uses the formula: accuracy = 103.1668 * exp(-0.04354 * avgCpLoss) - 3.1669
 * (similar to Chess.com's formula)
 */
function computeAccuracy(totalCpLoss: number, moveCount: number): number {
  if (moveCount === 0) return 100;
  const avgLoss = Math.max(0, totalCpLoss / moveCount);
  const accuracy = 103.1668 * Math.exp(-0.04354 * avgLoss) - 3.1669;
  return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10));
}

function buildPlayerAccuracy(
  moves: MoveAnalysis[],
  playerMoveIndices: number[],
): PlayerAccuracy {
  const playerMoves = playerMoveIndices.map((i) => moves[i]).filter(Boolean);
  const counts = {
    brilliant: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0,
  };
  let totalCpLoss = 0;

  for (const m of playerMoves) {
    counts[m.classification]++;
    const loss = Math.max(0, -m.delta); // positive = centipawn loss
    totalCpLoss += Math.min(loss, 500); // cap at 500 to avoid outliers
  }

  return {
    totalMoves: playerMoves.length,
    ...counts,
    accuracy: computeAccuracy(totalCpLoss, playerMoves.length),
  };
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useMoveAnalysis(
  fens: string[],           // fens[0] = initial, fens[i] = after move i-1
  enabled: boolean = true,
) {
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const analyzeGameMutation = trpc.chess.analyzeGame.useMutation();

  const analyze = useCallback(async () => {
    if (!enabled || fens.length < 2) return;

    abortRef.current = false;
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Use the full FEN array (initial + after each move)
      const allFens = fens.length > 0 ? fens : [INITIAL_FEN];

      // Limit to 150 positions max to avoid very long analysis
      const fenSlice = allFens.slice(0, 151);

      const result = await analyzeGameMutation.mutateAsync({
        fens: fenSlice,
        depth: 10,
      });

      if (abortRef.current) return;

      setProgress(1);

      const moves = result.moves as MoveAnalysis[];
      const totalMoves = moves.length;

      // White plays on even indices (0, 2, 4...), black on odd (1, 3, 5...)
      const whiteIndices = moves.map((_, i) => i).filter((i) => i % 2 === 0);
      const blackIndices = moves.map((_, i) => i).filter((i) => i % 2 === 1);

      const white = buildPlayerAccuracy(moves, whiteIndices);
      const black = buildPlayerAccuracy(moves, blackIndices);

      // Final score: last scoreAfter, from white's perspective
      const lastMove = moves[totalMoves - 1];
      // If last move was black's (odd index), negate
      const finalScore = lastMove
        ? totalMoves % 2 === 0
          ? lastMove.scoreAfter
          : -lastMove.scoreAfter
        : 0;

      setAnalysis({ moves, white, black, finalScore });
    } catch (err: any) {
      if (!abortRef.current) {
        setError(err?.message ?? 'Erro ao analisar partida');
      }
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, [fens, enabled]);

  useEffect(() => {
    if (enabled && fens.length >= 2) {
      analyze();
    }
    return () => {
      abortRef.current = true;
    };
  }, [fens.length, enabled]);

  return {
    analysis,
    loading,
    progress,
    error,
    retry: analyze,
    getMove: (index: number): MoveAnalysis | null => analysis?.moves[index] ?? null,
    getClassification: (index: number) => {
      const m = analysis?.moves[index];
      return m ? CLASSIFICATION_CONFIG[m.classification] : null;
    },
  };
}
