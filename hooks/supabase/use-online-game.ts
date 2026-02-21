import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/lib/auth-context';

export function useOnlineGame(gameId: string | null) {
  const { profile } = useSupabaseAuth();
  const [game, setGame] = useState<any>(null);
  const [chess] = useState(() => new Chess());
  const [myColor, setMyColor] = useState<'white' | 'black' | null>(null);
  const [opponent, setOpponent] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ white: 0, black: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moves, setMoves] = useState<any[]>([]);
  const [drawOffer, setDrawOffer] = useState<string | null>(null);
  const [rematchOffer, setRematchOffer] = useState<string | null>(null);
  const [rematchGameId, setRematchGameId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMoveTimeRef = useRef<number>(Date.now());

  // Load game
  useEffect(() => {
    if (!gameId) return;

    const loadGame = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('games')
          .select(`
            *,
            white_player:white_player_id(id, user_id, username, display_name, avatar_url, rating_blitz, rating_rapid, rating_classical),
            black_player:black_player_id(id, user_id, username, display_name, avatar_url, rating_blitz, rating_rapid, rating_classical)
          `)
          .eq('id', gameId)
          .single();

        if (fetchError) throw fetchError;
        setGame(data);
        chess.load(data.fen);
        setTimeLeft({ white: data.white_time_left, black: data.black_time_left });
        lastMoveTimeRef.current = data.last_move_at ? new Date(data.last_move_at).getTime() : Date.now();

        if (profile) {
          if (data.white_player_id === profile.id) {
            setMyColor('white');
            setOpponent(data.black_player);
          } else if (data.black_player_id === profile.id) {
            setMyColor('black');
            setOpponent(data.white_player);
          }
        }

        const { data: movesData } = await supabase
          .from('game_moves')
          .select('*')
          .eq('game_id', gameId)
          .order('move_number', { ascending: true });

        if (movesData) setMoves(movesData);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId, profile, chess]);

  // Subscribe to game changes
  useEffect(() => {
    if (!gameId) return;

    const subscription = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          const updatedGame = payload.new as any;
          setGame(updatedGame);
          chess.load(updatedGame.fen);
          setTimeLeft({ white: updatedGame.white_time_left, black: updatedGame.black_time_left });
          setDrawOffer(updatedGame.draw_offer_from);
          setRematchOffer(updatedGame.rematch_offer_from);
          if (updatedGame.rematch_game_id) setRematchGameId(updatedGame.rematch_game_id);
          if (updatedGame.last_chat) setChatMessage(updatedGame.last_chat);
          lastMoveTimeRef.current = updatedGame.last_move_at ? new Date(updatedGame.last_move_at).getTime() : Date.now();
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_moves', filter: `game_id=eq.${gameId}` },
        (payload) => {
          setMoves(prev => [...prev, payload.new]);
        })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [gameId, chess]);

  // Timer
  useEffect(() => {
    if (!game || game.status !== 'active') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastMoveTimeRef.current;
      setTimeLeft(prev => {
        const currentTurn = game.current_turn;
        if (currentTurn === 'white') {
          return { ...prev, white: Math.max(0, game.white_time_left - elapsed) };
        } else {
          return { ...prev, black: Math.max(0, game.black_time_left - elapsed) };
        }
      });
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [game]);

  const makeMove = useCallback(async (from: string, to: string, promotion?: string) => {
    if (!game || !profile || !myColor) return false;
    if (game.current_turn !== myColor || game.status !== 'active') return false;

    try {
      const move = chess.move({ from, to, promotion: promotion || 'q' });
      if (!move) return false;

      const newFen = chess.fen();
      const nextTurn = myColor === 'white' ? 'black' : 'white';
      const now = Date.now();
      const increment = (game.increment || 0) * 1000;
      const timeUsed = now - lastMoveTimeRef.current;
      const newTimeLeft = myColor === 'white'
        ? Math.max(0, game.white_time_left - timeUsed + increment)
        : Math.max(0, game.black_time_left - timeUsed + increment);

      // Check game end
      let status = 'active';
      let result = null;
      let resultReason = null;
      let winnerId = null;

      if (chess.isCheckmate()) {
        status = 'completed';
        result = myColor === 'white' ? '1-0' : '0-1';
        resultReason = 'checkmate';
        winnerId = profile.id;
      } else if (chess.isDraw()) {
        status = 'completed';
        result = '1/2-1/2';
        resultReason = chess.isStalemate() ? 'stalemate' : 'draw';
      }

      const updates: any = {
        fen: newFen,
        current_turn: nextTurn,
        last_move_at: new Date().toISOString(),
        draw_offer_from: null,
      };

      if (myColor === 'white') updates.white_time_left = newTimeLeft;
      else updates.black_time_left = newTimeLeft;

      if (status === 'completed') {
        updates.status = status;
        updates.result = result;
        updates.result_reason = resultReason;
        updates.winner_id = winnerId;
        updates.ended_at = new Date().toISOString();
      }

      await supabase.from('games').update(updates).eq('id', game.id);
      await supabase.from('game_moves').insert({
        game_id: game.id,
        move_number: chess.history().length,
        player_id: profile.id,
        from_square: from,
        to_square: to,
        san: move.san,
        fen_after: newFen,
        time_left: newTimeLeft,
      });

      return true;
    } catch (err) {
      console.error('Error making move:', err);
      return false;
    }
  }, [game, profile, myColor, chess]);

  const resign = useCallback(async () => {
    if (!game || !profile || game.status !== 'active') return;
    const result = myColor === 'white' ? '0-1' : '1-0';
    const opponentId = myColor === 'white' ? game.black_player_id : game.white_player_id;
    await supabase.from('games').update({
      status: 'completed',
      result,
      result_reason: 'resignation',
      winner_id: opponentId,
      ended_at: new Date().toISOString(),
    }).eq('id', game.id);
  }, [game, profile, myColor]);

  const offerDraw = useCallback(async () => {
    if (!game || !profile || game.status !== 'active') return;
    await supabase.from('games').update({ draw_offer_from: profile.id }).eq('id', game.id);
  }, [game, profile]);

  const acceptDraw = useCallback(async () => {
    if (!game || game.status !== 'active') return;
    await supabase.from('games').update({
      status: 'completed',
      result: '1/2-1/2',
      result_reason: 'agreement',
      draw_offer_from: null,
      ended_at: new Date().toISOString(),
    }).eq('id', game.id);
  }, [game]);

  const declineDraw = useCallback(async () => {
    if (!game) return;
    await supabase.from('games').update({ draw_offer_from: null }).eq('id', game.id);
  }, [game]);

  const cancelDraw = useCallback(async () => {
    if (!game) return;
    await supabase.from('games').update({ draw_offer_from: null }).eq('id', game.id);
  }, [game]);

  const offerRematch = useCallback(async () => {
    if (!game || !profile || game.status !== 'completed') return;
    await supabase.from('games').update({ rematch_offer_from: profile.id }).eq('id', game.id);
  }, [game, profile]);

  const acceptRematch = useCallback(async () => {
    if (!game || !profile || game.status !== 'completed') return;
    const newWhiteId = game.black_player_id;
    const newBlackId = game.white_player_id;
    const { data: newGame } = await supabase.from('games').insert({
      white_player_id: newWhiteId,
      black_player_id: newBlackId,
      status: 'active',
      time_control: game.time_control,
      initial_time: game.initial_time,
      increment: game.increment,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      current_turn: 'white',
      white_time_left: game.initial_time * 1000,
      black_time_left: game.initial_time * 1000,
      started_at: new Date().toISOString(),
      original_game_id: game.id,
    }).select().single();

    if (newGame) {
      await supabase.from('games').update({
        rematch_offer_from: null,
        rematch_game_id: newGame.id,
      }).eq('id', game.id);
      setRematchGameId(newGame.id);
    }
  }, [game, profile]);

  const declineRematch = useCallback(async () => {
    if (!game) return;
    await supabase.from('games').update({ rematch_offer_from: null }).eq('id', game.id);
    setRematchOffer(null);
  }, [game]);

  const cancelRematch = useCallback(async () => {
    if (!game) return;
    await supabase.from('games').update({ rematch_offer_from: null }).eq('id', game.id);
    setRematchOffer(null);
  }, [game]);

  const sendChatMessage = useCallback(async (messageKey: string) => {
    if (!game || !profile) return;
    await supabase.from('games').update({
      last_chat: { sender_id: profile.id, message_key: messageKey, sent_at: new Date().toISOString() },
    }).eq('id', game.id);
  }, [game, profile]);

  return {
    game, chess, myColor, opponent, timeLeft, loading, error, moves,
    drawOffer, rematchOffer, rematchGameId, chatMessage,
    makeMove, resign, offerDraw, acceptDraw, declineDraw, cancelDraw,
    offerRematch, acceptRematch, declineRematch, cancelRematch, sendChatMessage,
    isMyTurn: game?.current_turn === myColor && game?.status === 'active',
    isGameOver: game?.status === 'completed',
  };
}
