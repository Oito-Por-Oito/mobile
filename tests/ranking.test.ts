import { describe, it, expect } from 'vitest';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

async function queryProfiles(orderBy: string, limit = 5) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=id,username,display_name,rating_blitz,rating_rapid,rating_classical,total_games,wins&order=${orderBy}.desc&limit=${limit}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  return res;
}

describe('Ranking Screen - Supabase Integration', () => {
  it('should fetch blitz ranking from Supabase', async () => {
    const res = await queryProfiles('rating_blitz');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should fetch rapid ranking from Supabase', async () => {
    const res = await queryProfiles('rating_rapid');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should fetch classical ranking from Supabase', async () => {
    const res = await queryProfiles('rating_classical');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should return profiles with required fields', async () => {
    const res = await queryProfiles('rating_blitz');
    const data = await res.json();
    if (data.length > 0) {
      const player = data[0];
      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('rating_blitz');
      expect(player).toHaveProperty('rating_rapid');
      expect(player).toHaveProperty('rating_classical');
      expect(player).toHaveProperty('total_games');
      expect(player).toHaveProperty('wins');
    }
  });

  it('should support search filter via ilike', async () => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id,username,display_name&or=(username.ilike.%25a%25,display_name.ilike.%25a%25)&limit=5`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should support pagination via range header', async () => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id,rating_blitz&order=rating_blitz.desc&limit=20&offset=0`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    expect(res.status).toBe(200);
  });
});
