// ========== PASSWORD HASHING (Web Crypto API) ==========

async function hashPassword(password, salt) {
  if (!salt) {
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    salt = hexEncode(saltBytes);
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + ':' + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = hexEncode(new Uint8Array(hashBuffer));
  return salt + ':' + hash;
}

async function verifyPassword(password, stored) {
  const [salt] = stored.split(':');
  const computed = await hashPassword(password, salt);
  return computed === stored;
}

function hexEncode(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========== HELPERS ==========

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ========== DEFAULT PERMISSIONS ==========

const DEFAULT_PERMISSIONS = {
  admin: ['roster', 'plans', 'notes', 'scouting', 'forms', 'flowcharts', 'techniques', 'users'],
  coach: ['roster', 'plans', 'notes', 'scouting', 'forms', 'flowcharts', 'techniques'],
  player: ['forms'],
};

// ========== KV HELPERS ==========

async function getUsers(env) {
  const data = await env.COACHES_AUTH.get('users', 'json');
  return data || {};
}

async function putUsers(env, users) {
  await env.COACHES_AUTH.put('users', JSON.stringify(users));
}

async function getPermissions(env) {
  const data = await env.COACHES_AUTH.get('permissions', 'json');
  return data || DEFAULT_PERMISSIONS;
}

async function putPermissions(env, permissions) {
  await env.COACHES_AUTH.put('permissions', JSON.stringify(permissions));
}

// ========== AUTH ==========

async function authenticate(request, env) {
  const authorization = request.headers.get('Authorization');
  if (!authorization || !authorization.startsWith('Basic ')) {
    return null;
  }

  const encoded = authorization.slice('Basic '.length);
  const decoded = atob(encoded);
  const colonIdx = decoded.indexOf(':');
  if (colonIdx < 0) return null;

  const username = decoded.slice(0, colonIdx);
  const password = decoded.slice(colonIdx + 1);

  const users = await getUsers(env);
  const user = users[username];
  if (!user) return null;

  const valid = await verifyPassword(password, user.hash);
  if (!valid) return null;

  const permissions = await getPermissions(env);
  return {
    username,
    role: user.role,
    name: user.name,
    permissions: permissions[user.role] || [],
  };
}

function unauthorizedResponse() {
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Coaches Area"' },
  });
}

// ========== PERMISSION HELPERS ==========

// Map save file paths to permission sections
function getSectionForFile(file) {
  if (file === 'hs/roster.json') return 'roster';
  if (file === 'hs/coaches/coaches-data.json') return null; // multiple sections, allow if any data section
  return null;
}

function hasPermission(auth, section) {
  return auth.permissions.includes(section);
}

function hasAnyDataPermission(auth) {
  return ['roster', 'plans', 'notes', 'scouting', 'forms'].some(s => auth.permissions.includes(s));
}

