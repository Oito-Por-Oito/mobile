import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface PublicProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  puzzles_solved: number;
  accuracy: number;
  rating_blitz: number;
  rating_rapid: number;
  rating_classical: number;
  streak_days: number;
  last_active_at: string | null;
  created_at: string;
}

export interface GameHistoryItem {
  id: string;
  time_control: string;
  result: string;           // '1-0' | '0-1' | '1/2-1/2'
  result_reason: string;    // 'checkmate' | 'resignation' | 'timeout' | 'stalemate' | ...
  started_at: string;
  ended_at: string | null;
  playerColor: 'white' | 'black';
  playerResult: 'win' | 'loss' | 'draw';
  opponent: {
    id: string;
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    rating_blitz: number;
    rating_rapid: number;
    rating_classical: number;
  } | null;
  opponentRating: number;
  durationSeconds: number;
}

const PAGE_SIZE = 15;

function parseGameResult(
  game: any,
  profileId: string
): Pick<GameHistoryItem, 'playerColor' | 'playerResult'> {
  const isWhite = game.white_player_id === profileId;
  const playerColor: 'white' | 'black' = isWhite ? 'white' : 'black';

  let playerResult: 'win' | 'loss' | 'draw';
  if (game.result === '1/2-1/2') {
    playerResult = 'draw';
  } else if (
    (game.result === '1-0' && isWhite) ||
    (game.result === '0-1' && !isWhite)
  ) {
    playerResult = 'win';
  } else {
    playerResult = 'loss';
  }

  return { playerColor, playerResult };
}

function calcDuration(started: string, ended: string | null): number {
  if (!ended) return 0;
  return Math.round(
    (new Date(ended).getTime() - new Date(started).getTime()) / 1000
  );
}

// ─── Hook: perfil público ─────────────────────────────────────────────────────

export function usePublicProfile(userId: string | null) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setProfile(data as PublicProfile | null);
        setLoading(false);
      });
  }, [userId]);

  return { profile, loading, error };
}

// ─── Hook: histórico de partidas ──────────────────────────────────────────────

export function usePlayerGames(profileId: string | null) {
  const [games, setGames] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);

  const fetchGames = useCallback(
    async (page: number, isRefresh = false) => {
      if (!profileId) return;
      try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error: fetchErr } = await supabase
          .from('games')
          .select(`
            id,
            white_player_id,
            black_player_id,
            time_control,
            result,
            result_reason,
            started_at,
            ended_at,
            winner_id,
            white_player:white_player_id(id, user_id, username, display_name, avatar_url, rating_blitz, rating_rapid, rating_classical),
            black_player:black_player_id(id, user_id, username, display_name, avatar_url, rating_blitz, rating_rapid, rating_classical)
          `)
          .eq('status', 'completed')
          .or(`white_player_id.eq.${profileId},black_player_id.eq.${profileId}`)
          .order('ended_at', { ascending: false })
          .range(from, to);

        if (fetchErr) throw fetchErr;

        const mapped: GameHistoryItem[] = (data ?? []).map((g: any) => {
          const { playerColor, playerResult } = parseGameResult(g, profileId);
          const isWhite = playerColor === 'white';
          const opponent = isWhite ? g.black_player : g.white_player;

          // Determine opponent rating based on time_control
          let opponentRating = 800;
          if (opponent) {
            const tc = (g.time_control ?? '').toLowerCase();
            if (tc.includes('blitz') || tc.includes('3') || tc.includes('5')) {
              opponentRating = opponent.rating_blitz;
            } else if (tc.includes('rapid') || tc.includes('10') || tc.includes('15')) {
              opponentRating = opponent.rating_rapid;
            } else {
              opponentRating = opponent.rating_classical;
            }
          }

          return {
            id: g.id,
            time_control: g.time_control ?? 'Desconhecido',
            result: g.result ?? '?',
            result_reason: g.result_reason ?? 'unknown',
            started_at: g.started_at,
            ended_at: g.ended_at,
            playerColor,
            playerResult,
            opponent: opponent ?? null,
            opponentRating,
            durationSeconds: calcDuration(g.started_at, g.ended_at),
          };
        });

        if (isRefresh || page === 0) {
          setGames(mapped);
        } else {
          setGames((prev) => [...prev, ...mapped]);
        }

        setHasMore((data ?? []).length === PAGE_SIZE);
      } catch (err: any) {
        setError(err.message ?? 'Erro ao carregar partidas');
      }
    },
    [profileId]
  );

  // Initial load
  useEffect(() => {
    if (!profileId) return;
    pageRef.current = 0;
    setHasMore(true);
    setError(null);
    setLoading(true);
    fetchGames(0, true).finally(() => setLoading(false));
  }, [profileId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = 0;
    setHasMore(true);
    await fetchGames(0, true);
    setRefreshing(false);
  }, [fetchGames]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = pageRef.current + 1;
    pageRef.current = next;
    await fetchGames(next);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchGames]);

  return { games, loading, refreshing, loadingMore, hasMore, error, refresh, loadMore };
}
