import { describe, it, expect } from 'vitest';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

describe('Public Profile - Supabase Integration', () => {
  it('should fetch a profile by user_id', async () => {
    // First get any user_id from profiles
    const listRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=user_id,username&limit=1`,
      { headers }
    );
    expect(listRes.status).toBe(200);
    const players = await listRes.json();

    if (players.length === 0) {
      console.log('No players found, skipping profile fetch test');
      return;
    }

    const userId = players[0].user_id;
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=*`,
      { headers }
    );
    expect(profileRes.status).toBe(200);
    const profile = await profileRes.json();
    expect(profile.length).toBeGreaterThan(0);
    expect(profile[0]).toHaveProperty('id');
    expect(profile[0]).toHaveProperty('rating_blitz');
    expect(profile[0]).toHaveProperty('wins');
    expect(profile[0]).toHaveProperty('losses');
    expect(profile[0]).toHaveProperty('draws');
    expect(profile[0]).toHaveProperty('total_games');
  });

  it('should fetch game history for a player', async () => {
    // Get a profile id
    const listRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`,
      { headers }
    );
    const players = await listRes.json();
    if (players.length === 0) return;

    const profileId = players[0].id;
    const gamesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/games?select=id,time_control,result,result_reason,started_at,ended_at,white_player_id,black_player_id&status=eq.completed&or=(white_player_id.eq.${profileId},black_player_id.eq.${profileId})&order=ended_at.desc&limit=15`,
      { headers }
    );
    expect(gamesRes.status).toBe(200);
    const games = await gamesRes.json();
    expect(Array.isArray(games)).toBe(true);
  });

  it('should return games with required fields', async () => {
    const gamesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/games?select=id,time_control,result,result_reason,started_at,ended_at,white_player_id,black_player_id,status&status=eq.completed&limit=5`,
      { headers }
    );
    expect(gamesRes.status).toBe(200);
    const games = await gamesRes.json();
    if (games.length > 0) {
      const g = games[0];
      expect(g).toHaveProperty('id');
      expect(g).toHaveProperty('time_control');
      expect(g).toHaveProperty('result');
      expect(g).toHaveProperty('result_reason');
      expect(g).toHaveProperty('started_at');
    }
  }, 15000);

  it('should support join with player profiles in games query', async () => {
    const gamesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/games?select=id,result,white_player:white_player_id(id,username,display_name),black_player:black_player_id(id,username,display_name)&status=eq.completed&limit=3`,
      { headers }
    );
    expect(gamesRes.status).toBe(200);
    const games = await gamesRes.json();
    expect(Array.isArray(games)).toBe(true);
  });
});
