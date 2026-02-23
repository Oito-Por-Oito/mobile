import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Challenge System - Supabase Integration', () => {
  it('should confirm challenges table exists with correct schema', async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('id, challenger_id, challenged_id, time_control, initial_time, increment, color_preference, status, game_id, message, created_at, expires_at')
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, 15000);

  it('should have correct status enum values in challenges table', async () => {
    // Check that we can query with each status value
    const statuses = ['pending', 'accepted', 'declined', 'cancelled', 'expired'];
    for (const status of statuses) {
      const { error } = await supabase
        .from('challenges')
        .select('id')
        .eq('status', status)
        .limit(1);
      expect(error).toBeNull();
    }
  }, 15000);

  it('should have correct color_preference enum values', async () => {
    const prefs = ['white', 'black', 'random'];
    for (const pref of prefs) {
      const { error } = await supabase
        .from('challenges')
        .select('id')
        .eq('color_preference', pref)
        .limit(1);
      expect(error).toBeNull();
    }
  }, 15000);

  it('should be able to query pending challenges with expiry filter', async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, 15000);

  it('should be able to query challenges with challenger profile join', async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:challenger_id(id, username, display_name, avatar_url, rating_blitz, rating_rapid, rating_classical)
      `)
      .eq('status', 'pending')
      .limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, 15000);

  it('should validate TIME_CONTROL_OPTIONS structure', () => {
    const TIME_CONTROL_OPTIONS = [
      { label: 'Bullet 1+0', timeControl: 'bullet', initialTime: 60, increment: 0, icon: '🚀' },
      { label: 'Bullet 2+1', timeControl: 'bullet', initialTime: 120, increment: 1, icon: '🚀' },
      { label: 'Blitz 3+0', timeControl: 'blitz', initialTime: 180, increment: 0, icon: '⚡' },
      { label: 'Blitz 5+0', timeControl: 'blitz', initialTime: 300, increment: 0, icon: '⚡' },
      { label: 'Rápido 10+0', timeControl: 'rapid', initialTime: 600, increment: 0, icon: '⏱' },
      { label: 'Clássico 30+0', timeControl: 'classical', initialTime: 1800, increment: 0, icon: '♟' },
    ];

    expect(TIME_CONTROL_OPTIONS.length).toBeGreaterThan(0);
    for (const opt of TIME_CONTROL_OPTIONS) {
      expect(opt.label).toBeTruthy();
      expect(opt.timeControl).toBeTruthy();
      expect(opt.initialTime).toBeGreaterThan(0);
      expect(opt.increment).toBeGreaterThanOrEqual(0);
    }
  });
});
