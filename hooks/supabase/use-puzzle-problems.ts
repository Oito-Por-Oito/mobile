import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/lib/auth-context';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type PuzzleDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Puzzle {
  id: string;
  title: string;
  description: string | null;
  fen: string;
  solution: string[];       // UCI: ['e2e4', 'd7d5']
  solution_san: string[];   // SAN: ['e4', 'd5']
  difficulty: PuzzleDifficulty;
  rating: number;
  theme: string[];
  player_to_move: 'white' | 'black';
  times_played: number;
  times_solved: number;
  user_solved?: boolean;
  user_attempts?: number;
}

export interface PuzzleStats {
  total_attempted: number;
  total_solved: number;
  total_failed: number;
  accuracy_pct: number;
  puzzle_rating: number;
  avg_time_secs: number | null;
}

export interface PuzzleFilters {
  difficulty?: PuzzleDifficulty | null;
  themes?: string[] | null;
  minRating?: number | null;
  maxRating?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export const DIFFICULTY_LABELS: Record<PuzzleDifficulty, string> = {
  easy:   'Fácil',
  medium: 'Médio',
  hard:   'Difícil',
  expert: 'Expert',
};

export const DIFFICULTY_COLORS: Record<PuzzleDifficulty, string> = {
  easy:   '#22c55e',
  medium: '#f59e0b',
  hard:   '#ef4444',
  expert: '#a855f7',
};

export const THEME_LABELS: Record<string, string> = {
  'mate':              'Mate',
  'mate-in-1':         'Mate em 1',
  'mate-in-2':         'Mate em 2',
  'mate-in-3':         'Mate em 3',
  'fork':              'Garfo',
  'pin':               'Cravada',
  'skewer':            'Espeto',
  'discovered-attack': 'Ataque à Descoberta',
  'double-check':      'Duplo Xeque',
  'sacrifice':         'Sacrifício',
  'promotion':         'Promoção',
  'endgame':           'Final',
  'back-rank':         'Última Fileira',
  'x-ray':             'Raio-X',
  'combination':       'Combinação',
  'tactics':           'Tática',
  'material-gain':     'Ganho de Material',
  'attack':            'Ataque',
  'defense':           'Defesa',
  'zugzwang':          'Zugzwang',
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook: usePuzzleProblems
// ─────────────────────────────────────────────────────────────────────────────
export function usePuzzleProblems() {
  const { user } = useSupabaseAuth();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [stats, setStats] = useState<PuzzleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PuzzleFilters>({});
  const pageRef = useRef(0);

  // ── Fetch puzzles list ──────────────────────────────────────────────────
  const fetchPuzzles = useCallback(
    async (page: number, currentFilters: PuzzleFilters, isRefresh = false) => {
      try {
        if (page === 0) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        const { data, error: rpcErr } = await supabase.rpc('get_puzzles_list', {
          p_user_id:    user?.id ?? null,
          p_difficulty: currentFilters.difficulty ?? null,
          p_themes:     currentFilters.themes?.length ? currentFilters.themes : null,
          p_min_rating: currentFilters.minRating ?? null,
          p_max_rating: currentFilters.maxRating ?? null,
          p_limit:      PAGE_SIZE,
          p_offset:     page * PAGE_SIZE,
        });

        if (rpcErr) throw rpcErr;

        const rows = (data ?? []) as Puzzle[];
        if (page === 0 || isRefresh) {
          setPuzzles(rows);
        } else {
          setPuzzles(prev => [...prev, ...rows]);
        }
        setHasMore(rows.length === PAGE_SIZE);
        pageRef.current = page;
      } catch (err: any) {
        setError(err.message ?? 'Erro ao carregar puzzles.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  // ── Fetch user stats ────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_user_puzzle_stats', {
        p_user_id: user.id,
      });
      if (!rpcErr && data && data.length > 0) {
        setStats(data[0] as PuzzleStats);
      }
    } catch {
      // stats are optional, ignore errors
    }
  }, [user]);

  useEffect(() => {
    fetchPuzzles(0, filters);
    fetchStats();
  }, [fetchPuzzles, fetchStats, filters]);

  // ── Load more ───────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchPuzzles(pageRef.current + 1, filters);
  }, [loadingMore, hasMore, fetchPuzzles, filters]);

  // ── Refresh ─────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    setRefreshing(true);
    pageRef.current = 0;
    fetchPuzzles(0, filters, true);
    fetchStats();
  }, [fetchPuzzles, fetchStats, filters]);

  // ── Apply filters ───────────────────────────────────────────────────────
  const applyFilters = useCallback((newFilters: PuzzleFilters) => {
    setFilters(newFilters);
    pageRef.current = 0;
  }, []);

  // ── Get next unsolved puzzle ────────────────────────────────────────────
  const getNextPuzzle = useCallback(
    async (overrideFilters?: PuzzleFilters): Promise<Puzzle | null> => {
      try {
        const f = overrideFilters ?? filters;
        const { data, error: rpcErr } = await supabase.rpc('get_next_puzzle', {
          p_user_id:    user?.id ?? null,
          p_difficulty: f.difficulty ?? null,
          p_themes:     f.themes?.length ? f.themes : null,
          p_min_rating: f.minRating ?? null,
          p_max_rating: f.maxRating ?? null,
        });
        if (rpcErr) throw rpcErr;
        return data && data.length > 0 ? (data[0] as Puzzle) : null;
      } catch {
        return null;
      }
    },
    [user, filters]
  );

  // ── Record attempt (upsert) ─────────────────────────────────────────────
  const recordAttempt = useCallback(
    async (params: {
      puzzleId: string;
      solved: boolean;
      hintsUsed: number;
      attemptsCount: number;
      timeSpentSecs: number | null;
    }) => {
      if (!user) return;
      const payload = {
        user_id:         user.id,
        puzzle_id:       params.puzzleId,
        solved:          params.solved,
        hints_used:      params.hintsUsed,
        attempts_count:  params.attemptsCount,
        time_spent_secs: params.solved ? params.timeSpentSecs : null,
        completed_at:    params.solved ? new Date().toISOString() : null,
        updated_at:      new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from('puzzle_attempts')
        .upsert(payload, { onConflict: 'user_id,puzzle_id' });

      if (!upsertErr) {
        // Update local state
        setPuzzles(prev =>
          prev.map(p =>
            p.id === params.puzzleId
              ? { ...p, user_solved: params.solved, user_attempts: params.attemptsCount }
              : p
          )
        );
        // Refresh stats
        fetchStats();
      }
    },
    [user, fetchStats]
  );

  return {
    puzzles,
    stats,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    filters,
    applyFilters,
    loadMore,
    refresh,
    getNextPuzzle,
    recordAttempt,
  };
}
