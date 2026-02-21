import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/lib/auth-context';

export type GameMode = 'blitz' | 'rapid' | 'classical';

export interface RankingPlayer {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  rating: number;
  rating_blitz: number;
  rating_rapid: number;
  rating_classical: number;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  streak_days: number;
  rank: number;
  winRate: number;
}

const PAGE_SIZE = 20;

const RATING_COLUMN: Record<GameMode, string> = {
  blitz: 'rating_blitz',
  rapid: 'rating_rapid',
  classical: 'rating_classical',
};

export function useRanking(mode: GameMode) {
  const { profile } = useSupabaseAuth();
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [myRank, setMyRank] = useState<RankingPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const ratingCol = RATING_COLUMN[mode];

  const fetchPlayers = useCallback(
    async (page: number, search: string, isRefresh = false) => {
      try {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from('profiles')
          .select(
            'id, user_id, username, display_name, avatar_url, rating_blitz, rating_rapid, rating_classical, total_games, wins, losses, draws, streak_days'
          )
          .order(ratingCol, { ascending: false })
          .range(from, to);

        if (search.trim()) {
          query = query.or(
            `username.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`
          );
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        const ranked: RankingPlayer[] = (data ?? []).map((p, idx) => ({
          ...p,
          username: p.username ?? 'Jogador',
          display_name: p.display_name ?? p.username ?? 'Jogador',
          rating:
            mode === 'blitz'
              ? p.rating_blitz
              : mode === 'rapid'
              ? p.rating_rapid
              : p.rating_classical,
          rank: from + idx + 1,
          winRate:
            p.total_games > 0
              ? Math.round((p.wins / p.total_games) * 100)
              : 0,
        }));

        if (isRefresh || page === 0) {
          setPlayers(ranked);
        } else {
          setPlayers((prev) => [...prev, ...ranked]);
        }

        setHasMore((data ?? []).length === PAGE_SIZE);
      } catch (err: any) {
        setError(err.message ?? 'Erro ao carregar ranking');
      }
    },
    [mode, ratingCol]
  );

  const fetchMyRank = useCallback(async () => {
    if (!profile) {
      setMyRank(null);
      return;
    }
    try {
      // Count players with higher rating to determine rank
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt(ratingCol, profile[ratingCol as keyof typeof profile] as number);

      const rank = (count ?? 0) + 1;
      const myRating =
        mode === 'blitz'
          ? profile.rating_blitz
          : mode === 'rapid'
          ? profile.rating_rapid
          : profile.rating_classical;

      setMyRank({
        id: profile.id,
        user_id: profile.user_id,
        username: profile.username ?? 'Você',
        display_name: profile.display_name ?? profile.username ?? 'Você',
        avatar_url: profile.avatar_url,
        rating: myRating,
        rating_blitz: profile.rating_blitz,
        rating_rapid: profile.rating_rapid,
        rating_classical: profile.rating_classical,
        total_games: profile.total_games,
        wins: profile.wins,
        losses: profile.losses,
        draws: profile.draws,
        streak_days: profile.streak_days,
        rank,
        winRate:
          profile.total_games > 0
            ? Math.round((profile.wins / profile.total_games) * 100)
            : 0,
      });
    } catch {
      setMyRank(null);
    }
  }, [profile, mode, ratingCol]);

  // Initial load
  useEffect(() => {
    pageRef.current = 0;
    setHasMore(true);
    setError(null);
    setLoading(true);

    Promise.all([fetchPlayers(0, searchQuery, true), fetchMyRank()]).finally(
      () => setLoading(false)
    );
  }, [mode]);

  // Search
  useEffect(() => {
    const timer = setTimeout(() => {
      pageRef.current = 0;
      setHasMore(true);
      setLoading(true);
      fetchPlayers(0, searchQuery, true).finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = 0;
    setHasMore(true);
    await Promise.all([fetchPlayers(0, searchQuery, true), fetchMyRank()]);
    setRefreshing(false);
  }, [fetchPlayers, fetchMyRank, searchQuery]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    await fetchPlayers(nextPage, searchQuery);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchPlayers, searchQuery]);

  return {
    players,
    myRank,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    error,
    refresh,
    loadMore,
  };
}
