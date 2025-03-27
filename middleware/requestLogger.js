const logger = require('../utils/logger');
const morgan = require('morgan');

// Create a stream object that writes to our Winston logger
const loggerStream = {
  write: (message) => {
    // Remove the trailing newline and don't duplicate the log
    const logMessage = message.trim();
    // We'll handle actual logging in the logApiResponse method
  }
};

// Create middleware to log all requests
const requestLogger = (req, res, next) => {
  // Store the start time
  const startTime = new Date();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function
  res.end = function(...args) {
    // Calculate response time
    res.responseTime = new Date() - startTime;
    
    // Log detailed API request/response info
    logger.logApiResponse(req, res, startTime);
    
    // Call original end function
    originalEnd.apply(res, args);
  };
  
  // Log request body for specific content types
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    // Mask sensitive fields (passwords, tokens, etc.)
    const maskedBody = { ...req.body };
    if (maskedBody.password) maskedBody.password = '********';
    if (maskedBody.token) maskedBody.token = '********';
    if (maskedBody.access_token) maskedBody.access_token = '********';
    
    logger.debug('Request body', { 
      method: req.method, 
      url: req.originalUrl, 
      body: maskedBody 
    });
  }
  
  // Continue to next middleware
  next();
};

module.exports = {
  // Simplified morgan middleware that won't duplicate our logs
  morganMiddleware: morgan('dev', { 
    skip: () => true, // Skip morgan's output since we're using our custom logger
    stream: loggerStream 
  }),
  requestLogger
}; 