import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/lib/auth-context';

const HEARTBEAT_INTERVAL = 30000;

export function useMatchmaking() {
  const { profile } = useSupabaseAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedGame, setMatchedGame] = useState<{ id: string } | null>(null);
  const [queueEntry, setQueueEntry] = useState<any>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueEntryRef = useRef<any>(null);

  useEffect(() => { queueEntryRef.current = queueEntry; }, [queueEntry]);

  const updateHeartbeat = useCallback(async () => {
    if (!queueEntryRef.current?.id) return;
    await supabase
      .from('matchmaking_queue')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('id', queueEntryRef.current.id);
  }, []);

  useEffect(() => {
    if (!queueEntry) {
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
      return;
    }
    updateHeartbeat();
    heartbeatRef.current = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [queueEntry, updateHeartbeat]);

  const getRatingForTimeControl = (timeControl: string) => {
    if (!profile) return 800;
    if (timeControl === 'blitz') return profile.rating_blitz || 800;
    if (timeControl === 'rapid') return profile.rating_rapid || 800;
    return profile.rating_classical || 800;
  };

  const joinQueue = useCallback(async (timeControl: string, initialTime: number, increment: number = 0) => {
    if (!profile) { setError('Você precisa estar logado para jogar online.'); return; }
    setError(null);
    setIsSearching(true);

    try {
      // Remove existing entry
      await supabase.from('matchmaking_queue').delete().eq('player_id', profile.id);

      const rating = getRatingForTimeControl(timeControl);
      const { data: entry, error: insertError } = await supabase
        .from('matchmaking_queue')
        .insert({
          player_id: profile.id,
          time_control: timeControl,
          initial_time: initialTime,
          increment,
          rating,
          rating_range: 200,
          last_heartbeat: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setQueueEntry(entry);

      // Try to find a match
      await tryMatchmaking(entry, timeControl, initialTime, increment, rating);
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar na fila.');
      setIsSearching(false);
    }
  }, [profile]);

  const tryMatchmaking = async (myEntry: any, timeControl: string, initialTime: number, increment: number, rating: number) => {
    const staleThreshold = new Date(Date.now() - 60000).toISOString();

    const { data: opponents } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('time_control', timeControl)
      .eq('initial_time', initialTime)
      .neq('player_id', profile!.id)
      .gte('last_heartbeat', staleThreshold)
      .gte('rating', rating - 300)
      .lte('rating', rating + 300)
      .order('created_at', { ascending: true })
      .limit(1);

    if (opponents && opponents.length > 0) {
      const opponent = opponents[0];
      // Create game
      const isWhite = Math.random() > 0.5;
      const whiteId = isWhite ? profile!.id : opponent.player_id;
      const blackId = isWhite ? opponent.player_id : profile!.id;

      const { data: newGame, error: gameError } = await supabase
        .from('games')
        .insert({
          white_player_id: whiteId,
          black_player_id: blackId,
          status: 'active',
          time_control: timeControl,
          initial_time: initialTime,
          increment,
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          current_turn: 'white',
          white_time_left: initialTime * 1000,
          black_time_left: initialTime * 1000,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!gameError && newGame) {
        // Remove both from queue
        await supabase.from('matchmaking_queue').delete().in('player_id', [profile!.id, opponent.player_id]);
        setMatchedGame({ id: newGame.id });
        setIsSearching(false);
        setQueueEntry(null);
        return;
      }
    }

    // Subscribe to queue changes to detect when matched
    const subscription = supabase
      .channel(`queue:${profile!.id}`)
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'matchmaking_queue',
        filter: `player_id=eq.${profile!.id}`,
      }, async () => {
        // Check if a game was created for us
        const { data: games } = await supabase
          .from('games')
          .select('id')
          .or(`white_player_id.eq.${profile!.id},black_player_id.eq.${profile!.id}`)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (games && games.length > 0) {
          setMatchedGame({ id: games[0].id });
          setIsSearching(false);
          setQueueEntry(null);
          supabase.removeChannel(subscription);
        }
      })
      .subscribe();
  };

  const leaveQueue = useCallback(async () => {
    if (profile) {
      await supabase.from('matchmaking_queue').delete().eq('player_id', profile.id);
    }
    setIsSearching(false);
    setQueueEntry(null);
    setError(null);
  }, [profile]);

  const clearMatchedGame = useCallback(() => {
    setMatchedGame(null);
  }, []);

  return {
    isSearching, error, matchedGame,
    joinQueue, leaveQueue, clearMatchedGame, setMatchedGame,
  };
}
