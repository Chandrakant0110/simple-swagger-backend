const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const aiLogger = require('./aiLogger');
const logger = require('./logger');

// Initialize the Google Generative AI with API key
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
logger.info('Google Generative AI initialized');

// In-memory store for chat sessions
const chatSessions = new Map();

/**
 * Generate text from prompt using Google's Generative AI (Gemini)
 * @param {string} prompt - The user's input prompt
 * @param {object} options - Optional parameters for the model
 * @returns {Promise<object>} - The generated response
 */
async function generateText(prompt, options = {}) {
  try {
    // Default model is gemini-pro
    const modelName = options.model || 'gemini-pro';
    const model = googleAI.getGenerativeModel({ model: modelName });
    
    // Set safety settings if provided
    const generationConfig = {
      temperature: options.temperature || 0.7,
      topK: options.topK || 40,
      topP: options.topP || 0.95,
      maxOutputTokens: options.maxTokens || 2048,
    };
    
    // Configure safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
    
    // Log model request
    const requestData = { prompt, ...options };
    aiLogger.logModelRequest('generateText', requestData, modelName);
    
    const startTime = Date.now();
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });
    
    const duration = Date.now() - startTime;
    const response = result.response;
    const responseData = {
      text: response.text(),
      promptFeedback: response.promptFeedback,
    };
    
    // Log model response
    aiLogger.logModelResponse('generateText', responseData, modelName, duration);
    
    return responseData;
  } catch (error) {
    // Log model error
    aiLogger.logModelError('generateText', error, options.model || 'gemini-pro', { prompt, ...options });
    throw error;
  }
}

/**
 * Generate a chat response from chat history
 * @param {Array} messages - Array of chat messages with role and content
 * @param {object} options - Optional parameters for the model
 * @returns {Promise<object>} - The generated response
 */
async function generateChatResponse(messages, options = {}) {
  try {
    // Default model is gemini-pro
    const modelName = options.model || 'gemini-pro';
    const model = googleAI.getGenerativeModel({ model: modelName });
    
    // Convert messages to the format expected by the API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));
    
    // Set generation config
    const generationConfig = {
      temperature: options.temperature || 0.7,
      topK: options.topK || 40,
      topP: options.topP || 0.95,
      maxOutputTokens: options.maxTokens || 2048,
    };
    
    // Configure safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
    
    // Log model request
    const requestData = { messages, ...options };
    aiLogger.logModelRequest('generateChatResponse', requestData, modelName);
    
    const startTime = Date.now();
    
    // Generate content
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: formattedMessages.slice(0, -1) // All messages except the last one
    });
    
    const lastMessage = formattedMessages[formattedMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    
    const duration = Date.now() - startTime;
    const responseData = {
      text: result.response.text(),
      promptFeedback: result.response.promptFeedback,
    };
    
    // Log model response
    aiLogger.logModelResponse('generateChatResponse', responseData, modelName, duration);
    
    return responseData;
  } catch (error) {
    // Log model error
    aiLogger.logModelError('generateChatResponse', error, options.model || 'gemini-pro', { messages, ...options });
    throw error;
  }
}

/**
 * Create or retrieve a chat session
 * @param {string} sessionId - Unique identifier for the chat session
 * @param {string} modelName - Model to use for the chat
 * @param {object} config - Configuration for the chat
 * @returns {object} - Chat session object
 */
function getChatSession(sessionId, modelName = 'gemini-pro', config = {}) {
  if (!chatSessions.has(sessionId)) {
    const model = googleAI.getGenerativeModel({ model: modelName });
    
    // Set generation config
    const generationConfig = {
      temperature: config.temperature || 0.7,
      topK: config.topK || 40,
      topP: config.topP || 0.95,
      maxOutputTokens: config.maxTokens || 2048,
    };
    
    // Configure safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
    
    // Create a new chat session
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: []
    });
    
    // Store session info
    chatSessions.set(sessionId, {
      chat,
      model: modelName,
      history: [],
      lastUsed: Date.now()
    });
    
    // Schedule cleanup for old sessions (24 hours of inactivity)
    setTimeout(() => {
      const session = chatSessions.get(sessionId);
      if (session && Date.now() - session.lastUsed > 24 * 60 * 60 * 1000) {
        chatSessions.delete(sessionId);
      }
    }, 24 * 60 * 60 * 1000);
  }
  
  // Update last used timestamp
  const session = chatSessions.get(sessionId);
  session.lastUsed = Date.now();
  
  return session;
}

