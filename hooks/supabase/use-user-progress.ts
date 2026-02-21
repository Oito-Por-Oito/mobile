import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/lib/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface UserProgress {
  dailyGoals: {
    puzzles: { current: number; target: number };
    games: { current: number; target: number };
    studyMinutes: { current: number; target: number };
  };
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    puzzlesSolved: number;
    accuracy: number;
  };
  ratingHistory: Array<{
    date: string;
    blitz: number;
    rapid: number;
    classical: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    result: string | null;
    description: string;
    time: string;
  }>;
  streak: number;
  lastSeen: string | null;
}

export function useUserProgress() {
  const { user, profile } = useSupabaseAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      setLoading(true);
      try {
        const [{ data: ratingHistory }, { data: activities }] = await Promise.all([
          supabase
            .from('rating_history')
            .select('*')
            .eq('user_id', profile.id)
            .order('recorded_at', { ascending: true })
            .limit(30),
          supabase
            .from('user_activities')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        setProgress({
          dailyGoals: {
            puzzles: { current: Math.min(profile.puzzles_solved || 0, 10), target: 10 },
            games: { current: Math.min(profile.total_games || 0, 3), target: 3 },
            studyMinutes: { current: 0, target: 30 },
          },
          stats: {
            totalGames: profile.total_games || 0,
            wins: profile.wins || 0,
            losses: profile.losses || 0,
            draws: profile.draws || 0,
            puzzlesSolved: profile.puzzles_solved || 0,
            accuracy: Number(profile.accuracy) || 0,
          },
          ratingHistory: ratingHistory?.map((r: any) => ({
            date: r.recorded_at,
            blitz: r.rating_blitz || 800,
            rapid: r.rating_rapid || 800,
            classical: r.rating_classical || 800,
          })) || [{
            date: new Date().toISOString(),
            blitz: profile.rating_blitz || 800,
            rapid: profile.rating_rapid || 800,
            classical: profile.rating_classical || 800,
          }],
          recentActivity: activities?.map((a: any) => ({
            id: a.id,
            type: a.activity_type,
            result: a.result,
            description: a.description,
            time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR }),
          })) || [],
          streak: profile.streak_days || 0,
          lastSeen: profile.last_active_at,
        });
      } catch (error) {
        console.error('Error fetching user progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user, profile]);

  return { progress, loading };
}
