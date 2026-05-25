/** SPA fallback for landing (/) and React app (/app/) on Cloudflare Workers. */
export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      return response;
    }

    const url = new URL(request.url);
    const fallback = url.pathname.startsWith('/app')
      ? new URL('/app/index.html', url.origin)
      : new URL('/index.html', url.origin);

    return env.ASSETS.fetch(new Request(fallback, request));
  },
};