/**
 * Generate a chat response from an existing chat session
 * @param {string} sessionId - Unique identifier for the chat session
 * @param {string} message - The new user message
 * @param {object} options - Optional parameters for the model
 * @returns {Promise<object>} - The generated response and updated history
 */
async function generateChatSessionResponse(sessionId, message, options = {}) {
  try {
    // Fix model name if provided
    let modelName = options.model || 'gemini-pro';
    
    // Log model request
    const requestData = { sessionId, message, ...options };
    aiLogger.logModelRequest('generateChatSessionResponse', requestData, modelName, sessionId);
    
    const startTime = Date.now();
    
    // Get or create chat session
    const session = getChatSession(sessionId, modelName, options);
    
    // Send the message to the chat
    const result = await session.chat.sendMessage(message);
    const responseText = result.response.text();
    
    // Update history
    session.history.push({ role: 'user', content: message });
    session.history.push({ role: 'model', content: responseText });
    
    const duration = Date.now() - startTime;
    const responseData = {
      text: responseText,
      promptFeedback: result.response.promptFeedback,
      history: session.history
    };
    
    // Log model response
    aiLogger.logModelResponse('generateChatSessionResponse', responseData, modelName, duration, sessionId);
    
    return responseData;
  } catch (error) {
    // Log model error
    aiLogger.logModelError('generateChatSessionResponse', error, options.model || 'gemini-pro', 
      { sessionId, message, ...options }, sessionId);
    throw error;
  }
}

/**
 * Get chat history for a session
 * @param {string} sessionId - Chat session ID
 * @returns {Array} - Chat history or empty array if session not found
 */
function getChatHistory(sessionId) {
  const session = chatSessions.get(sessionId);
  return session ? session.history : [];
}

/**
 * Get list of available models from Google Generative AI
 * @returns {Promise<Array>} - Array of available model information
 */
async function listModels() {
  try {
    // The Google Generative AI library doesn't support listModels directly
    // Using a comprehensive list of models instead
    return [
      // Gemini 2.5 models (newest)
      {
        name: 'gemini-2.5-pro-exp-03-25',
        displayName: 'Gemini 2.5 Pro Experimental',
        description: 'Latest experimental version of Gemini 2.5 Pro with enhanced capabilities',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'embedContent', 'streamGenerateContent']
      },
      {
        name: 'gemini-2.5-pro',
        displayName: 'Gemini 2.5 Pro',
        description: 'Latest flagship model with significantly improved reasoning, instruction following, and coding capabilities',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'embedContent', 'streamGenerateContent']
      },
      // Gemini 2.0 models
      {
        name: 'gemini-2.0-flash-thinking-exp',
        displayName: 'Gemini 2.0 Flash Thinking Experimental',
        description: 'Experimental model with enhanced reasoning capabilities for complex problems',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'embedContent', 'streamGenerateContent']
      },
      {
        name: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        description: 'Fast and efficient model balancing quality and speed for general use cases',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'embedContent', 'streamGenerateContent']
      },
      {
        name: 'gemini-2.0-pro',
        displayName: 'Gemini 2.0 Pro',
        description: 'Advanced model with strong reasoning and instruction following capabilities',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'embedContent', 'streamGenerateContent']
      },
      // Gemini 1.5 models
      {
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Capable model for complex tasks, supporting input/output up to 1 million tokens',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'embedContent', 'streamGenerateContent']
      },
      {
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Balanced model for scalable use, supporting input up to 1 million tokens with fast responses',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'embedContent', 'streamGenerateContent']
      },
      // Gemini 1.0 models
      {
        name: 'gemini-pro',
        displayName: 'Gemini Pro',
        description: 'Text-only model that is optimized for instruction following, programming, and reasoning',
        inputTokenLimit: 30720,
        outputTokenLimit: 2048,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'embedContent', 'streamGenerateContent']
      },
      {
        name: 'gemini-pro-vision',
        displayName: 'Gemini Pro Vision',
        description: 'Multimodal model for image understanding with text reasoning capabilities',
        inputTokenLimit: 12288,
        outputTokenLimit: 4096,
        supportedGenerationMethods: ['generateContent', 'countTokens', 'streamGenerateContent']
      },
      // Other models
      {
        name: 'models/embedding-001',
        displayName: 'Embedding-001',
        description: 'Model for creating text embeddings for semantic search and recommendations',
        inputTokenLimit: 2048,
        outputTokenLimit: null,
        supportedGenerationMethods: ['embedContent']
      }
    ];
  } catch (error) {
    console.error('Error listing models:', error);
    throw error;
  }
}

module.exports = {
  generateText,
  generateChatResponse,
  generateChatSessionResponse,
  getChatHistory,
  listModels
}; 