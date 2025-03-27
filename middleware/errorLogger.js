const logger = require('../utils/logger');

/**
 * Global error handling middleware
 * Logs error details and returns an appropriate response to the client
 */
const errorLogger = (err, req, res, next) => {
  // Get error details
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const stack = err.stack || '';
  
  // Log the error with different levels based on status code
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      stack,
      body: req.body
    });
  } else if (statusCode >= 400) {
    logger.warn(`${statusCode} - ${message}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    });
  }
  
  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    // Include stack trace in development mode but not in production
    ...(process.env.NODE_ENV !== 'production' && { stack })
  });
};

module.exports = errorLogger; 