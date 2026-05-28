// API endpoint: POST /api/system/refresh
// Triggers a single append-only use case injection into the database.
// Called by the frontend cron scheduler (setInterval) every 2 hours.
const { refreshUsecases } = require('../../../lib/refresh_usecases');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      refreshUsecases();
      return res.status(200).json({
        success: true,
        message: "A new enterprise failure scenario has been appended to the pipeline."
      });
    } catch (err) {
      console.error("[Refresh API] Error:", err);
      return res.status(500).json({ error: "Failed to refresh use cases" });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
