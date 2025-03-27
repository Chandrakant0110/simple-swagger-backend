const express = require('express');
const router = express.Router();
const { generateText, generateChatResponse, generateChatSessionResponse, getChatHistory, listModels } = require('../utils/googleAI');
const { verifyToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * /api/ai/generate:
 *   post:
 *     summary: Generate text with Google Generative AI
 *     description: Generate text based on the provided prompt using Google's Generative AI
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The prompt to generate text from
 *               model:
 *                 type: string
 *                 description: The model to use (default is gemini-pro)
 *               temperature:
 *                 type: number
 *                 description: Controls randomness (0-1)
 *               maxTokens:
 *                 type: integer
 *                 description: Maximum number of tokens to generate
 *     responses:
 *       200:
 *         description: Successfully generated text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   description: The generated text
 *       400:
 *         description: Bad request, missing prompt
 *       401:
 *         description: Unauthorized, invalid or missing token
 *       500:
 *         description: Server error
 */

/**
 * Fix model name formatting issues
 * @param {string} modelName - The model name to fix
 * @returns {string} - The corrected model name
 */
function fixModelName(modelName) {
  if (!modelName) return 'gemini-pro';
  
  // Fix gemini-X.Ypro format (missing hyphen)
  if (/gemini-\d+\.\d+pro/.test(modelName)) {
    return modelName.replace(/(gemini-\d+\.\d+)pro/, '$1-pro');
  }
  
  // Fix gemini-X.Yflash format (missing hyphen)
  if (/gemini-\d+\.\d+flash/.test(modelName)) {
    return modelName.replace(/(gemini-\d+\.\d+)flash/, '$1-flash');
  }
  
  // Fix experimental model naming if needed
  if (/gemini-\d+\.\d+-pro-exp/.test(modelName) && !modelName.includes('-03-25')) {
    // Add date suffix for experimental models if missing
    return `${modelName}-03-25`;
  }
  
  return modelName;
}

router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { prompt, model, temperature, maxTokens, topK, topP } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Prompt is required' 
      });
    }
    
    // Fix model name format
    const modelName = fixModelName(model);
    
    const options = {
      model: modelName,
      temperature,
      maxTokens,
      topK,
      topP
    };
    
    const response = await generateText(prompt, options);
    
    return res.json({
      status: 'success',
      data: response
    });
    
  } catch (error) {
    console.error('Error in /ai/generate:', error);
    
    if (error.message.includes('API key')) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid API key or API key not configured'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate text',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Generate chat response with Google Generative AI
 *     description: Generate a chat response based on conversation history
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 description: Array of messages with role and content
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, model]
 *                     content:
 *                       type: string
 *               model:
 *                 type: string
 *                 description: The model to use (default is gemini-pro)
 *               temperature:
 *                 type: number
 *                 description: Controls randomness (0-1)
 *               maxTokens:
 *                 type: integer
 *                 description: Maximum number of tokens to generate
 *     responses:
 *       200:
 *         description: Successfully generated chat response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   description: The generated response
 *       400:
 *         description: Bad request, missing or invalid messages
 *       401:
 *         description: Unauthorized, invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { messages, model, temperature, maxTokens, topK, topP } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid messages array is required'
      });
    }
    
    // Validate each message has role and content
    const isValidMessages = messages.every(
      msg => msg.role && (msg.role === 'user' || msg.role === 'model') && msg.content
    );
    
    if (!isValidMessages) {
      return res.status(400).json({
        status: 'error',
        message: 'Each message must have a valid role (user or model) and content'
      });
    }
    
    // Fix model name format
    const modelName = fixModelName(model);
    
    const options = {
      model: modelName,
      temperature,
      maxTokens,
      topK,
      topP
    };
    
    const response = await generateChatResponse(messages, options);
    
    return res.json({
      status: 'success',
      data: response
    });
    
  } catch (error) {
    console.error('Error in /ai/chat:', error);
    
    if (error.message.includes('API key')) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid API key or API key not configured'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate chat response',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ai/public/generate:
 *   post:
 *     summary: Generate text without authentication (public endpoint)
 *     description: Generate text based on the provided prompt using Google's Generative AI (no auth required)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The prompt to generate text from
 *               model:
 *                 type: string
 *                 description: The model to use (default is gemini-pro)
 *     responses:
 *       200:
 *         description: Successfully generated text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   description: The generated text
 *       400:
 *         description: Bad request, missing prompt
 *       500:
 *         description: Server error
 */
router.post('/public/generate', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Prompt is required' 
      });
    }
    
    // Fix model name format
    const modelName = fixModelName(model);
    
    const options = {
      model: modelName,
      temperature: 0.7,
      maxTokens: 1024
    };
    
    const response = await generateText(prompt, options);
    
    return res.json({
      status: 'success',
      data: response
    });
    
  } catch (error) {
    console.error('Error in /ai/public/generate:', error);
    
    if (error.message.includes('API key')) {
      return res.status(500).json({
        status: 'error',
        message: 'Invalid API key or API key not configured'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate text',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ai/models:
 *   get:
 *     summary: Get a list of available Gemini AI models
 *     description: Returns a list of all available models from Google's Generative AI API
 *     responses:
 *       200:
 *         description: Successfully retrieved list of models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Model identifier
 *                       displayName:
 *                         type: string
 *                         description: Human-readable model name
 *                       description:
 *                         type: string
 *                         description: Model description
 *       500:
 *         description: Server error
 */
router.get('/models', async (req, res) => {
  try {
    const models = await listModels();
    
    // Sort models by name to show newest versions first
    models.sort((a, b) => {
      // Sort gemini models first
      if (a.name.includes('gemini') && !b.name.includes('gemini')) return -1;
      if (!a.name.includes('gemini') && b.name.includes('gemini')) return 1;
      
      // Sort by version, highest (newest) first
      const aVersion = a.name.match(/\d+\.\d+/) ? parseFloat(a.name.match(/\d+\.\d+/)[0]) : 0;
      const bVersion = b.name.match(/\d+\.\d+/) ? parseFloat(b.name.match(/\d+\.\d+/)[0]) : 0;
      
      return bVersion - aVersion;
    });
    
    // Create a recommended models section with the newest models
    const recommendedModels = [
      { name: 'gemini-2.5-pro-exp-03-25', description: 'Latest experimental version with enhanced capabilities' },
      { name: 'gemini-2.5-pro', description: 'Latest flagship model with improved reasoning and coding' },
      { name: 'gemini-2.0-flash-thinking-exp', description: 'Experimental model with enhanced reasoning' },
      { name: 'gemini-2.0-flash', description: 'Fast and efficient model for general use cases' },
      { name: 'gemini-1.5-pro', description: 'Powerful model with 1M token context window' },
      { name: 'gemini-pro-vision', description: 'Vision and multimodal capabilities' }
    ];
    
    return res.json({
      status: 'success',
      recommended: recommendedModels,
      data: models
    });
    
  } catch (error) {
    console.error('Error in /ai/models:', error);
    
    if (error.message.includes('API key')) {
      return res.status(500).json({
        status: 'error',
        message: 'Invalid API key or API key not configured'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve models',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ai/chat/session:
 *   post:
 *     summary: Chat with maintained session history
 *     description: Send a message to a persistent chat session that maintains conversation history
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Session ID (a new one will be created if not provided)
 *               message:
 *                 type: string
 *                 description: The user message to send
 *               model:
 *                 type: string
 *                 description: The model to use (default is gemini-pro)
 *               temperature:
 *                 type: number
 *                 description: Controls randomness (0-1)
 *               maxTokens:
 *                 type: integer
 *                 description: Maximum number of tokens to generate
 *     responses:
 *       200:
 *         description: Successfully generated chat response with history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       description: ID for the chat session
 *                     text:
 *                       type: string
 *                       description: The generated response
 *                     history:
 *                       type: array
 *                       description: The full conversation history
 *       400:
 *         description: Bad request, missing message
 *       401:
 *         description: Unauthorized, invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/chat/session', verifyToken, async (req, res) => {
  try {
    const { sessionId, message, model, temperature, maxTokens, topK, topP } = req.body;
    
    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required'
      });
    }
    
    // Generate a new session ID if not provided
    const chatSessionId = sessionId || uuidv4();
    
    // Fix model name format
    const modelName = fixModelName(model);
    
    const options = {
      model: modelName,
      temperature,
      maxTokens,
      topK,
      topP
    };
    
    const response = await generateChatSessionResponse(chatSessionId, message, options);
    
    return res.json({
      status: 'success',
      data: {
        sessionId: chatSessionId,
        text: response.text,
        history: response.history
      }
    });
    
  } catch (error) {
    console.error('Error in /ai/chat/session:', error);
    
    if (error.message.includes('API key')) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid API key or API key not configured'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate chat response',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ai/chat/history/{sessionId}:
 *   get:
 *     summary: Get chat history for a session
 *     description: Retrieves the conversation history for a specific chat session
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat session
 *     responses:
 *       200:
 *         description: Successfully retrieved chat history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   description: Chat history entries
 *       401:
 *         description: Unauthorized, invalid or missing token
 *       404:
 *         description: Chat session not found
 */
router.get('/chat/history/:sessionId', verifyToken, (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = getChatHistory(sessionId);
    
    if (!history || history.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found or history is empty'
      });
    }
    
    return res.json({
      status: 'success',
      data: history
    });
    
  } catch (error) {
    console.error('Error in /ai/chat/history:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve chat history',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ai/public/chat:
 *   post:
 *     summary: Chat with maintained session history (public endpoint)
 *     description: Public endpoint to send a message to a persistent chat session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Session ID (a new one will be created if not provided)
 *               message:
 *                 type: string
 *                 description: The user message to send
 *               model:
 *                 type: string
 *                 description: The model to use (default is gemini-pro)
 *     responses:
 *       200:
 *         description: Successfully generated chat response with history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                   description: ID for the chat session
 *                 text:
 *                   type: string
 *                   description: The generated response
 *                 history:
 *                   type: array
 *                   description: The full conversation history
 *       400:
 *         description: Bad request, missing message
 *       500:
 *         description: Server error
 */
router.post('/public/chat', async (req, res) => {
  try {
    const { sessionId, message, model } = req.body;
    
    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required'
      });
    }
    
    // Generate a new session ID if not provided
    const chatSessionId = sessionId || uuidv4();
    
    // Fix model name format
    const modelName = fixModelName(model);
    
    const options = {
      model: modelName,
      temperature: 0.7,
      maxTokens: 1024
    };
    
    const response = await generateChatSessionResponse(chatSessionId, message, options);
    
    return res.json({
      status: 'success',
      data: {
        sessionId: chatSessionId,
        text: response.text,
        history: response.history
      }
    });
    
  } catch (error) {
    console.error('Error in /ai/public/chat:', error);
    
    if (error.message.includes('API key')) {
      return res.status(500).json({
        status: 'error',
        message: 'Invalid API key or API key not configured'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate chat response',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/ai/public/chat/history/{sessionId}:
 *   get:
 *     summary: Get chat history for a session (public endpoint)
 *     description: Public endpoint to retrieve conversation history for a specific chat session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat session
 *     responses:
 *       200:
 *         description: Successfully retrieved chat history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   description: Chat history entries
 *       404:
 *         description: Chat session not found
 */
router.get('/public/chat/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = getChatHistory(sessionId);
    
    if (!history || history.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Chat session not found or history is empty'
      });
    }
    
    return res.json({
      status: 'success',
      data: history
    });
    
  } catch (error) {
    console.error('Error in /ai/public/chat/history:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve chat history',
      error: error.message
    });
  }
});

module.exports = router; 