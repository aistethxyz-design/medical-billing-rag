export async function onRequest(context) {
  return new Response(JSON.stringify({
    success: true,
    recentCodes: []
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

