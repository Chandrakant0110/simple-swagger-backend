const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// ANSI color codes for terminal coloring
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bright: '\x1b[1m'
};

// Helper to colorize status code
const colorizeStatus = (status) => {
  if (status >= 500) return `${colors.red}${status}${colors.reset}`;
  if (status >= 400) return `${colors.yellow}${status}${colors.reset}`;
  if (status >= 300) return `${colors.cyan}${status}${colors.reset}`;
  return `${colors.green}${status}${colors.reset}`;
};

// Helper to colorize method
const colorizeMethod = (method) => {
  switch (method) {
    case 'GET': return `${colors.green}${method}${colors.reset}`;
    case 'POST': return `${colors.blue}${method}${colors.reset}`;
    case 'PUT':
    case 'PATCH': return `${colors.yellow}${method}${colors.reset}`;
    case 'DELETE': return `${colors.red}${method}${colors.reset}`;
    default: return `${colors.gray}${method}${colors.reset}`;
  }
};

// Helper to colorize response time
const colorizeResponseTime = (time) => {
  if (time > 1000) return `${colors.red}${time}ms${colors.reset}`;
  if (time > 500) return `${colors.yellow}${time}ms${colors.reset}`;
  return `${colors.green}${time}ms${colors.reset}`;
};

// Define custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length 
      ? `\n${JSON.stringify(meta, null, 2)}` 
      : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  })
);

// Configure the Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    // File transport for all logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Separate file for error logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Helper method for API request logging
logger.logApiRequest = (req, startTime) => {
  const { method, originalUrl, ip, headers, body } = req;
  const userAgent = headers['user-agent'];
  const contentLength = headers['content-length'] || 0;
  
  return {
    method,
    url: originalUrl,
    ip,
    userAgent,
    contentLength,
    body: Object.keys(body).length > 0 ? body : undefined,
    startTime
  };
};

// Helper method for API response logging
logger.logApiResponse = (req, res, startTime) => {
  const duration = new Date() - startTime;
  
  // Create a beautiful colored log format for console output
  const coloredLog = `${colorizeMethod(req.method)} ${colors.cyan}${req.originalUrl}${colors.reset} ${colorizeStatus(res.statusCode)} - ${colorizeResponseTime(duration)}`;
  
  // Log the colored version to console directly
  console.log(coloredLog);
  
  // Also log structured data for file logs and programmatic access
  logger.http('API Response', {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    duration,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
};

module.exports = logger; 