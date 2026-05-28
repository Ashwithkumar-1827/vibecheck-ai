const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:3000/api/github/callback';

/**
 * Constructs the GitHub OAuth redirect URL
 */
function getAuthUrl() {
  return `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo`;
}

/**
 * Exchanges OAuth authorization code for access token
 */
async function exchangeCodeForToken(code) {
  const url = 'https://github.com/login/oauth/access_token';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to exchange code: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

/**
 * Gets authenticated user profile details
 */
async function getUserProfile(token) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'VibeCheck-AI'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetches repository details from GitHub
 */
async function getRepoMetadata(token, owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'VibeCheck-AI'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repository metadata: ${response.status}`);
  }

  return await response.json();
}

/**
 * Helper to get the default branch sha
 */
async function getRefSha(token, owner, repo, ref) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/${ref}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'VibeCheck-AI'
    }
  });
  if (!response.ok) throw new Error(`Failed to get ref sha: ${response.status}`);
  const data = await response.json();
  return data.object.sha;
}

/**
 * Creates a new git branch on the repository
 */
async function createBranch(token, owner, repo, branchName, fromBranch = 'heads/main') {
  try {
    const baseSha = await getRefSha(token, owner, repo, fromBranch);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VibeCheck-AI'
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      })
    });

    if (!response.ok) {
      const err = await response.json();
      // If branch already exists (422), we can ignore and continue
      if (response.status === 422 && err.message.includes('already exists')) {
        console.log(`[GitHub API] Branch ${branchName} already exists. Reusing it.`);
        return;
      }
      throw new Error(`Failed to create branch: ${response.status} - ${err.message}`);
    }
  } catch (err) {
    console.error(`[GitHub API] Error creating branch:`, err.message);
    throw err;
  }
}

/**
 * Commits a single file modification to a specific branch via GitHub API
 */
async function commitFileToBranch(token, owner, repo, branchName, filePath, fileContent, commitMessage) {
  // First, check if the file already exists on the branch to get its blob sha (required for updates)
  let sha = null;
  try {
    const getFileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VibeCheck-AI'
      }
    });
    if (getFileRes.ok) {
      const fileData = await getFileRes.json();
      sha = fileData.sha;
    }
  } catch (_) {}

  // Update or create file
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'VibeCheck-AI'
    },
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(fileContent).toString('base64'),
      branch: branchName,
      sha: sha || undefined
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Failed to commit file ${filePath}: ${response.status} - ${err.message}`);
  }
}

/**
 * Creates a Pull Request
 */
async function createPullRequest(token, owner, repo, head, base, title, body) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'VibeCheck-AI'
    },
    body: JSON.stringify({
      title,
      body,
      head,
      base
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Failed to create Pull Request: ${response.status} - ${err.message}`);
  }

  return await response.json();
}

/**
 * Writes OAuth token to env file
 */
function storeToken(token) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  const updateEnvValue = (content, key, value) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (content.match(regex)) {
      return content.replace(regex, `${key}="${value}"`);
    } else {
      return content + (content.endsWith('\n') ? '' : '\n') + `${key}="${value}"\n`;
    }
  };

  envContent = updateEnvValue(envContent, 'GITHUB_ACCESS_TOKEN', token);
  process.env.GITHUB_ACCESS_TOKEN = token;
  fs.writeFileSync(envPath, envContent, 'utf-8');
}

/**
 * Removes OAuth token from env file
 */
function removeStoredToken() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  let envContent = fs.readFileSync(envPath, 'utf-8');
  const regex = new RegExp(`^GITHUB_ACCESS_TOKEN=.*$\n?`, 'm');
  envContent = envContent.replace(regex, '');
  delete process.env.GITHUB_ACCESS_TOKEN;
  fs.writeFileSync(envPath, envContent, 'utf-8');
}

module.exports = {
  getAuthUrl,
  exchangeCodeForToken,
  getUserProfile,
  getRepoMetadata,
  createBranch,
  commitFileToBranch,
  createPullRequest,
  storeToken,
  removeStoredToken
};
