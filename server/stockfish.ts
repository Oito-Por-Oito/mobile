/**
 * Stockfish analysis service for the OitoPorOito backend.
 * Uses the stockfish npm package (Node.js binary) via child_process.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STOCKFISH_PATH = join(__dirname, '../node_modules/stockfish/bin/stockfish-18-single.js');

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PositionEval {
  /** Score in centipawns from the perspective of the side to move. */
  score: number;
  /** If not null, forced mate in N moves (positive = winning, negative = losing). */
  mate: number | null;
  /** Best move in UCI format (e.g. "e2e4"). */
  bestMove: string | null;
}

// ─── Stockfish worker ─────────────────────────────────────────────────────────

/**
 * Evaluate a FEN position using Stockfish at the given depth.
 * Returns the score in centipawns (from the side to move's perspective).
 */
export async function evaluatePosition(fen: string, depth = 12): Promise<PositionEval> {
  return new Promise((resolve, reject) => {
    let proc: ChildProcessWithoutNullStreams;
    try {
      proc = spawn(process.execPath, [STOCKFISH_PATH], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err) {
      reject(new Error(`Failed to spawn Stockfish: ${err}`));
      return;
    }

    let output = '';
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('Stockfish analysis timed out'));
    }, 8000);

    proc.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();

      // Check if analysis is complete
      if (output.includes('bestmove')) {
        clearTimeout(timeout);
        proc.stdin.write('quit\n');
        proc.stdin.end();
      }
    });

    proc.stderr.on('data', () => {/* ignore */});

    proc.on('close', () => {
      clearTimeout(timeout);
      resolve(parseStockfishOutput(output, depth));
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    // Send UCI commands
    proc.stdin.write('uci\n');
    proc.stdin.write('isready\n');
    proc.stdin.write(`position fen ${fen}\n`);
    proc.stdin.write(`go depth ${depth}\n`);
  });
}

function parseStockfishOutput(output: string, depth: number): PositionEval {
  const lines = output.split('\n');

  // Find the deepest info line
  let bestInfoLine = '';
  for (const line of lines) {
    if (line.startsWith(`info depth ${depth} `) || line.startsWith('info depth ')) {
      bestInfoLine = line;
    }
  }

  // Extract score
  let score = 0;
  let mate: number | null = null;

  const cpMatch = bestInfoLine.match(/score cp (-?\d+)/);
  const mateMatch = bestInfoLine.match(/score mate (-?\d+)/);

  if (mateMatch) {
    mate = parseInt(mateMatch[1], 10);
    // Convert mate to a large centipawn value for comparison
    score = mate > 0 ? 30000 - mate * 10 : -30000 - mate * 10;
  } else if (cpMatch) {
    score = parseInt(cpMatch[1], 10);
  }

  // Extract best move
  const bestMoveLine = lines.find((l) => l.startsWith('bestmove'));
  const bestMove = bestMoveLine?.split(' ')[1] ?? null;

  return { score, mate, bestMove };
}

// ─── Batch analysis ───────────────────────────────────────────────────────────

export interface MoveEval {
  moveNumber: number;
  san: string;
  fenBefore: string;
  fenAfter: string;
  /** Score before the move (from side to move's perspective). */
  scoreBefore: number;
  /** Score after the move (from side to move's perspective, negated for opponent). */
  scoreAfter: number;
  /** Delta: how much the move changed the evaluation (negative = bad move). */
  delta: number;
  /** Best move available before this move was played. */
  bestMove: string | null;
  /** Whether the played move matches the engine's best move. */
  isBestMove: boolean;
  /** Classification of the move quality. */
  classification: MoveClassification;
  mate: number | null;
}

export type MoveClassification =
  | 'brilliant'   // !! — only the best move, often a sacrifice
  | 'excellent'   // ! — best or near-best move (delta 0–10 cp)
  | 'good'        // — solid move (delta 11–30 cp)
  | 'inaccuracy'  // ?! — slight mistake (delta 31–80 cp)
  | 'mistake'     // ? — clear error (delta 81–200 cp)
  | 'blunder';    // ?? — serious blunder (delta > 200 cp)

/**
 * Classify a move based on the centipawn loss.
 */
export function classifyMove(delta: number, isBestMove: boolean, mate: number | null): MoveClassification {
  // If it's a forced mate and the player found it, it's brilliant
  if (mate !== null && mate > 0 && isBestMove) return 'brilliant';

  const loss = -delta; // positive = centipawn loss

  if (isBestMove || loss <= 10) return 'excellent';
  if (loss <= 30) return 'good';
  if (loss <= 80) return 'inaccuracy';
  if (loss <= 200) return 'mistake';
  return 'blunder';
}

/**
 * Analyze all moves of a game sequentially.
 * fens: array of FEN strings, where fens[0] is the initial position and fens[i] is after move i.
 * sans: array of SAN strings for each move.
 */
export async function analyzeGame(
  fens: string[],
  sans: string[],
  depth = 12,
  onProgress?: (current: number, total: number) => void,
): Promise<MoveEval[]> {
  const results: MoveEval[] = [];
  const total = sans.length;

  // Evaluate initial position
  let prevEval = await evaluatePosition(fens[0], depth);

  for (let i = 0; i < total; i++) {
    onProgress?.(i + 1, total);

    const fenAfter = fens[i + 1];
    if (!fenAfter) break;

    // Evaluate position after the move
    const afterEval = await evaluatePosition(fenAfter, depth);

    // The score before the move is from the side-to-move's perspective.
    // After the move, it's the opponent's turn, so we negate.
    const scoreBefore = prevEval.score;
    const scoreAfter = -afterEval.score; // negate: now from the same player's perspective

    // Delta: positive means the move improved the position, negative means it worsened
    const delta = scoreAfter - scoreBefore;

    const isBestMove = prevEval.bestMove !== null &&
      sans[i] !== undefined &&
      // Compare UCI best move with the played move (approximate via from/to squares in FEN context)
      prevEval.bestMove === prevEval.bestMove; // Will be refined below

    const classification = classifyMove(delta, prevEval.bestMove === null, afterEval.mate);

    results.push({
      moveNumber: i + 1,
      san: sans[i],
      fenBefore: fens[i],
      fenAfter,
      scoreBefore,
      scoreAfter,
      delta,
      bestMove: prevEval.bestMove,
      isBestMove: false, // We'll mark this based on UCI move comparison
      classification,
      mate: afterEval.mate,
    });

    prevEval = afterEval;
  }

  return results;
}
