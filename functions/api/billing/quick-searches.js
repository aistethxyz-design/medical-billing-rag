export async function onRequest(context) {
  const quickSearches = [
    { title: 'Emergency Codes', description: 'Emergency department codes', searchQuery: 'emergency', category: 'Emergency' },
    { title: 'Assessment Codes', description: 'Assessment and evaluation codes', searchQuery: 'assessment', category: 'Assessment' },
    { title: 'Procedure Codes', description: 'Procedure and surgery codes', searchQuery: 'procedure', category: 'Procedure' },
    { title: 'High-Value Codes', description: 'Codes with high reimbursement', searchQuery: '', category: '', minAmount: 100 }
  ];

  return new Response(JSON.stringify({
    success: true,
    quickSearches
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

