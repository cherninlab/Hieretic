import { clerkMiddleware } from '@hono/clerk-auth';
import type { Env } from '@worker/types/env';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Import routes
import { adminRouter } from './api/routes/admin';
import { deckRouter } from './api/routes/deck';
import { gameRouter } from './api/routes/game';
import { profileRouter } from './api/routes/profile';

// Update Env type to include Clerk keys
interface EnvWithClerk extends Env {
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
}

// Create Hono app instance with environment bindings
const app = new Hono<{ Bindings: EnvWithClerk }>();

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

// Add Clerk middleware with proper environment access
app.use('/api/*', async (c, next) => {
  const clerk = clerkMiddleware({
    publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
    secretKey: c.env.CLERK_SECRET_KEY,
  });
  return clerk(c, next);
});

// Mount routes
app.route('/api/game', gameRouter);
app.route('/api/profile', profileRouter);
app.route('/api/deck', deckRouter);
app.route('/api/admin', adminRouter);

// Error handling
app.onError((err, c) => {
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

export default app;
