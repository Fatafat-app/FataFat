'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./app');
const db = require('./config/db');
const logger = require('./config/logger');
const env = require('./config/env');
const { initSocket } = require('./config/socket');
const { initGateway } = require('./sockets/socket.gateway');
const { closeAllQueues } = require('./config/queue');

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Process] Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
  if (env.node.isProduction) {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

process.on('uncaughtException', (err) => {
  logger.error('[Process] Uncaught Exception — shutting down', {
    error: err.message,
    stack: err.stack,
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

async function boot() {
  try {
    logger.info('[Boot] Starting Ftafat Backend...');

    await db.connect();

    const server = http.createServer(app);

    initSocket(server);

    initGateway();

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

    bootWorkers();

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
    logger.error('[Workers] Failed to start workers', { error: err.message });
  }
}

async function gracefulShutdown(signal, server) {
  logger.info(`[Shutdown] ${signal} received — graceful shutdown starting...`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info('[Shutdown] HTTP server closed');
    }

    await closeAllQueues();
    logger.info('[Shutdown] BullMQ queues closed');

    await db.disconnect();
    logger.info('[Shutdown] MongoDB disconnected');

    logger.info('[Shutdown] Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error('[Shutdown] Error during shutdown', { error: err.message });
    process.exit(1);
  }
}

boot();
