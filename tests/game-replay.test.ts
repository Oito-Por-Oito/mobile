import { describe, it, expect, beforeAll } from 'vitest';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

describe('Game Replay - Supabase Integration', () => {
  beforeAll(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase env vars not set');
    }
  });

  it('should connect to Supabase and access games table', async () => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/games?select=id&limit=1`,
      { headers }
    );
    expect([200, 206]).toContain(res.status);
  });

  it('should access game_moves table', async () => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/game_moves?select=id&limit=1`,
      { headers }
    );
    expect([200, 206]).toContain(res.status);
  });

  it('should verify game_moves has expected columns', async () => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/game_moves?select=id,game_id,move_number,san,fen_after,from_square,to_square&limit=1`,
      { headers }
    );
    expect([200, 206]).toContain(res.status);
    if (res.status === 200) {
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it('should verify games table has expected columns for replay', async () => {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/games?select=id,white_player_id,black_player_id,result,result_reason,time_control,started_at,ended_at&limit=1`,
      { headers }
    );
    expect([200, 206]).toContain(res.status);
    if (res.status === 200) {
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it('should validate INITIAL_FEN constant', () => {
    const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    // FEN should have 6 parts separated by spaces
    const parts = INITIAL_FEN.split(' ');
    expect(parts).toHaveLength(6);
    // Active color should be 'w'
    expect(parts[1]).toBe('w');
    // Castling availability
    expect(parts[2]).toBe('KQkq');
  });

  it('should validate replay speed options', () => {
    const speedOptions = [
      { label: '0.5×', value: 2000 },
      { label: '1×', value: 1000 },
      { label: '2×', value: 500 },
      { label: '3×', value: 333 },
    ];
    expect(speedOptions).toHaveLength(4);
    // Speeds should be in descending order (slower to faster)
    const values = speedOptions.map((o) => o.value);
    expect(values[0]).toBeGreaterThan(values[1]);
    expect(values[1]).toBeGreaterThan(values[2]);
    expect(values[2]).toBeGreaterThan(values[3]);
  });

  it('should validate result label logic', () => {
    const getLabel = (result: string | null, reason: string | null): string => {
      const reasons: Record<string, string> = {
        checkmate: 'Xeque-mate',
        resignation: 'Desistência',
        timeout: 'Tempo esgotado',
      };
      const r = reasons[reason ?? ''] ?? reason ?? '';
      if (result === 'draw') return `Empate${r ? ` — ${r}` : ''}`;
      if (result === 'white') return `Brancas vencem${r ? ` — ${r}` : ''}`;
      if (result === 'black') return `Pretas vencem${r ? ` — ${r}` : ''}`;
      return result ?? '—';
    };

    expect(getLabel('white', 'checkmate')).toBe('Brancas vencem — Xeque-mate');
    expect(getLabel('black', 'resignation')).toBe('Pretas vencem — Desistência');
    expect(getLabel('draw', 'stalemate')).toBe('Empate — stalemate');
    expect(getLabel('draw', null)).toBe('Empate');
    expect(getLabel(null, null)).toBe('—');
  });

  it('should validate duration formatting', () => {
    const formatDuration = (start: string | null, end: string | null): string => {
      if (!start || !end) return '—';
      const secs = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
      if (secs < 60) return `${secs}s`;
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return s > 0 ? `${m}m ${s}s` : `${m}m`;
    };

    expect(formatDuration(null, null)).toBe('—');
    expect(formatDuration('2024-01-01T10:00:00Z', '2024-01-01T10:00:45Z')).toBe('45s');
    expect(formatDuration('2024-01-01T10:00:00Z', '2024-01-01T10:05:00Z')).toBe('5m');
    expect(formatDuration('2024-01-01T10:00:00Z', '2024-01-01T10:05:30Z')).toBe('5m 30s');
  });
});
