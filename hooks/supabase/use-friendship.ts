import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FriendshipStatus =
  | 'none'        // nenhuma relação
  | 'pending_sent'     // eu enviei, aguardando
  | 'pending_received' // recebi, aguardando minha resposta
  | 'accepted'    // amigos
  | 'declined';   // recusado (pode reenviar)

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface FriendProfile {
  id: string;           // profile.id
  user_id: string;      // auth user_id
  username: string;
  display_name: string;
  avatar_url: string | null;
  rating_blitz: number;
  rating_rapid: number;
  rating_classical: number;
  total_games: number;
  wins: number;
  streak_days: number;
  last_active_at: string | null;
}

export interface FriendEntry {
  friendship: Friendship;
  profile: FriendProfile;
}

// ─── Hook: estado de amizade entre dois usuários ──────────────────────────────

export function useFriendship(targetUserId: string | null) {
  const [status, setStatus] = useState<FriendshipStatus>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obter usuário logado
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMyUserId(data.user?.id ?? null);
    });
  }, []);

  // Carregar estado da amizade
  const loadStatus = useCallback(async () => {
    if (!myUserId || !targetUserId || myUserId === targetUserId) {
      setStatus('none');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchErr } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(requester_id.eq.${myUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${myUserId})`
      )
      .maybeSingle();

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setStatus('none');
      setFriendshipId(null);
    } else {
      setFriendshipId(data.id);
      if (data.status === 'accepted') {
        setStatus('accepted');
      } else if (data.status === 'declined') {
        setStatus('declined');
      } else if (data.requester_id === myUserId) {
        setStatus('pending_sent');
      } else {
        setStatus('pending_received');
      }
    }

    setLoading(false);
  }, [myUserId, targetUserId]);

  useEffect(() => {
    if (myUserId && targetUserId) loadStatus();
  }, [myUserId, targetUserId, loadStatus]);

  // ── Ações ──────────────────────────────────────────────────────────────────

  const sendRequest = useCallback(async () => {
    if (!myUserId || !targetUserId) return;
    setActionLoading(true);
    setError(null);

    const { data, error: insertErr } = await supabase
      .from('friendships')
      .insert({ requester_id: myUserId, addressee_id: targetUserId, status: 'pending' })
      .select()
      .single();

    if (insertErr) {
      setError(insertErr.message);
    } else {
      setFriendshipId(data.id);
      setStatus('pending_sent');
    }
    setActionLoading(false);
  }, [myUserId, targetUserId]);

  const cancelRequest = useCallback(async () => {
    if (!friendshipId) return;
    setActionLoading(true);
    setError(null);

    const { error: deleteErr } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (deleteErr) {
      setError(deleteErr.message);
    } else {
      setFriendshipId(null);
      setStatus('none');
    }
    setActionLoading(false);
  }, [friendshipId]);

  const acceptRequest = useCallback(async () => {
    if (!friendshipId) return;
    setActionLoading(true);
    setError(null);

    const { error: updateErr } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setStatus('accepted');
    }
    setActionLoading(false);
  }, [friendshipId]);

  const declineRequest = useCallback(async () => {
    if (!friendshipId) return;
    setActionLoading(true);
    setError(null);

    const { error: updateErr } = await supabase
      .from('friendships')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setStatus('declined');
    }
    setActionLoading(false);
  }, [friendshipId]);

  const removeFriend = useCallback(async () => {
    if (!friendshipId) return;
    setActionLoading(true);
    setError(null);

    const { error: deleteErr } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (deleteErr) {
      setError(deleteErr.message);
    } else {
      setFriendshipId(null);
      setStatus('none');
    }
    setActionLoading(false);
  }, [friendshipId]);

  return {
    status,
    loading,
    actionLoading,
    error,
    myUserId,
    isOwnProfile: myUserId === targetUserId,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    refresh: loadStatus,
  };
}

// ─── Hook: lista de amigos e solicitações ─────────────────────────────────────

export function useFriends() {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [received, setReceived] = useState<FriendEntry[]>([]);
  const [sent, setSent] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMyUserId(data.user?.id ?? null);
    });
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (!myUserId) return;
    if (!isRefresh) setLoading(true);
    setError(null);

    const { data, error: fetchErr } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${myUserId},addressee_id.eq.${myUserId}`)
      .order('updated_at', { ascending: false });

    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Coletar todos os user_ids dos outros usuários
    const otherIds = (data ?? []).map((f: Friendship) =>
      f.requester_id === myUserId ? f.addressee_id : f.requester_id
    );

    // Buscar perfis dos outros usuários via profiles (usando user_id)
    const { data: profilesData } = otherIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, user_id, username, display_name, avatar_url, rating_blitz, rating_rapid, rating_classical, total_games, wins, streak_days, last_active_at')
          .in('user_id', otherIds)
      : { data: [] };

    const profileMap = new Map<string, FriendProfile>(
      (profilesData ?? []).map((p: FriendProfile) => [p.user_id, p])
    );

    const friendsList: FriendEntry[] = [];
    const receivedList: FriendEntry[] = [];
    const sentList: FriendEntry[] = [];

    for (const f of data ?? []) {
      const otherId = f.requester_id === myUserId ? f.addressee_id : f.requester_id;
      const profile = profileMap.get(otherId);
      if (!profile) continue;

      const entry: FriendEntry = { friendship: f, profile };

      if (f.status === 'accepted') {
        friendsList.push(entry);
      } else if (f.status === 'pending') {
        if (f.addressee_id === myUserId) {
          receivedList.push(entry);
        } else {
          sentList.push(entry);
        }
      }
    }

    setFriends(friendsList);
    setReceived(receivedList);
    setSent(sentList);
    setLoading(false);
    setRefreshing(false);
  }, [myUserId]);

  useEffect(() => {
    if (myUserId) load();
  }, [myUserId, load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
  }, [load]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    await load(true);
  }, [load]);

  const declineRequest = useCallback(async (friendshipId: string) => {
    await supabase
      .from('friendships')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);
    await load(true);
  }, [load]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    await load(true);
  }, [load]);

  const cancelRequest = useCallback(async (friendshipId: string) => {
    await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    await load(true);
  }, [load]);

  return {
    friends,
    received,
    sent,
    loading,
    refreshing,
    error,
    refresh,
    acceptRequest,
    declineRequest,
    removeFriend,
    cancelRequest,
    totalPending: received.length,
  };
}
