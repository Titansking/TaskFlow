/**
 * Process entry point.
 *
 * 1. Connect to MongoDB (fail fast — never serve traffic without a database)
 * 2. Start listening
 * 3. Shut down cleanly on Ctrl-C / container stop
 */
import { createApp } from './app';
import { connectDB, disconnectDB, env } from './config';

/** Finds out who is holding a port, so the error can name them. */
const portOwner = async (port: number): Promise<string> => {
  try {
    const { createServer } = await import('node:net');
    // Binding proves the port is free; not binding means someone has it.
    await new Promise<void>((resolve, reject) => {
      const probe = createServer();
      probe.once('error', reject);
      probe.once('listening', () => probe.close(() => resolve()));
      probe.listen(port, '0.0.0.0');
    });
    return '';
  } catch {
    return 'Something else is already using it.';
  }
};

const start = async (): Promise<void> => {
  await connectDB();

  const app = createApp();

  const server = app.listen(env.PORT);
  server.on('error', async (error: NodeJS.ErrnoException) => {
    if (error.code !== 'EADDRINUSE') {
      console.error('[server] failed to start:', error);
      process.exit(1);
      return;
    }

    console.error(`
\x1b[31m✖ Port ${env.PORT} is already in use.\x1b[0m ${await portOwner(env.PORT)}

  Common culprits:
    macOS  -> AirPlay Receiver holds port 5000.
              Disable: System Settings > General > AirDrop & Handoff > AirPlay Receiver
    macOS  -> Control Centre also uses port 5000 and cannot always be stopped.
    other  -> A previous run of this server is still alive:
              \x1b[2mlsof -i :${env.PORT}\x1b[0m then \x1b[2mkill <PID>\x1b[0m

  Easiest fix — change the port in backend/.env and match it in frontend/.env.local:
    backend/.env          \x1b[2mPORT=5001\x1b[0m
    frontend/.env.local   \x1b[2mNEXT_PUBLIC_API_URL=http://localhost:5001/api\x1b[0m
    (then restart both servers)
`);
    process.exit(1);
  });

  server.once('listening', () => {
    console.log(`[server] TaskFlow API listening on http://localhost:${env.PORT}`);
    console.log(`[server] environment: ${env.NODE_ENV}`);
  });

  const shutdown = (signal: string): void => {
    console.log(`\n[server] ${signal} received, shutting down...`);

    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });

    // Don't hang forever if a connection refuses to close.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch((error) => {
  console.error('[server] failed to start:', error);
  process.exit(1);
});