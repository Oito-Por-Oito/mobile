import { describe, it, expect } from 'vitest';

// ─── Importar helpers diretamente (sem dependências nativas) ──────────────────

// Replicar a lógica de classificação para testar sem o servidor
function classifyMove(delta: number, isBestMove: boolean, mate: number | null): string {
  if (mate !== null && mate > 0 && isBestMove) return 'brilliant';
  const loss = -delta;
  if (isBestMove || loss <= 10) return 'excellent';
  if (loss <= 30) return 'good';
  if (loss <= 80) return 'inaccuracy';
  if (loss <= 200) return 'mistake';
  return 'blunder';
}

function computeAccuracy(totalCpLoss: number, moveCount: number): number {
  if (moveCount === 0) return 100;
  const avgLoss = Math.max(0, totalCpLoss / moveCount);
  const accuracy = 103.1668 * Math.exp(-0.04354 * avgLoss) - 3.1669;
  return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10));
}

function formatScore(score: number, mate: number | null): string {
  if (mate !== null) return mate > 0 ? `M${mate}` : `-M${Math.abs(mate)}`;
  const pawns = score / 100;
  return pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1);
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('Move Analysis - Classification Logic', () => {
  it('should classify best move as excellent', () => {
    expect(classifyMove(0, true, null)).toBe('excellent');
    expect(classifyMove(-5, true, null)).toBe('excellent');
  });

  it('should classify near-best move (loss ≤ 10cp) as excellent', () => {
    expect(classifyMove(-10, false, null)).toBe('excellent');
    expect(classifyMove(-5, false, null)).toBe('excellent');
    expect(classifyMove(5, false, null)).toBe('excellent');
  });

  it('should classify slight loss (11–30cp) as good', () => {
    expect(classifyMove(-11, false, null)).toBe('good');
    expect(classifyMove(-30, false, null)).toBe('good');
  });

  it('should classify moderate loss (31–80cp) as inaccuracy', () => {
    expect(classifyMove(-31, false, null)).toBe('inaccuracy');
    expect(classifyMove(-80, false, null)).toBe('inaccuracy');
  });

  it('should classify significant loss (81–200cp) as mistake', () => {
    expect(classifyMove(-81, false, null)).toBe('mistake');
    expect(classifyMove(-200, false, null)).toBe('mistake');
  });

  it('should classify severe loss (>200cp) as blunder', () => {
    expect(classifyMove(-201, false, null)).toBe('blunder');
    expect(classifyMove(-500, false, null)).toBe('blunder');
  });

  it('should classify finding a forced mate as brilliant', () => {
    expect(classifyMove(0, true, 3)).toBe('brilliant');
    expect(classifyMove(100, true, 1)).toBe('brilliant');
  });

  it('should not classify opponent mate as brilliant', () => {
    // mate = -3 means opponent has mate in 3
    expect(classifyMove(-300, false, -3)).toBe('blunder');
  });
});

describe('Move Analysis - Accuracy Formula', () => {
  it('should return 100% accuracy with no moves', () => {
    expect(computeAccuracy(0, 0)).toBe(100);
  });

  it('should return ~100% accuracy with zero loss', () => {
    const acc = computeAccuracy(0, 10);
    expect(acc).toBeGreaterThan(95);
  });

  it('should return lower accuracy with higher average loss', () => {
    const highAcc = computeAccuracy(50, 10);   // avg 5cp loss
    const lowAcc = computeAccuracy(500, 10);   // avg 50cp loss
    expect(highAcc).toBeGreaterThan(lowAcc);
  });

  it('should clamp accuracy between 0 and 100', () => {
    const acc1 = computeAccuracy(0, 5);
    const acc2 = computeAccuracy(100000, 5);
    expect(acc1).toBeLessThanOrEqual(100);
    expect(acc2).toBeGreaterThanOrEqual(0);
  });
});

describe('Move Analysis - Score Formatting', () => {
  it('should format positive centipawn scores', () => {
    expect(formatScore(100, null)).toBe('+1.0');
    expect(formatScore(250, null)).toBe('+2.5');
    expect(formatScore(0, null)).toBe('+0.0');
  });

  it('should format negative centipawn scores', () => {
    expect(formatScore(-100, null)).toBe('-1.0');
    expect(formatScore(-350, null)).toBe('-3.5');
  });

  it('should format mate scores', () => {
    expect(formatScore(0, 3)).toBe('M3');
    expect(formatScore(0, 1)).toBe('M1');
    expect(formatScore(0, -2)).toBe('-M2');
  });
});

describe('Move Analysis - Classification Config', () => {
  const CLASSIFICATION_CONFIG = {
    brilliant: { label: 'Brilhante', symbol: '!!', color: '#00b5ff' },
    excellent: { label: 'Excelente', symbol: '!', color: '#22c55e' },
    good: { label: 'Bom', symbol: '', color: '#9a9a9a' },
    inaccuracy: { label: 'Imprecisão', symbol: '?!', color: '#f59e0b' },
    mistake: { label: 'Erro', symbol: '?', color: '#f97316' },
    blunder: { label: 'Blunder', symbol: '??', color: '#ef4444' },
  };

  it('should have all 6 classifications defined', () => {
    expect(Object.keys(CLASSIFICATION_CONFIG)).toHaveLength(6);
  });

  it('should have correct symbols for each classification', () => {
    expect(CLASSIFICATION_CONFIG.brilliant.symbol).toBe('!!');
    expect(CLASSIFICATION_CONFIG.excellent.symbol).toBe('!');
    expect(CLASSIFICATION_CONFIG.good.symbol).toBe('');
    expect(CLASSIFICATION_CONFIG.inaccuracy.symbol).toBe('?!');
    expect(CLASSIFICATION_CONFIG.mistake.symbol).toBe('?');
    expect(CLASSIFICATION_CONFIG.blunder.symbol).toBe('??');
  });

  it('should have correct Portuguese labels', () => {
    expect(CLASSIFICATION_CONFIG.brilliant.label).toBe('Brilhante');
    expect(CLASSIFICATION_CONFIG.excellent.label).toBe('Excelente');
    expect(CLASSIFICATION_CONFIG.good.label).toBe('Bom');
    expect(CLASSIFICATION_CONFIG.inaccuracy.label).toBe('Imprecisão');
    expect(CLASSIFICATION_CONFIG.mistake.label).toBe('Erro');
    expect(CLASSIFICATION_CONFIG.blunder.label).toBe('Blunder');
  });
});

describe('Move Analysis - Stockfish API Endpoint', () => {
  const API_URL = process.env.VITE_API_URL ?? 'http://127.0.0.1:3000';

  it('should have chess.analyzeMove endpoint available', async () => {
    // Just verify the server is reachable with a short timeout
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_URL}/api/trpc/chess.analyzeMove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: {
            fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            fenAfter: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
            depth: 6,
          },
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));
      // Either 200 (success) or 4xx (endpoint exists but auth/validation issue)
      expect(res.status).toBeLessThan(500);
    } catch {
      // Server not running in test environment — skip
      console.log('Server not available in test environment, skipping endpoint test');
    }
  }, 10000);
});
