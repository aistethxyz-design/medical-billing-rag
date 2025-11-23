// Simple RAG Server - No Prisma, No Complex Dependencies
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 3002;

// OpenAI/OpenRouter/DeepSeek setup
const OpenAI = require('openai');

// Debug: Log environment variables
console.log('🔍 Environment Check:');
console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT SET');
console.log('   OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL || 'NOT SET');
console.log('   OPENAI_MODEL:', process.env.OPENAI_MODEL || 'NOT SET');

// Detect API key type and configure accordingly
const apiKey = process.env.OPENAI_API_KEY;
const isDeepSeekKey = apiKey && apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-');
const isOpenRouterKey = apiKey && apiKey.startsWith('sk-or-');

let baseURL = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
let defaultModel = process.env.OPENAI_MODEL || 'openai/gpt-4o';

// If DeepSeek key detected, try OpenRouter with DeepSeek model first
if (isDeepSeekKey && !process.env.OPENAI_BASE_URL) {
  console.log('🔍 Detected DeepSeek key format');
  console.log('   Trying OpenRouter with DeepSeek model...');
  baseURL = 'https://openrouter.ai/api/v1';
  defaultModel = 'deepseek/deepseek-chat'; // Use DeepSeek via OpenRouter
} else if (isDeepSeekKey && process.env.OPENAI_BASE_URL && process.env.OPENAI_BASE_URL.includes('deepseek')) {
  console.log('🔍 Using DeepSeek API directly');
  baseURL = 'https://api.deepseek.com/v1';
  defaultModel = 'deepseek-chat';
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});

const AI_MODEL = process.env.OPENAI_MODEL || defaultModel;
console.log('🤖 AI Model configured:', AI_MODEL);
console.log('🌐 Base URL:', baseURL);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Load billing codes from CSV
let billingCodes = [];
let codeIndex = new Map();

