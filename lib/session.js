const { getUserProfile } = require('./github');

// Server-side in-memory cache to map GitHub access tokens to usernames (login)
// This prevents hitting GitHub rate limits on every API request and ensures sub-millisecond lookups.
const userCache = new Map();

/**
 * Extracts the github_token from request cookies
 */
function getGitHubToken(req) {
  if (!req || !req.headers) return null;
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};
  cookieHeader.split(';').forEach(c => {
    const parts = c.split('=');
    if (parts.length === 2) {
      cookies[parts[0].trim()] = parts[1].trim();
    }
  });
  return cookies.github_token || null;
}

/**
 * Resolves the GitHub username (login) for the given request.
 * Returns null if the user is not authenticated or the token is invalid.
 */
async function getUserFromRequest(req) {
  const token = getGitHubToken(req);
  if (!token) return null;

  // Check the in-memory cache first
  if (userCache.has(token)) {
    return userCache.get(token);
  }

  try {
    const profile = await getUserProfile(token);
    if (profile && profile.login) {
      userCache.set(token, profile.login);
      return profile.login;
    }
  } catch (err) {
    console.warn('[Session Manager] Token validation failed:', err.message);
  }
  return null;
}

/**
 * Sets the HttpOnly secure session cookie
 */
function setGitHubCookie(res, token) {
  // A cookie without Max-Age or Expires behaves as a session cookie,
  // which browser vendors automatically wipe when the browser window or tab closes.
  res.setHeader(
    'Set-Cookie',
    `github_token=${token}; Path=/; HttpOnly; SameSite=Lax; Secure`
  );
}

/**
 * Clears the HttpOnly secure session cookie
 */
function clearGitHubCookie(res) {
  res.setHeader(
    'Set-Cookie',
    'github_token=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );
}

module.exports = {
  getGitHubToken,
  getUserFromRequest,
  setGitHubCookie,
  clearGitHubCookie
};
