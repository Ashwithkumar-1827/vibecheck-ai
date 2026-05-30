import { exchangeCodeForToken } from '../../../lib/github';
import { setGitHubCookie } from '../../../lib/session';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { code } = req.query;

  if (!code) {
    return res.redirect('/console/repositories?github_error=missing_code');
  }

  try {
    const token = await exchangeCodeForToken(code);
    setGitHubCookie(res, token);
    return res.redirect('/console/repositories?github=connected');
  } catch (err) {
    console.error('[OAuth Callback Error] Exchange failed:', err.message);
    return res.redirect(`/console/repositories?github_error=${encodeURIComponent(err.message)}`);
  }
}
