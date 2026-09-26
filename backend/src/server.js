'use strict';

/**
 * server.js — Application entrypoint.
 *
 * Responsibilities:
 *   1. Load environment variables (dotenv)
 *   2. Connect to MongoDB and Redis
 *   3. Create HTTP server
 *   4. Initialise Socket.IO
 *   5. Start listening
 *   6. Boot BullMQ workers
 *   7. Graceful shutdown on SIGTERM/SIGINT
 *
 * All async operations are awaited before accepting traffic.
 * Unhandled rejections and uncaught exceptions are caught and logged.
 */

// Load .env BEFORE importing any config (env.js reads process.env at import time)
require('dotenv').config();

const http = require('http');
const app = require('./app');
const db = require('./config/db');
const logger = require('./config/logger');
const env = require('./config/env');
const { initSocket } = require('./config/socket');
const { initGateway } = require('./sockets/socket.gateway');
const { closeAllQueues } = require('./config/queue');

// ── Unhandled Error Guards ────────────────────────────────────────
// These are last-resort — operational errors should be caught in services.
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Process] Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
  // In production, trigger graceful shutdown — the app is in an unknown state
  if (env.node.isProduction) {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

process.on('uncaughtException', (err) => {
  logger.error('[Process] Uncaught Exception — shutting down', {
    error: err.message,
    stack: err.stack,
  });
  // Always exit on uncaught exceptions
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// ── Boot Sequence ─────────────────────────────────────────────────
async function boot() {
  try {
    logger.info('[Boot] Starting Ftafat Backend...');

    // 1. Connect to databases
    await db.connect();

    // 2. Create HTTP server from Express app
    const server = http.createServer(app);

    // 3. Initialise Socket.IO with Redis adapter
    initSocket(server);

    // 4. Set up Socket.IO gateway (auth + room logic)
    initGateway();

    // 5. Start HTTP server
    await new Promise((resolve, reject) => {
      server.listen(env.node.port, (err) => {
        if (err) return reject(err);
        logger.info(`[Boot] Server running`, {
          port: env.node.port,
          env: env.node.env,
          pid: process.pid,
        });
        resolve();
      });
    });

    // 6. Boot BullMQ workers (non-blocking — they run in background)
    bootWorkers();

    // 7. Register graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
    process.on('SIGINT', () => gracefulShutdown('SIGINT', server));

    logger.info('[Boot] Ftafat Backend ready ✓');
    return server;
  } catch (err) {
    logger.error('[Boot] Startup failed', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

function bootWorkers() {
  try {
    require('./jobs/notification.worker');
    require('./jobs/analytics.worker');
    require('./jobs/couponExpiry.worker');
    require('./jobs/email.worker');
    require('./jobs/sms.worker');
    require('./jobs/payoutReconciliation.worker');
    logger.info('[Workers] All BullMQ workers booted');
  } catch (err) {
    // Workers failing should not crash the API server
    logger.error('[Workers] Failed to start workers', { error: err.message });
  }
}

// ── Graceful Shutdown ─────────────────────────────────────────────
async function gracefulShutdown(signal, server) {
  logger.info(`[Shutdown] ${signal} received — graceful shutdown starting...`);

  try {
    // Stop accepting new connections
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info('[Shutdown] HTTP server closed');
    }

    // Close BullMQ queues
    await closeAllQueues();
    logger.info('[Shutdown] BullMQ queues closed');

    // Disconnect MongoDB
    await db.disconnect();
    logger.info('[Shutdown] MongoDB disconnected');

    logger.info('[Shutdown] Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error('[Shutdown] Error during shutdown', { error: err.message });
    process.exit(1);
  }
}

// ── Start ─────────────────────────────────────────────────────────
boot();
