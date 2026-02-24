import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/lib/auth-context';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyPuzzle {
  puzzle_id: string;
  title: string;
  description: string | null;
  fen: string;
  solution: string[];          // UCI: ['e2e4', 'd7d5']
  solution_san: string[];      // SAN: ['e4', 'd5']
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  rating: number;
  theme: string[];
  player_to_move: 'white' | 'black';
  puzzle_date: string;         // ISO date: '2026-02-23'
}

export interface DailyAttempt {
  id: string;
  solved: boolean;
  failed: boolean;
  hints_used: number;
  attempts_count: number;
  time_spent_secs: number | null;
  completed_at: string | null;
}

export interface WeekDay {
  date: string;   // ISO date
  label: string;  // 'D', 'S', 'T', 'Q', 'Q', 'S', 'S'
  solved: boolean | null;  // null = future/no data
  isToday: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekDays(): WeekDay[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const labels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const days: WeekDay[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    days.push({
      date: d.toISOString().split('T')[0],
      label: labels[i],
      solved: null,
      isToday: i === dayOfWeek,
    });
  }
  return days;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: useDailyPuzzle
// ─────────────────────────────────────────────────────────────────────────────

export function useDailyPuzzle() {
  const { user } = useSupabaseAuth();
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [attempt, setAttempt] = useState<DailyAttempt | null>(null);
  const [streak, setStreak] = useState(0);
  const [weekDays, setWeekDays] = useState<WeekDay[]>(getWeekDays());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // ── Fetch puzzle of the day ──────────────────────────────────────────────
  const fetchDailyPuzzle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = todayISO();

      // Get today's puzzle via the DB function
      const { data: puzzleRows, error: puzzleErr } = await supabase
        .rpc('get_daily_puzzle', { target_date: today });

      if (puzzleErr) throw puzzleErr;
      if (!puzzleRows || puzzleRows.length === 0) {
        setError('Nenhum puzzle disponível para hoje.');
        return;
      }

      const p = puzzleRows[0] as DailyPuzzle;
      setPuzzle(p);
      startTimeRef.current = Date.now();

      // If user is logged in, fetch their attempt and streak
      if (user) {
        const [attemptRes, streakRes, weekRes] = await Promise.all([
          supabase
            .from('daily_puzzle_attempts')
            .select('*')
            .eq('user_id', user.id)
            .eq('puzzle_date', today)
            .maybeSingle(),
          supabase.rpc('get_user_daily_streak', { p_user_id: user.id }),
          supabase
            .from('daily_puzzle_attempts')
            .select('puzzle_date, solved')
            .eq('user_id', user.id)
            .in('puzzle_date', getWeekDays().map(d => d.date)),
        ]);

        if (attemptRes.data) {
          setAttempt(attemptRes.data as DailyAttempt);
        }
        if (streakRes.data !== null) {
          setStreak(streakRes.data as number);
        }
        if (weekRes.data) {
          const solvedMap: Record<string, boolean> = {};
          (weekRes.data as { puzzle_date: string; solved: boolean }[]).forEach(r => {
            solvedMap[r.puzzle_date] = r.solved;
          });
          setWeekDays(prev =>
            prev.map(d => ({
              ...d,
              solved: solvedMap[d.date] !== undefined ? solvedMap[d.date] : null,
            }))
          );
        }
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar puzzle do dia.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDailyPuzzle();
  }, [fetchDailyPuzzle]);

  // ── Record attempt (upsert) ──────────────────────────────────────────────
  const recordAttempt = useCallback(
    async (params: {
      solved: boolean;
      failed: boolean;
      hintsUsed: number;
      attemptsCount: number;
    }) => {
      if (!user || !puzzle) return;

      const today = todayISO();
      const timeSecs = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : null;

      const payload = {
        user_id: user.id,
        puzzle_id: puzzle.puzzle_id,
        puzzle_date: today,
        solved: params.solved,
        failed: params.failed,
        hints_used: params.hintsUsed,
        attempts_count: params.attemptsCount,
        time_spent_secs: params.solved ? timeSecs : null,
        completed_at: params.solved ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error: upsertErr } = await supabase
        .from('daily_puzzle_attempts')
        .upsert(payload, { onConflict: 'user_id,puzzle_date' })
        .select()
        .single();

      if (!upsertErr && data) {
        setAttempt(data as DailyAttempt);

        if (params.solved) {
          // Refresh streak
          const { data: newStreak } = await supabase.rpc('get_user_daily_streak', {
            p_user_id: user.id,
          });
          if (newStreak !== null) setStreak(newStreak as number);

          // Mark today as solved in weekDays
          const today2 = todayISO();
          setWeekDays(prev =>
            prev.map(d => (d.date === today2 ? { ...d, solved: true } : d))
          );
        }
      }
    },
    [user, puzzle]
  );

  return {
    puzzle,
    attempt,
    streak,
    weekDays,
    loading,
    error,
    refresh: fetchDailyPuzzle,
    recordAttempt,
  };
}
