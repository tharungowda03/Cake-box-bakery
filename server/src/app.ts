import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRouter from './routes/health';
import settingsRouter from './routes/settings';
import ordersRouter from './routes/orders';
import customOrdersRouter from './routes/customOrders';
import addressesRouter from './routes/addresses';
import chatRouter from './routes/chat';
import ownerRouter from './routes/owner';
import showcaseRouter from './routes/showcase';

import { config } from './config/env';

const app = express();

// Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Production-ready CORS supporting local dev, Render domains, and FRONTEND_URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
];

if (config.frontendUrl) {
  const customOrigins = config.frontendUrl
    .split(',')
    .map((u) => u.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  allowedOrigins.push(...customOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, uptime monitors)
      if (!origin) return callback(null, true);

      // Check if origin matches allowed list, any .onrender.com subdomain, or wildcard
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.onrender.com') ||
        config.frontendUrl === '*';

      if (isAllowed) {
        return callback(null, true);
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', healthRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/custom-orders', customOrdersRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/showcase', showcaseRouter);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

export default app;
