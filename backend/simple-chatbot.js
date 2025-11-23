const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const PORT = 3002;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openrouter-api-key-here',
  baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Simple Chatbot API'
  });
});

// Chatbot endpoint
app.post('/api/chatbot/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log('Chatbot request received:', message.substring(0, 100));

    // Create a medical coding context
    const systemPrompt = `You are an AI medical coding assistant. You help with:
- Medical billing code suggestions
- Revenue optimization
- Code validation and compliance
- Documentation requirements

Please provide helpful, accurate information about medical coding and billing.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    res.json({
      success: true,
      response: response.choices[0].message.content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 Simple Chatbot Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chatbot/chat`);
});

