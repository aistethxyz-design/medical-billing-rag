// Quick test script to verify AI is working
require('dotenv').config({ path: './backend/.env' });
const OpenAI = require('openai');

console.log('🔍 Testing AI Connection...\n');
console.log('API Key:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT SET');
console.log('Base URL:', process.env.OPENAI_BASE_URL || 'NOT SET');
console.log('Model:', process.env.OPENAI_MODEL || 'NOT SET');
console.log('');

// Try OpenRouter first, then DeepSeek direct API
const apiKey = process.env.OPENAI_API_KEY;
const isDeepSeekKey = apiKey && apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-');

let baseURL = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
let model = process.env.OPENAI_MODEL || 'openai/gpt-4o';

if (isDeepSeekKey) {
  console.log('🔍 Detected DeepSeek key, trying DeepSeek API...');
  baseURL = 'https://api.deepseek.com/v1';
  model = 'deepseek-chat';
  console.log('   Using DeepSeek API:', baseURL);
  console.log('   Model:', model);
} else {
  console.log('🔍 Using OpenRouter API');
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});

async function test() {
  try {
    console.log('\n🤖 Testing with: heart attack\n');
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a medical billing expert. Respond with JSON only.'
        },
        {
          role: 'user',
          content: 'For "heart attack", which billing codes are most appropriate: Emergency assessment codes (H102, H103) or fracture codes (F078, F079)? Return JSON: {"answer": "Emergency assessment codes", "reason": "..."}'
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });
    
    console.log('✅ Success! AI Response:');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  }
}

test();

