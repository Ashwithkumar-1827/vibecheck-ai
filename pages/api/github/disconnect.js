import { removeStoredToken } from '../../../lib/github';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    removeStoredToken();
    return res.status(200).json({ success: true, message: "Disconnected from GitHub" });
  } catch (err) {
    console.error('[GitHub Disconnect] Failed:', err);
    return res.status(500).json({ error: "Failed to disconnect" });
  }
}
