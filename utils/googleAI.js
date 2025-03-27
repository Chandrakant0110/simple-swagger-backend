const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// Initialize the Google Generative AI with API key
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

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
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });
    
    const response = result.response;
    
    return {
      text: response.text(),
      promptFeedback: response.promptFeedback,
    };
  } catch (error) {
    console.error('Error generating text:', error);
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
    
    // Generate content
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: formattedMessages.slice(0, -1) // All messages except the last one
    });
    
    const lastMessage = formattedMessages[formattedMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    
    return {
      text: result.response.text(),
      promptFeedback: result.response.promptFeedback,
    };
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}

module.exports = {
  generateText,
  generateChatResponse,
}; 