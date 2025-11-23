// Test script for Free Model
require('dotenv').config({ path: './backend/.env' });
const OpenAI = require('openai');

console.log('🔍 Testing Free Model Connection...');
console.log('Model:', process.env.OPENAI_MODEL);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

async function test() {
  try {
    console.log('\n🤖 Asking: "Billing codes for heart attack?"');
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a medical billing expert. Return JSON.'
        },
        {
          role: 'user',
          content: 'Suggest 3 billing codes for "heart attack" (myocardial infarction) in an emergency setting. Return a JSON array with code, description, and reason.'
        }
      ],
    });
    
    console.log('\n✅ Success! AI Response:\n');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('402')) {
      console.error('⚠️ Still seeing balance error. The key might be locked.');
    }
  }
}

test();

