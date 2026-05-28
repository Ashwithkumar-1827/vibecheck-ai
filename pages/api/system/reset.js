const fs = require('fs');
const path = require('path');
const { seedInitialData } = require('../../../lib/refresh_usecases');
const { healAll } = require('../../../lib/usecases');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const dbPath = path.join(process.cwd(), 'db.json');
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log(`[Reset] Database deleted successfully for reconstruction.`);
      }
      seedInitialData();
      healAll();
      return res.status(200).json({ success: true, message: "Database reset to seeds and workspace restored to healthy green state successfully. A backup was created." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to reset database" });
    }
  }
  
  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

