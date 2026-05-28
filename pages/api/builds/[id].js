const db = require('../../../lib/db');

export default async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method === 'GET') {
    try {
      const build = db.getBuildById(id);
      if (!build) {
        return res.status(404).json({ error: `Build #${id} not found` });
      }
      return res.status(200).json(build);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch build details" });
    }
  }
  
  res.setHeader('Allow', ['GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};
