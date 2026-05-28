import { getAuthUrl } from '../../../lib/github';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const redirectUrl = getAuthUrl();
  return res.redirect(redirectUrl);
}
