export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only protect /hs/coaches/ paths
    if (!url.pathname.startsWith('/hs/coaches/')) {
      return fetch(request);
    }

    const authorization = request.headers.get('Authorization');

    if (!authorization || !authorization.startsWith('Basic ')) {
      return new Response('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Coaches Area"' },
      });
    }

    const encoded = authorization.slice('Basic '.length);
    const decoded = atob(encoded);
    const [user, pass] = decoded.split(':');

    if (user !== env.AUTH_USER || pass !== env.AUTH_PASS) {
      return new Response('Invalid credentials', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Coaches Area"' },
      });
    }

    return fetch(request);
  },
};
