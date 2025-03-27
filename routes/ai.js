const express = require('express');
const router = express.Router();
const { generateText, generateChatResponse } = require('../utils/googleAI');
const { verifyToken } = require('../middleware/auth');

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
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { prompt, model, temperature, maxTokens, topK, topP } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Prompt is required' 
      });
    }
    
    // Fix model name format if needed
    let modelName = model || 'gemini-pro';
    
    // Correct common model name mistakes
    if (modelName === 'gemini-1.5pro') {
      modelName = 'gemini-1.5-pro';
    } else if (modelName === 'gemini-1.0pro') {
      modelName = 'gemini-1.0-pro';
    }
    
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
    
    // Fix model name format if needed
    let modelName = model || 'gemini-pro';
    
    // Correct common model name mistakes
    if (modelName === 'gemini-1.5pro') {
      modelName = 'gemini-1.5-pro';
    } else if (modelName === 'gemini-1.0pro') {
      modelName = 'gemini-1.0-pro';
    }
    
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
    
    // Fix model name format if needed
    let modelName = model || 'gemini-pro';
    
    // Correct common model name mistakes
    if (modelName === 'gemini-1.5pro') {
      modelName = 'gemini-1.5-pro';
    } else if (modelName === 'gemini-1.0pro') {
      modelName = 'gemini-1.0-pro';
    }
    
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

module.exports = router; 