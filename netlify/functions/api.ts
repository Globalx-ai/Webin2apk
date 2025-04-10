import express, { Request, Response, NextFunction } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { json, urlencoded } from 'body-parser';
import { registerRoutes } from '../../server/routes';
import { setupAuth } from '../../server/auth';

// Initialize the Express app
const app = express();

// Setup middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));

// Set up session for Netlify Functions
if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET not set. Using a default secret - this is not secure for production!');
}

const MemoryStore = createMemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'temporary-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));

// Setup authentication
setupAuth(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Register routes
registerRoutes(app);

// Log middleware to help with debugging
app.use((req, res, next) => {
  console.log(`Netlify function handling: ${req.method} ${req.path}`);
  next();
});

// Export the serverless function
export const handler = serverless(app, {
  basePath: '/api'
});