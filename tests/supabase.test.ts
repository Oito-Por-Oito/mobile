import { describe, it, expect } from 'vitest';

describe('Supabase Configuration', () => {
  it('should have EXPO_PUBLIC_SUPABASE_URL set', () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    expect(url).toBeDefined();
    expect(url).not.toBe('');
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co/);
  });

  it('should have EXPO_PUBLIC_SUPABASE_ANON_KEY set', () => {
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe('');
    expect(key!.length).toBeGreaterThan(20);
  });

  it('should be able to connect to Supabase', async () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    const response = await fetch(`${url}/rest/v1/profiles?limit=1`, {
      headers: {
        'apikey': key!,
        'Authorization': `Bearer ${key}`,
      },
    });
    
    // 200 = success, 401 = unauthorized (bad key), 404 = table not found
    expect([200, 401, 404, 406]).toContain(response.status);
    // Should not be a network error (5xx)
    expect(response.status).toBeLessThan(500);
  });
});
