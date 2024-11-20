import { ScheduledEvent } from '@cloudflare/workers-types';
import type { Env } from '@worker/types/env';
import app from './app';
import { cleanupMatchmakingQueue, dailyMaintenance } from './tasks';

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env) {
    try {
      switch (event.cron) {
        case '*/5 * * * *':
          await cleanupMatchmakingQueue(env);
          break;
        case '0 0 * * *':
          await dailyMaintenance(env);
          break;
      }
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  },
};
