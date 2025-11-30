import billingCodes from '../../billing_codes.json';

// Reuse search algorithm
function searchCodes(query, filters = {}) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const WEIGHTS = {
    EXACT_PHRASE: 100,
    TITLE_MATCH: 50,
    KEYWORD_MATCH: 10,
    CATEGORY_MATCH: 5,
    PENALTY: -50
  };

  const results = billingCodes.map((code) => {
    let score = 0;
    let reasons = [];

    const codeTitle = (code.description || '').toLowerCase();
    const codeUse = (code.howToUse || '').toLowerCase();
    const fullText = `${codeTitle} ${codeUse}`;

    if (fullText.includes(queryLower)) {
      score += WEIGHTS.EXACT_PHRASE;
      reasons.push('Exact phrase match');
    }

    queryWords.forEach(word => {
      if (codeTitle.includes(word)) {
        score += WEIGHTS.TITLE_MATCH;
      } else if (codeUse.includes(word)) {
        score += WEIGHTS.KEYWORD_MATCH;
      }
    });

    if (queryLower.includes('heart') || queryLower.includes('cardiac') || queryLower.includes('chest pain') || queryLower.includes('infarction')) {
      if (code.category === 'Emergency' || code.code.startsWith('H')) {
        score += 50;
        reasons.push('Recommended assessment for cardiac case');
      }
      if (code.description.includes('Critical Care') || code.description.includes('Resuscitation')) {
        score += 40;
        reasons.push('Critical care relevant');
      }
      if (code.description.includes('Fracture') || code.description.includes('Suture') || code.description.includes('Cast')) {
        score -= 100;
      }
    }

    if (code.category === 'Emergency' || code.code.startsWith('H')) {
      score += 25;
    }

    let confidence = 0.5;
    if (fullText.includes(queryLower)) {
      confidence = 0.95;
    } else if (score >= 80) {
      confidence = 0.90;
    } else if (score >= 50) {
      confidence = 0.80;
    } else if (score >= 20) {
      confidence = 0.70;
    }

    return { 
      code, 
      score, 
      relevanceScore: confidence,
      reason: reasons.join('; ') || 'Keyword match'
    };
  });

  let filtered = results
    .filter(item => item.score > 10)
    .sort((a, b) => b.score - a.score);

  return filtered.slice(0, 20); // Return full objects
}

async function filterCodesWithAI(clinicalText, candidateCodes, env) {
  const apiKey = env.OPENAI_API_KEY;
  const baseURL = env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = env.OPENAI_MODEL || 'openai/gpt-4o';

  if (!apiKey) {
    return candidateCodes;
  }

  try {
    const codeList = candidateCodes.slice(0, 50).map((item, idx) => ({
      index: idx,
      code: item.code.code,
      description: item.code.description,
      category: item.code.category
    }));

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://aisteth.xyz',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a medical billing expert. Analyze the clinical text and select the MOST RELEVANT billing codes. Return JSON array.'
          },
          {
            role: 'user',
            content: `CLINICAL TEXT: "${clinicalText}"\n\nAVAILABLE CODES:\n${JSON.stringify(codeList)}\n\nReturn JSON array of objects with {index, relevanceScore, reason}.`
          }
        ]
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.split('```json')[1].split('```')[0].trim();
    }

    const selections = JSON.parse(jsonStr);
    
    return selections.map(sel => {
      const original = candidateCodes[sel.index];
      if (!original) return null;
      return {
        ...original,
        relevanceScore: sel.relevanceScore || original.relevanceScore,
        reason: sel.reason || original.reason
      };
    }).filter(Boolean);

  } catch (error) {
    console.error('AI Error:', error);
    return candidateCodes;
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const { clinicalText, timeOfDay } = body;

    const searchResults = searchCodes(clinicalText, { timeOfDay });
    const aiResults = await filterCodesWithAI(clinicalText, searchResults, env);

    const optimizations = aiResults.map(item => ({
      suggestedCode: item.code,
      reason: item.reason,
      revenueImpact: item.code.amount,
      confidence: item.relevanceScore,
      riskLevel: item.code.amount > 200 ? 'MEDIUM' : 'LOW',
      documentation: ['Document clinical findings']
    }));

    const totalRevenue = optimizations.reduce((sum, opt) => sum + opt.revenueImpact, 0);

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        suggestedCodes: optimizations.map(o => o.suggestedCode),
        optimizations,
        revenueAnalysis: {
          currentRevenue: 0,
          potentialRevenue: totalRevenue,
          revenueIncrease: totalRevenue
        },
        explanation: `Found ${optimizations.length} codes. Potential revenue: $${totalRevenue.toFixed(2)}`,
        documentation: { required: [], recommended: [], missing: [] }
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

