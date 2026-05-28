import { exchangeCodeForToken, storeToken } from '../../../lib/github';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { code } = req.query;

  if (!code) {
    return res.redirect('/?github_error=missing_code');
  }

  try {
    const token = await exchangeCodeForToken(code);
    storeToken(token);
    return res.redirect('/?github=connected');
  } catch (err) {
    console.error('[OAuth Callback Error] Exchange failed:', err.message);
    return res.redirect(`/?github_error=${encodeURIComponent(err.message)}`);
  }
}
