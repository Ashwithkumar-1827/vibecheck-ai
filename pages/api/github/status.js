import { getUserProfile, removeStoredToken } from '../../../lib/github';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Re-read token from .env file in case it was refreshed after server start
  const fs_env = require('fs');
  const path_env = require('path');
  const envPath = path_env.join(process.cwd(), '.env');
  let token = process.env.GITHUB_ACCESS_TOKEN;
  
  if (fs_env.existsSync(envPath)) {
    const envContent = fs_env.readFileSync(envPath, 'utf-8');
    const tokenMatch = envContent.match(/^GITHUB_ACCESS_TOKEN="?([^"\n]+)"?$/m);
    if (tokenMatch && tokenMatch[1]) {
      token = tokenMatch[1];
      process.env.GITHUB_ACCESS_TOKEN = token;
    }
  }

  if (!token || token === 'YOUR_GITHUB_ACCESS_TOKEN_HERE') {
    return res.status(200).json({ connected: false });
  }

  try {
    const profile = await getUserProfile(token);
    return res.status(200).json({
      connected: true,
      username: profile.login,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url,
      name: profile.name || profile.login
    });
  } catch (err) {
    console.warn('[GitHub Status API] Token invalid or API error. Force-disconnecting token:', err.message);
    removeStoredToken();
    return res.status(200).json({
      connected: false,
      error: `GitHub session expired: ${err.message}`
    });
  }
}
