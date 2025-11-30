import billingCodes from '../../billing_codes.json';

// Search algorithm
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

    // Calculate Dynamic Confidence
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

  if (filters.category) {
    filtered = filtered.filter(item => item.code.category === filters.category);
  }
  if (filters.timeOfDay) {
    filtered = filtered.filter(item => item.code.timeOfDay === filters.timeOfDay);
  }
  
  return filtered.slice(0, 20).map(item => item.code);
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q');
  const category = url.searchParams.get('category');
  const timeOfDay = url.searchParams.get('timeOfDay');

  if (!q) {
    return new Response(JSON.stringify({ success: false, error: 'Query required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const results = searchCodes(q, { category, timeOfDay });

  return new Response(JSON.stringify({
    success: true,
    codes: results,
    total: results.length
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