// ========== MAIN HANDLER ==========

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only protect /hs/coaches/ paths
    if (!url.pathname.startsWith('/hs/coaches/')) {
      return fetch(request);
    }

    // Authenticate
    const auth = await authenticate(request, env);
    if (!auth) {
      return unauthorizedResponse();
    }

    // --- API Routes ---

    // Current user info
    if (url.pathname === '/hs/coaches/api/me' && request.method === 'GET') {
      return jsonResponse({
        user: auth.username,
        role: auth.role,
        name: auth.name,
        permissions: auth.permissions,
      });
    }

    // User management (admin only)
    if (url.pathname === '/hs/coaches/api/users') {
      if (!hasPermission(auth, 'users')) {
        return jsonResponse({ ok: false, error: 'Forbidden' }, 403);
      }
      if (request.method === 'GET') return handleListUsers(env);
      if (request.method === 'POST') return handleCreateUser(request, env);
      if (request.method === 'DELETE') return handleDeleteUser(request, env, auth);
      return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
    }

    // Permissions management (admin only)
    if (url.pathname === '/hs/coaches/api/permissions') {
      if (!hasPermission(auth, 'users')) {
        return jsonResponse({ ok: false, error: 'Forbidden' }, 403);
      }
      if (request.method === 'GET') return jsonResponse(await getPermissions(env));
      if (request.method === 'POST') return handleUpdatePermissions(request, env);
      return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
    }

    // Save JSON file
    if (url.pathname === '/hs/coaches/api/save' && request.method === 'POST') {
      // Check permission based on file being saved
      const body = await request.clone().json().catch(() => ({}));
      const section = getSectionForFile(body.file);
      if (section && !hasPermission(auth, section)) {
        return jsonResponse({ ok: false, error: 'Forbidden' }, 403);
      }
      if (!section && !hasAnyDataPermission(auth)) {
        return jsonResponse({ ok: false, error: 'Forbidden' }, 403);
      }
      return handleSave(request, env);
    }

    // Upload binary file
    if (url.pathname === '/hs/coaches/api/upload' && request.method === 'POST') {
      if (auth.role === 'player') {
        return jsonResponse({ ok: false, error: 'Forbidden' }, 403);
      }
      return handleUpload(request, env);
    }

    // Delete file
    if (url.pathname === '/hs/coaches/api/file' && request.method === 'DELETE') {
      if (auth.role === 'player') {
        return jsonResponse({ ok: false, error: 'Forbidden' }, 403);
      }
      return handleDelete(request, env);
    }

    // Pass through to GitHub Pages for page requests
    return fetch(request);
  },
};

// ========== USER MANAGEMENT HANDLERS ==========

async function handleListUsers(env) {
  const users = await getUsers(env);
  // Strip hashes before returning
  const safe = {};
  for (const [username, data] of Object.entries(users)) {
    safe[username] = { role: data.role, name: data.name };
  }
  return jsonResponse(safe);
}

async function handleCreateUser(request, env) {
  try {
    const body = await request.json();
    const { username, password, role, name } = body;

    if (!username || !role || !name) {
      return jsonResponse({ ok: false, error: 'Missing required fields: username, role, name' }, 400);
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return jsonResponse({ ok: false, error: 'Username must be alphanumeric (plus _ and -)' }, 400);
    }

    if (!['admin', 'coach', 'player'].includes(role)) {
      return jsonResponse({ ok: false, error: 'Role must be admin, coach, or player' }, 400);
    }

    const users = await getUsers(env);
    const existing = users[username];

    // Password required for new users, optional for updates
    if (!existing && !password) {
      return jsonResponse({ ok: false, error: 'Password is required for new users' }, 400);
    }

    const hash = password ? await hashPassword(password) : existing.hash;
    users[username] = { hash, role, name };
    await putUsers(env, users);

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500);
  }
}

async function handleDeleteUser(request, env, auth) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return jsonResponse({ ok: false, error: 'Missing username' }, 400);
    }

    if (username === auth.username) {
      return jsonResponse({ ok: false, error: 'Cannot delete yourself' }, 400);
    }

    const users = await getUsers(env);
    if (!users[username]) {
      return jsonResponse({ ok: false, error: 'User not found' }, 404);
    }

    delete users[username];
    await putUsers(env, users);

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500);
  }
}

async function handleUpdatePermissions(request, env) {
  try {
    const body = await request.json();
    // Validate structure: object with role keys mapping to string arrays
    if (typeof body !== 'object' || body === null) {
      return jsonResponse({ ok: false, error: 'Invalid permissions format' }, 400);
    }
    for (const [role, perms] of Object.entries(body)) {
      if (!Array.isArray(perms) || !perms.every(p => typeof p === 'string')) {
        return jsonResponse({ ok: false, error: `Invalid permissions for role: ${role}` }, 400);
      }
    }
    await putPermissions(env, body);
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500);
  }
}

// ========== EXISTING API HANDLERS ==========

const JSON_WHITELIST = ['hs/roster.json', 'hs/coaches/coaches-data.json'];
const UPLOAD_PREFIXES = ['hs/coaches/docs/', 'hs/photos/'];

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

// POST /hs/coaches/api/save
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

// POST /hs/coaches/api/upload
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

// DELETE /hs/coaches/api/file
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
