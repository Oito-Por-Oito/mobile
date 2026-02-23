import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { evaluatePosition, classifyMove, type MoveClassification } from "./stockfish.js";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Chess analysis endpoints
  chess: router({
    /**
     * Analyze a single position: returns score (cp), mate, bestMove, and classification
     * for the move that was played.
     */
    analyzeMove: publicProcedure
      .input(
        z.object({
          fenBefore: z.string(),   // FEN before the move
          fenAfter: z.string(),    // FEN after the move
          depth: z.number().min(1).max(18).default(12),
        })
      )
      .mutation(async ({ input }) => {
        const { fenBefore, fenAfter, depth } = input;

        // Evaluate position before and after the move in parallel
        const [beforeEval, afterEval] = await Promise.all([
          evaluatePosition(fenBefore, depth),
          evaluatePosition(fenAfter, depth),
        ]);

        // Score from the moving player's perspective
        const scoreBefore = beforeEval.score;
        const scoreAfter = -afterEval.score; // negate: opponent's turn after the move
        const delta = scoreAfter - scoreBefore;

        const classification: MoveClassification = classifyMove(
          delta,
          false, // isBestMove check is done client-side
          afterEval.mate,
        );

        return {
          scoreBefore,
          scoreAfter,
          delta,
          bestMove: beforeEval.bestMove,
          mate: afterEval.mate,
          classification,
        };
      }),

    /**
     * Analyze a batch of moves for a full game.
     * Returns analysis for each move including classification and delta.
     */
    analyzeGame: publicProcedure
      .input(
        z.object({
          fens: z.array(z.string()).min(2).max(300), // fens[0] = initial, fens[i] = after move i-1
          depth: z.number().min(1).max(15).default(10),
        })
      )
      .mutation(async ({ input }) => {
        const { fens, depth } = input;
        const results = [];

        // Evaluate initial position
        let prevEval = await evaluatePosition(fens[0], depth);

        for (let i = 1; i < fens.length; i++) {
          const afterEval = await evaluatePosition(fens[i], depth);

          const scoreBefore = prevEval.score;
          const scoreAfter = -afterEval.score;
          const delta = scoreAfter - scoreBefore;

          const classification: MoveClassification = classifyMove(
            delta,
            false,
            afterEval.mate,
          );

          results.push({
            moveIndex: i - 1,
            scoreBefore,
            scoreAfter,
            delta,
            bestMove: prevEval.bestMove,
            mate: afterEval.mate,
            classification,
          });

          prevEval = afterEval;
        }

        return { moves: results };
      }),
  }),
});

export type AppRouter = typeof appRouter;
