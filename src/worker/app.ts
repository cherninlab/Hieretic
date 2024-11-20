import type { Env } from '@worker/types/env';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Import routes
import { adminRouter } from './api/routes/admin.ts';
import { deckRouter } from './api/routes/deck';
import { gameRouter } from './api/routes/game';
import { profileRouter } from './api/routes/profile';

// Extend Hono's types to include our environment
interface ContextVars {
  userId?: string; // Set by auth middleware
}

// Create Hono app instance with environment bindings and context vars
const app = new Hono<{
  Bindings: Env;
  Variables: ContextVars;
}>();

// Global middleware
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://hieretic.cherninlab.com'],
    credentials: true,
  }),
);
app.use('*', logger());
app.use('*', prettyJSON());

// Mount routes
app.route('/api/game', gameRouter);
app.route('/api/profile', profileRouter);
app.route('/api/deck', deckRouter);
app.route('/api/admin', adminRouter);

// Error handling
app.onError((err: Error, c) => {
  console.error(`[Error] ${err.message}`, err.stack);
  return c.json(
    {
      success: false,
      error: {
        code: err instanceof Error ? err.name : 'UNKNOWN_ERROR',
        message: err.message || 'An unexpected error occurred',
      },
    },
    err instanceof Error ? 400 : 500,
  );
});

// Not found handling
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    },
    404,
  );
});

export default app;
