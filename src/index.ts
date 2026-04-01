import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { validateEnv, env } from './config/env';
import { initializePool } from './config/db';
import { router } from './routes';
import { errorHandler, notFound } from './middleware/errorHandler.middleware';
import { publicLimiter } from './middleware/rateLimiter.middleware';
import { initializeSocket } from './socket';

validateEnv();

const app = express();
const httpServer = createServer(app);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(publicLimiter);

app.use('/api', router);
app.use(notFound);
app.use(errorHandler);

async function start(): Promise<void> {
  await initializePool();
  initializeSocket(httpServer);
  httpServer.listen(env.PORT, () => {
    console.log(`\n🚀 SuitexTech API running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Frontend: ${env.FRONTEND_URL}\n`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
