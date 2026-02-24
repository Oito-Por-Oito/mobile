import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface RushPuzzle {
  id: string;
  fen: string;
  solution_uci: string[];
  solution_san: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  rating: number;
  themes: string[];
  title: string;
}

export interface RushSession {
  id: string;
  mode: '3min' | '5min' | 'survival';
  score: number;
  errors: number;
  time_spent_s: number;
  highest_rating: number;
  completed: boolean;
}

export interface RushLeaderEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  best_score: number;
  best_time_s: number;
  total_sessions: number;
  achieved_at: string;
}

export interface RushPersonalBest {
  best_score: number;
  best_time_s: number;
  total_sessions: number;
  last_played: string | null;
}

export type RushMode = '3min' | '5min' | 'survival';
export type LeaderPeriod = 'today' | 'week' | 'month' | 'all';

export function usePuzzleRush() {
  const [puzzles, setPuzzles] = useState<RushPuzzle[]>([]);
  const [session, setSession] = useState<RushSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<RushLeaderEntry[]>([]);
  const [personalBest, setPersonalBest] = useState<RushPersonalBest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  /** Buscar puzzles adaptativos para uma sessão de Rush */
  const loadPuzzles = useCallback(async (
    userRating: number = 1200,
    mode: RushMode = '5min',
    count: number = 50
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.rpc('get_rush_puzzles', {
        p_user_rating: userRating,
        p_count: count,
        p_mode: mode,
      });
      if (err) throw err;
      setPuzzles((data as RushPuzzle[]) ?? []);
      return (data as RushPuzzle[]) ?? [];
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /** Iniciar uma nova sessão de Rush no banco */
  const startSession = useCallback(async (
    userId: string,
    mode: RushMode
  ): Promise<string | null> => {
    try {
      const { data, error: err } = await supabase
        .from('puzzle_rush_sessions')
        .insert({ user_id: userId, mode, score: 0, errors: 0, completed: false })
        .select('id')
        .single();
      if (err) throw err;
      sessionIdRef.current = data.id;
      setSession({ id: data.id, mode, score: 0, errors: 0, time_spent_s: 0, highest_rating: 0, completed: false });
      return data.id;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  /** Finalizar a sessão com os dados completos */
  const finishSession = useCallback(async (params: {
    sessionId: string;
    score: number;
    errors: number;
    timeSpentS: number;
    highestRating: number;
    avgTimePer: number;
  }) => {
    try {
      const { error: err } = await supabase
        .from('puzzle_rush_sessions')
        .update({
          score: params.score,
          errors: params.errors,
          time_spent_s: params.timeSpentS,
          highest_rating: params.highestRating,
          avg_time_per_puzzle: params.avgTimePer,
          completed: true,
        })
        .eq('id', params.sessionId);
      if (err) throw err;
      setSession(prev => prev ? { ...prev, score: params.score, errors: params.errors, completed: true } : null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  /** Buscar recorde pessoal do usuário */
  const loadPersonalBest = useCallback(async (
    userId: string,
    mode: RushMode = '5min'
  ) => {
    try {
      const { data, error: err } = await supabase.rpc('get_my_rush_best', {
        p_user_id: userId,
        p_mode: mode,
      });
      if (err) throw err;
      const row = Array.isArray(data) ? data[0] : data;
      setPersonalBest(row ?? { best_score: 0, best_time_s: 0, total_sessions: 0, last_played: null });
      return row;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, []);

  /** Buscar leaderboard por modo e período */
  const loadLeaderboard = useCallback(async (
    mode: RushMode = '5min',
    period: LeaderPeriod = 'all',
    limit: number = 20
  ) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('get_rush_leaderboard', {
        p_mode: mode,
        p_limit: limit,
        p_period: period,
      });
      if (err) throw err;
      setLeaderboard((data as RushLeaderEntry[]) ?? []);
      return (data as RushLeaderEntry[]) ?? [];
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    puzzles,
    session,
    leaderboard,
    personalBest,
    loading,
    error,
    loadPuzzles,
    startSession,
    finishSession,
    loadPersonalBest,
    loadLeaderboard,
  };
}
