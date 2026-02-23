// Test if Stockfish works via Node.js child_process
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stockfishPath = join(__dirname, '../node_modules/stockfish/bin/stockfish-18-single.js');

const proc = spawn(process.execPath, [stockfishPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let output = '';
proc.stdout.on('data', (d) => { output += d.toString(); });
proc.stderr.on('data', (d) => { process.stderr.write(d); });

proc.stdin.write('uci\n');
proc.stdin.write('isready\n');
proc.stdin.write('position fen rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1\n');
proc.stdin.write('go depth 10\n');

setTimeout(() => {
  proc.stdin.write('quit\n');
  proc.stdin.end();
}, 3000);

proc.on('close', () => {
  const lines = output.split('\n');
  const info = lines.filter(l => l.startsWith('info depth 10'));
  const bestmove = lines.find(l => l.startsWith('bestmove'));
  console.log('info:', info[0] ?? 'none');
  console.log('bestmove:', bestmove ?? 'none');

  // Extract score
  const scoreLine = info[0] ?? '';
  const cpMatch = scoreLine.match(/score cp (-?\d+)/);
  const mateMatch = scoreLine.match(/score mate (-?\d+)/);
  if (cpMatch) console.log('Score (cp):', cpMatch[1]);
  if (mateMatch) console.log('Mate in:', mateMatch[1]);
});
