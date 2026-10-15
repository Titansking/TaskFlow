/**
 * Builds the Express app.
 *
 * This file never opens a port — `server.ts` does that — so tests can import
 * the app without starting anything.
 *
 * Read it top to bottom and you see the whole request lifecycle:
 *   security -> parsing -> rate limit -> routes -> 404 -> error handler
 */
import cors from 'cors';
import express, { type Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import activityRoutes from './activities/activities.routes';
import projectRoutes from './projects/projects.routes';
import taskRoutes from './tasks/tasks.routes';
import { authRoutes, userRoutes } from './users/users.routes';
import { env } from './config';
import { errorHandler, fail, notFound, ok, send } from './shared/http';

export const createApp = (): Application => {
  const app = express();

  // Required behind a load balancer so req.ip is the real client IP and the
  // rate limiter keys off something meaningful.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Broad safety net. Add tighter limits on specific routes if needed later.
  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: env.NODE_ENV === 'production' ? 300 : 1000,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: fail('Too many requests, please try again later', 429),
    }),
  );

  // ---- the whole API surface ----
  app.get('/api/health', (_req, res) =>
    send(res, ok({ service: 'taskflow-api', environment: env.NODE_ENV }, 'TaskFlow API is running')),
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/activities', activityRoutes);

  // Anything that reached this far matched no route.
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;