function loadBillingCodes() {
  try {
    const csvPath = path.join(__dirname, '..', 'Codes by class.csv');
    console.log('Loading CSV from:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith(',,,')) continue;
      
      // Simple CSV parsing (handle quoted fields)
      const parts = parseCSVLine(line);
      if (parts.length < 2) continue;
      
      const code = parts[0]?.trim();
      const description = parts[1]?.trim();
      const howToUse = parts[2]?.trim() || '';
      const amountStr = parts[3]?.trim() || '';
      
      if (!code || !description || code === 'Code' || code.toLowerCase().includes('code')) continue;
      
      const amount = parseAmount(amountStr);
      const category = categorizeCode(code);
      
      billingCodes.push({
        code,
        description,
        howToUse,
        amount,
        category,
        timeOfDay: extractTimeOfDay(howToUse)
      });
      
      // Build search index
      const keywords = extractKeywords(code, description, howToUse);
      keywords.forEach(keyword => {
        if (!codeIndex.has(keyword)) {
          codeIndex.set(keyword, []);
        }
        codeIndex.get(keyword).push(billingCodes.length - 1);
      });
    }
    
    console.log(`✅ Loaded ${billingCodes.length} billing codes`);
    console.log(`✅ Built search index with ${codeIndex.size} keywords`);
  } catch (error) {
    console.error('❌ Failed to load billing codes:', error.message);
    throw error;
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseAmount(amountStr) {
  if (!amountStr) return 0;
  const cleanAmount = amountStr.replace(/[$,CAD]/g, '').trim();
  const match = cleanAmount.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

function categorizeCode(code) {
  if (code.startsWith('A')) return 'Assessment';
  if (code.startsWith('H')) return 'Emergency';
  if (code.startsWith('G')) return 'Procedure';
  if (code.startsWith('K')) return 'Consultation';
  if (code.startsWith('E')) return 'Premium';
  if (code.startsWith('Z')) return 'Surgery';
  if (code.startsWith('R')) return 'Repair';
  if (code.startsWith('F')) return 'Fracture';
  if (code.startsWith('D')) return 'Dislocation';
  if (code.startsWith('B')) return 'Telemedicine';
  if (code.startsWith('M')) return 'Major Surgery';
  if (code.startsWith('P')) return 'Obstetrics';
  return 'Other';
}

function extractTimeOfDay(howToUse) {
  if (!howToUse) return undefined;
  if (/Mon-Fri 0800-1700/i.test(howToUse)) return 'Day';
  if (/Mon-Fri 1700-0000/i.test(howToUse)) return 'Evening';
  if (/Weekend|Holiday/i.test(howToUse)) return 'Weekend';
  if (/Night|0000-0800/i.test(howToUse)) return 'Night';
  return undefined;
}

function extractKeywords(code, description, howToUse) {
  const keywords = new Set();
  keywords.add(code.toLowerCase());
  
  const text = (description + ' ' + howToUse).toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 2);
  words.forEach(word => keywords.add(word.replace(/[^\w]/g, '')));
  
  return Array.from(keywords);
}

// Advanced Search Algorithm (No AI required)
function searchCodes(query, filters = {}) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  // Scoring weights
  const WEIGHTS = {
    EXACT_PHRASE: 100,
    TITLE_MATCH: 50,
    KEYWORD_MATCH: 10,
    CATEGORY_MATCH: 5,
    PENALTY: -50
  };

  const results = billingCodes.map((code, idx) => {
    let score = 0;
    let reasons = [];

    const codeTitle = (code.description || '').toLowerCase();
    const codeUse = (code.howToUse || '').toLowerCase();
    const fullText = `${codeTitle} ${codeUse}`;

    // 1. Exact Phrase Match
    if (fullText.includes(queryLower)) {
      score += WEIGHTS.EXACT_PHRASE;
      reasons.push('Exact phrase match');
    }

    // 2. Keyword Matching with Context
    let matchedWords = 0;
    queryWords.forEach(word => {
      if (codeTitle.includes(word)) {
        score += WEIGHTS.TITLE_MATCH;
        matchedWords++;
      } else if (codeUse.includes(word)) {
        score += WEIGHTS.KEYWORD_MATCH;
        matchedWords++;
      }
    });

    // 3. Contextual Boosts/Penalties
    // Heart/Cardiac Context
    if (queryLower.includes('heart') || queryLower.includes('cardiac') || queryLower.includes('chest pain') || queryLower.includes('infarction')) {
      if (code.category === 'Emergency' || code.code.startsWith('H')) {
        score += 50; // MASSIVE boost for Emergency assessment codes
        reasons.push('Recommended assessment for cardiac case');
      }
      if (code.description.includes('Critical Care') || code.description.includes('Resuscitation')) {
        score += 40; // High boost for critical care
        reasons.push('Critical care relevant');
      }
      if (code.description.includes('Fracture') || code.description.includes('Suture') || code.description.includes('Cast')) {
        score -= 100; // Hard penalty for unrelated procedures
      }
    }

    // Emergency/Assessment Context - General Boost
    if (code.category === 'Emergency' || code.code.startsWith('H')) {
      score += 25; // Always boost H-codes in ER context
    }

    // 4. Calculate Dynamic Confidence Score
    // Normalize score to 0-1 range (cap at 0.98 to leave room for AI verification)
    let confidence = 0.5; // Base confidence
    
    if (fullText.includes(queryLower)) {
      confidence = 0.95; // Exact phrase match
    } else if (score >= 80) {
      confidence = 0.90; // Strong category + keyword match
    } else if (score >= 50) {
      confidence = 0.80; // Good match
    } else if (score >= 20) {
      confidence = 0.70; // Decent match
    }

    return { 
      code, 
      score, 
      relevanceScore: confidence,
      reason: reasons.join('; ') || 'Keyword match'
    };
  });

  // Filter and Sort
  let filtered = results
    .filter(item => item.score > 10) // Minimum threshold
    .sort((a, b) => b.score - a.score);

  // Return full objects with scores, not just codes
  return filtered.slice(0, 20);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    codesLoaded: billingCodes.length,
    service: 'Simple RAG Billing API'
  });
});

