const logger = require('./logger');

/**
 * Log AI model request 
 * @param {string} operation - Type of operation (generate, chat, etc.)
 * @param {object} requestData - Data sent to the model
 * @param {string} modelName - The model being used
 * @param {string} sessionId - Optional session ID for chat operations
 */
const logModelRequest = (operation, requestData, modelName, sessionId = null) => {
  const logData = {
    operation,
    model: modelName,
    timestamp: new Date().toISOString()
  };
  
  // Add session ID if provided
  if (sessionId) {
    logData.sessionId = sessionId;
  }
  
  // Add request data but sanitize potentially large content
  if (requestData) {
    // For prompt-based requests
    if (requestData.prompt) {
      logData.promptLength = requestData.prompt.length;
      logData.promptPreview = requestData.prompt.substring(0, 100) + (requestData.prompt.length > 100 ? '...' : '');
    }
    
    // For message-based requests
    if (requestData.messages && Array.isArray(requestData.messages)) {
      logData.messagesCount = requestData.messages.length;
      // Log last message preview
      if (requestData.messages.length > 0) {
        const lastMsg = requestData.messages[requestData.messages.length - 1];
        if (lastMsg.content) {
          logData.lastMessagePreview = lastMsg.content.substring(0, 100) + 
            (lastMsg.content.length > 100 ? '...' : '');
        }
      }
    }
    
    // For single message requests
    if (requestData.message) {
      logData.messageLength = requestData.message.length;
      logData.messagePreview = requestData.message.substring(0, 100) + 
        (requestData.message.length > 100 ? '...' : '');
    }
    
    // Log model parameters
    if (requestData.temperature) logData.temperature = requestData.temperature;
    if (requestData.maxTokens) logData.maxTokens = requestData.maxTokens;
    if (requestData.topK) logData.topK = requestData.topK;
    if (requestData.topP) logData.topP = requestData.topP;
  }
  
  logger.info(`AI Request: ${operation} with ${modelName}`, logData);
};

/**
 * Log AI model response
 * @param {string} operation - Type of operation (generate, chat, etc.)
 * @param {object} responseData - Data received from the model
 * @param {string} modelName - The model being used
 * @param {number} duration - Time taken in milliseconds
 * @param {string} sessionId - Optional session ID for chat operations
 */
const logModelResponse = (operation, responseData, modelName, duration, sessionId = null) => {
  const logData = {
    operation,
    model: modelName,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  };
  
  // Add session ID if provided
  if (sessionId) {
    logData.sessionId = sessionId;
  }
  
  // Add response data but sanitize potentially large content
  if (responseData) {
    if (responseData.text) {
      logData.responseLength = responseData.text.length;
      logData.responsePreview = responseData.text.substring(0, 100) + 
        (responseData.text.length > 100 ? '...' : '');
    }
    
    if (responseData.promptFeedback) {
      logData.promptFeedback = responseData.promptFeedback;
    }
    
    if (responseData.history) {
      logData.historyLength = responseData.history.length;
    }
  }
  
  logger.info(`AI Response: ${operation} with ${modelName} (${duration}ms)`, logData);
};

/**
 * Log AI model error
 * @param {string} operation - Type of operation (generate, chat, etc.)
 * @param {Error} error - The error object
 * @param {string} modelName - The model being used
 * @param {object} requestData - Original request data
 * @param {string} sessionId - Optional session ID for chat operations
 */
const logModelError = (operation, error, modelName, requestData, sessionId = null) => {
  const logData = {
    operation,
    model: modelName,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
  
  // Add session ID if provided
  if (sessionId) {
    logData.sessionId = sessionId;
  }
  
  // Add minimal request data for context
  if (requestData) {
    if (requestData.prompt) {
      logData.promptPreview = requestData.prompt.substring(0, 100) + 
        (requestData.prompt.length >
        100 ? '...' : '');
    }
    
    if (requestData.message) {
      logData.messagePreview = requestData.message.substring(0, 100) + 
        (requestData.message.length > 100 ? '...' : '');
    }
  }
  
  logger.error(`AI Error: ${operation} with ${modelName} - ${error.message}`, logData);
};

module.exports = {
  logModelRequest,
  logModelResponse,
  logModelError
}; 