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

    // --- API Routes (all behind auth) ---

    // Save JSON file
    if (url.pathname === '/hs/coaches/api/save' && request.method === 'POST') {
      return handleSave(request, env);
    }

    // Upload binary file
    if (url.pathname === '/hs/coaches/api/upload' && request.method === 'POST') {
      return handleUpload(request, env);
    }

    // Delete file
    if (url.pathname === '/hs/coaches/api/file' && request.method === 'DELETE') {
      return handleDelete(request, env);
    }

    return fetch(request);
  },
};

const JSON_WHITELIST = ['hs/roster.json', 'hs/coaches/coaches-data.json'];
const UPLOAD_PREFIXES = ['hs/coaches/docs/', 'hs/photos/'];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isAllowedUploadPath(path) {
  return UPLOAD_PREFIXES.some(prefix => path.startsWith(prefix)) && !path.includes('..');
}

async function githubAPI(env, endpoint, options = {}) {
  const resp = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'FowlervilleWrestling-Worker',
      ...(options.headers || {}),
    },
  });
  return resp;
}

async function getFileSHA(env, filePath) {
  const resp = await githubAPI(env, filePath);
  if (resp.ok) {
    const data = await resp.json();
    return data.sha;
  }
  return null;
}

// POST /hs/coaches/api/save — Save a JSON file
async function handleSave(request, env) {
  try {
    const body = await request.json();
    const { file, content, message } = body;

    if (!file || !content) {
      return jsonResponse({ ok: false, error: 'Missing file or content' }, 400);
    }

    if (!JSON_WHITELIST.includes(file)) {
      return jsonResponse({ ok: false, error: 'File not allowed' }, 403);
    }

    const sha = await getFileSHA(env, file);
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2) + '\n')));

    const putBody = {
      message: message || `Update ${file}`,
      content: encoded,
    };
    if (sha) putBody.sha = sha;

    const resp = await githubAPI(env, file, {
      method: 'PUT',
      body: JSON.stringify(putBody),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return jsonResponse({ ok: false, error: `GitHub API error: ${resp.status}`, details: err }, 502);
    }

    const result = await resp.json();
    return jsonResponse({ ok: true, sha: result.content.sha });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500);
  }
}

// POST /hs/coaches/api/upload — Upload a binary file
async function handleUpload(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const path = formData.get('path');

    if (!file || !path) {
      return jsonResponse({ ok: false, error: 'Missing file or path' }, 400);
    }

    if (!isAllowedUploadPath(path)) {
      return jsonResponse({ ok: false, error: 'Upload path not allowed' }, 403);
    }

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const encoded = btoa(binary);

    const sha = await getFileSHA(env, path);

    const putBody = {
      message: `Upload ${path.split('/').pop()}`,
      content: encoded,
    };
    if (sha) putBody.sha = sha;

    const resp = await githubAPI(env, path, {
      method: 'PUT',
      body: JSON.stringify(putBody),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return jsonResponse({ ok: false, error: `GitHub API error: ${resp.status}`, details: err }, 502);
    }

    const result = await resp.json();
    return jsonResponse({ ok: true, url: path, sha: result.content.sha });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500);
  }
}

// DELETE /hs/coaches/api/file — Delete a file from the repo
async function handleDelete(request, env) {
  try {
    const body = await request.json();
    const { file } = body;

    if (!file) {
      return jsonResponse({ ok: false, error: 'Missing file path' }, 400);
    }

    if (!isAllowedUploadPath(file)) {
      return jsonResponse({ ok: false, error: 'File path not allowed' }, 403);
    }

    const sha = await getFileSHA(env, file);
    if (!sha) {
      return jsonResponse({ ok: false, error: 'File not found' }, 404);
    }

    const resp = await githubAPI(env, file, {
      method: 'DELETE',
      body: JSON.stringify({
        message: `Delete ${file.split('/').pop()}`,
        sha,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return jsonResponse({ ok: false, error: `GitHub API error: ${resp.status}`, details: err }, 502);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500);
  }
}
