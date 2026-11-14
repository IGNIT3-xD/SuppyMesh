import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { globalErrorHandler } from './utils/error-handler';
import { authRoutes } from './modules/auth/auth.routes';
import cookieParser from 'cookie-parser';

export function createApp(): Application {
  const app = express();
  app.use(cookieParser());

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health Check
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Mount Modules ---
  app.use('/api/v1/auth', authRoutes);

  // Global Error Handler
  app.use(globalErrorHandler);

  return app;
}