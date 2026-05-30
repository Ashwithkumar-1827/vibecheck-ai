import { getUserProfile } from '../../../lib/github';
import { getGitHubToken, clearGitHubCookie } from '../../../lib/session';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const token = getGitHubToken(req);

  if (!token) {
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
    console.warn('[GitHub Status API] Token invalid or API error. Force-disconnecting session:', err.message);
    clearGitHubCookie(res);
    return res.status(200).json({
      connected: false,
      error: `GitHub session expired: ${err.message}`
    });
  }
}
