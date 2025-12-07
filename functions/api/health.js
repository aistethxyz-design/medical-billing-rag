export async function onRequest(context) {
  return new Response(JSON.stringify({
    status: 'healthy',
    message: 'Cloudflare Pages Functions are working!',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