// Search endpoint
app.get('/api/billing/search', (req, res) => {
  try {
    const { q, category, timeOfDay } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }
    
    const results = searchCodes(q, { category, timeOfDay });
    
    res.json({
      success: true,
      codes: results,
      total: results.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI-powered code filtering and ranking
async function filterCodesWithAI(clinicalText, candidateCodes, maxSuggestions = 10) {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔑 Checking API key...');
  console.log('   API Key exists:', !!apiKey);
  console.log('   API Key length:', apiKey ? apiKey.length : 0);
  console.log('   API Key starts with:', apiKey ? apiKey.substring(0, 10) : 'N/A');
  
  if (!apiKey || apiKey === 'your-openrouter-api-key-here' || apiKey.trim() === '') {
    console.warn('⚠️  No OpenAI API key found or using placeholder. Using basic filtering.');
    console.warn('⚠️  API Key value:', apiKey ? 'SET (but may be placeholder)' : 'NOT SET');
    
    // Return the search results directly since they now contain scores and reasons
    return candidateCodes.slice(0, maxSuggestions);
  }

  console.log('🤖 Calling GPT-4o to filter codes...');
  console.log('🤖 Clinical text:', clinicalText.substring(0, 50));
  console.log('🤖 Candidate codes to analyze:', candidateCodes.length);

  try {
    // Prepare code list for AI
    const codeList = candidateCodes.slice(0, 50).map((code, idx) => ({
      index: idx,
      code: code.code,
      description: code.description,
      howToUse: code.howToUse,
      amount: code.amount,
      category: code.category
    }));

    const prompt = `You are a medical billing expert. Analyze the clinical text and select the MOST RELEVANT billing codes.

CLINICAL TEXT: "${clinicalText}"

AVAILABLE BILLING CODES:
${JSON.stringify(codeList, null, 2)}

INSTRUCTIONS:
1. Select ONLY codes that are clinically relevant to the patient's condition
2. For "heart attack" (myocardial infarction), prioritize:
   - Emergency assessment codes (H102, H103, H132, H133, H152, H153)
   - Critical care codes (G521, G523, G522, G395, G391) ONLY if critical care was provided
   - Do NOT include unrelated procedures (e.g., fractures, urinary catheters, NG tubes) unless explicitly mentioned
3. Rank codes by clinical relevance (most relevant first)
4. Provide a brief reason for each selected code
5. Return MAXIMUM ${maxSuggestions} codes

Return a JSON array with this format:
[
  {
    "index": 0,
    "relevanceScore": 0.95,
    "reason": "Emergency assessment code appropriate for heart attack presentation"
  },
  ...
]

ONLY return the JSON array, no other text.`;

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a medical billing expert. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const aiResponse = response.choices[0].message.content.trim();
    console.log('✅ AI Response received:', aiResponse.substring(0, 300));
    
    // Parse AI response (handle markdown code blocks if present)
    let jsonStr = aiResponse;
    if (aiResponse.includes('```json')) {
      jsonStr = aiResponse.split('```json')[1].split('```')[0].trim();
    } else if (aiResponse.includes('```')) {
      jsonStr = aiResponse.split('```')[1].split('```')[0].trim();
    }

    console.log('📝 Parsed JSON string:', jsonStr.substring(0, 200));
    
    let aiSelections;
    try {
      aiSelections = JSON.parse(jsonStr);
    } catch (e) {
      console.error('❌ Failed to parse AI JSON:', e.message);
      console.error('Original JSON string:', jsonStr);
      throw new Error('Invalid JSON from AI');
    }

    if (!Array.isArray(aiSelections)) {
      console.error('❌ AI returned non-array:', typeof aiSelections);
      throw new Error('AI response is not an array');
    }

    console.log(`✅ AI selected ${aiSelections.length} codes`);
    
    // Map AI selections back to codes
    const selectedCodes = aiSelections
      .filter(sel => {
        if (!sel || typeof sel.index !== 'number') return false;
        if (!candidateCodes[sel.index]) {
            console.warn(`⚠️ AI selected invalid index: ${sel.index}`);
            return false;
        }
        return true;
      })
      .map(sel => ({
        code: candidateCodes[sel.index],
        relevanceScore: sel.relevanceScore || 0.8,
        reason: sel.reason || 'AI-selected based on clinical relevance'
      }))
      .slice(0, maxSuggestions);

    return selectedCodes.length > 0 ? selectedCodes : candidateCodes.slice(0, maxSuggestions).map(code => ({
      code,
      relevanceScore: 0.6,
      reason: 'Fallback: basic match'
    }));

  } catch (error) {
    console.error('❌ AI filtering error:', error.message);
    console.error('❌ Error stack:', error.stack);
    // Fallback to basic filtering without crashing
    return candidateCodes.slice(0, maxSuggestions).map(code => ({
      code,
      relevanceScore: 0.6,
      reason: `AI unavailable (${error.message}), using basic match`
    }));
  }
}

// Generate AI explanation
async function generateExplanation(clinicalText, optimizations, revenueAnalysis) {
  if (!process.env.OPENAI_API_KEY) {
    return `Based on the clinical text, I found ${optimizations.length} relevant billing codes. The total potential revenue is $${revenueAnalysis.revenueIncrease.toFixed(2)} CAD.`;
  }

  try {
    const prompt = `You are a medical billing expert. Explain the billing code recommendations for this clinical case.

CLINICAL TEXT: "${clinicalText}"

RECOMMENDED CODES:
${optimizations.slice(0, 5).map((opt, idx) => 
  `${idx + 1}. ${opt.suggestedCode.code} - ${opt.suggestedCode.description} ($${opt.revenueImpact.toFixed(2)})`
).join('\n')}

TOTAL REVENUE: $${revenueAnalysis.revenueIncrease.toFixed(2)} CAD

Provide a clear, concise explanation (2-3 sentences) covering:
1. Why these codes are appropriate for this clinical presentation
2. Key documentation requirements
3. Any important billing considerations

Keep it professional and brief.`;

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a medical billing expert providing clear, accurate explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 300
    });

    return response.choices[0].message.content.trim();

  } catch (error) {
    console.error('Explanation generation error:', error.message);
    return `Based on the clinical text, I found ${optimizations.length} relevant billing codes. The total potential revenue is $${revenueAnalysis.revenueIncrease.toFixed(2)} CAD.`;
  }
}

// Analyze endpoint (AI-powered)
app.post('/api/billing/analyze', async (req, res) => {
  try {
    const { clinicalText, encounterType = 'Emergency', timeOfDay, maxSuggestions = 10 } = req.body;
    
    if (!clinicalText) {
      return res.status(400).json({
        success: false,
        error: 'Clinical text is required'
      });
    }
    
    console.log('🔍 Analyzing clinical text:', clinicalText.substring(0, 100));
    console.log('🤖 Using AI model:', AI_MODEL);
    console.log('🔑 API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('🔑 API Key starts with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 15) + '...' : 'NOT SET');
    
    // Step 1: Get candidate codes using improved search
    // searchCodes now returns objects with { code, score, relevanceScore, reason }
    const searchResults = searchCodes(clinicalText, { timeOfDay });
    console.log(`📋 Found ${searchResults.length} candidate codes`);
    
    // Extract just the codes for AI processing if needed
    const candidateCodes = searchResults.map(r => r.code);
    
    // Step 2: Use AI to filter and rank codes
    // Pass the rich search results to the AI function
    const aiFilteredCodes = await filterCodesWithAI(clinicalText, searchResults, maxSuggestions);
    console.log(`✅ Selected ${aiFilteredCodes.length} codes for response`);
    
    // Step 3: Create optimizations
    const optimizations = aiFilteredCodes.map(item => {
      // Handle both AI result format and direct search result format
      // item could be { code: BillingCode, ... } or { suggestedCode: BillingCode, ... }
      let rawCode = item.code || item.suggestedCode || item;
      
      // If rawCode is still a wrapper (has a .code property that is an object), unwrap it
      if (rawCode.code && typeof rawCode.code === 'object') {
        rawCode = rawCode.code;
      }

      // Ensure we have a valid BillingCode object
      // It must have a 'code' property that is a string
      const billingCode = {
        code: String(rawCode.code || 'UNKNOWN'),
        description: String(rawCode.description || 'Unknown Code'),
        amount: parseFloat(rawCode.amount || 0),
        category: String(rawCode.category || 'Other'),
        timeOfDay: rawCode.timeOfDay ? String(rawCode.timeOfDay) : undefined,
        howToUse: String(rawCode.howToUse || '')
      };

      const reason = String(item.reason || rawCode.reason || 'Relevant clinical match');
      const confidence = parseFloat(item.relevanceScore || item.confidence || 0.7);
      
      return {
        suggestedCode: billingCode,
        reason: reason,
        revenueImpact: billingCode.amount,
        confidence: isNaN(confidence) ? 0.7 : confidence,
        riskLevel: billingCode.amount > 200 ? 'MEDIUM' : 'LOW',
        documentation: [
          'Document clinical findings',
          'Document time of encounter',
          billingCode.category === 'Procedure' ? 'Document procedure performed' : null,
          billingCode.category === 'Emergency' ? 'Document emergency presentation' : null
        ].filter(Boolean)
      };
    });
    
    // Calculate revenue
    const potentialRevenue = optimizations.reduce((sum, opt) => sum + opt.revenueImpact, 0);
    
    // Generate AI explanation
    const explanation = await generateExplanation(clinicalText, optimizations, {
      revenueIncrease: potentialRevenue
    });
    
    const analysis = {
      query: { clinicalText, encounterType, timeOfDay },
      suggestedCodes: optimizations.map(opt => opt.suggestedCode),
      optimizations,
      revenueAnalysis: {
        currentRevenue: 0,
        potentialRevenue,
        revenueIncrease: potentialRevenue,
        percentageIncrease: 0
      },
      riskAssessment: {
        overallRisk: optimizations.some(opt => opt.riskLevel === 'HIGH') ? 'MEDIUM' : 'LOW',
        riskFactors: [],
        complianceScore: 85
      },
      documentation: {
        required: ['Document clinical findings'],
        recommended: ['Document time of encounter'],
        missing: []
      },
      explanation: explanation,
      confidence: optimizations.length > 0 
        ? optimizations.reduce((sum, opt) => sum + opt.confidence, 0) / optimizations.length 
        : 0.5
    };
    
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Quick searches
app.get('/api/billing/quick-searches', (req, res) => {
  res.json({
    success: true,
    quickSearches: [
      { title: 'Emergency Codes', description: 'Emergency department codes', searchQuery: 'emergency', category: 'Emergency' },
      { title: 'Assessment Codes', description: 'Assessment and evaluation codes', searchQuery: 'assessment', category: 'Assessment' },
      { title: 'Procedure Codes', description: 'Procedure and surgery codes', searchQuery: 'procedure', category: 'Procedure' },
      { title: 'High-Value Codes', description: 'Codes with high reimbursement', searchQuery: '', category: '', minAmount: 100 }
    ]
  });
});

// Recent codes (empty for now)
app.get('/api/billing/recent-codes', (req, res) => {
  res.json({
    success: true,
    recentCodes: []
  });
});

// Start server
console.log('🚀 Starting Simple RAG Billing Server...');
console.log('📂 Loading billing codes from CSV...');

try {
  loadBillingCodes();
  
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔍 Search: http://localhost:${PORT}/api/billing/search?q=emergency`);
    console.log(`🤖 Analyze: POST http://localhost:${PORT}/api/billing/analyze`);
    console.log(`\n💡 Ready to process billing code requests!`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

