import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { authRoutes } from './routes/auth';
import { borrowerRoutes } from './routes/borrowers';
import { loanRoutes } from './routes/loans';
import { paymentRoutes } from './routes/payments';
import { documentRoutes } from './routes/documents';
import { reminderRoutes } from './routes/reminders';
import { reportRoutes } from './routes/reports';
import { webhookRoutes } from './routes/webhooks';
import { reminderScheduler } from './jobs/reminderScheduler';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  });

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Auth
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
  });

  await app.register(cookie, {
    parseOptions: {},
  });

  // API Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'LendFlow Namibia API',
        description: 'Micro-SaaS API for local lenders in Namibia',
        version: '1.0.0',
      },
      servers: [{ url: '/api' }],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'borrowers', description: 'Borrower management' },
        { name: 'loans', description: 'Loan management' },
        { name: 'payments', description: 'Payment tracking' },
        { name: 'documents', description: 'Document management' },
        { name: 'reminders', description: 'Reminder system' },
        { name: 'reports', description: 'Reporting & metrics' },
        { name: 'webhooks', description: 'Twilio webhook handlers' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(borrowerRoutes, { prefix: '/api/borrowers' });
  await app.register(loanRoutes, { prefix: '/api/loans' });
  await app.register(paymentRoutes, { prefix: '/api/payments' });
  await app.register(documentRoutes, { prefix: '/api/documents' });
  await app.register(reminderRoutes, { prefix: '/api/reminders' });
  await app.register(reportRoutes, { prefix: '/api/reports' });
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });

  return app;
}

export async function startServer() {
  const app = await buildApp();

  const host = process.env.HOST || '0.0.0.0';
  const port = parseInt(process.env.PORT || '3000', 10);

  try {
    await app.listen({ host, port });
    console.log(`LendFlow API running on http://${host}:${port}`);
    console.log(`API Documentation: http://${host}:${port}/docs`);

    // Start reminder scheduler cron
    reminderScheduler.start();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startServer();
}
