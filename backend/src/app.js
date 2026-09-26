'use strict';

/**
 * app.js — Express application factory.
 *
 * Creates and configures the Express app:
 *   - Security middleware (Helmet, CORS)
 *   - Request parsing
 *   - Sanitization
 *   - Rate limiting
 *   - Logging
 *   - Routes
 *   - Error handling
 *
 * Does NOT start the server — that's server.js's job.
 * This separation makes integration testing easy (import app, no port needed).
 */

'use strict';

require('express-async-errors'); // Patches express to catch async errors automatically

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const logger = require('./config/logger');
const requestLogger = require('./middlewares/requestLogger.middleware');
const { noSqlSanitize, xssSanitize } = require('./middlewares/sanitize.middleware');
const { globalLimiter } = require('./middlewares/rateLimiter.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');
const { NotFoundError } = require('./common/errors');
const apiRoutes = require('./routes');

const app = express();

// ── Security Headers ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'https://res.cloudinary.com', 'data:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// ── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // In dev mode allow all origins (mobile apps, Postman, Expo Web/Mobile on any IP)
    if (env.isDev || !origin || env.cors.allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://192.168.') || origin.startsWith('http://10.') || origin.startsWith('exp://')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true, // Allow cookies (for refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Idempotency-Key'],
}));

// ── Request Parsing ───────────────────────────────────────────────
// JSON body parser — webhook route overrides this with raw parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Request Logging ───────────────────────────────────────────────
app.use(requestLogger);

// ── Sanitization ─────────────────────────────────────────────────
app.use(noSqlSanitize);
app.use(xssSanitize);

// ── Rate Limiting ─────────────────────────────────────────────────
app.use(globalLimiter);

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ── 404 Handler ───────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
});

// ── Global Error Handler ─────────────────────────────────────────
// Must be the LAST middleware (4 args)
app.use(errorHandler);

module.exports = app;
