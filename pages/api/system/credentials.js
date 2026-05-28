const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  const envPath = path.join(process.cwd(), '.env');

  if (req.method === 'GET') {
    try {
      const hasOpenAi = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE';
      const hasGemini = !!process.env.GEMINI_API_KEY;
      
      let oMasked = '';
      if (hasOpenAi) {
        const key = process.env.OPENAI_API_KEY;
        oMasked = key.length > 8 ? `${key.slice(0, 7)}...${key.slice(-4)}` : 'sk-...configured';
      }
      
      let gMasked = '';
      if (hasGemini) {
        const key = process.env.GEMINI_API_KEY;
        gMasked = key.length > 8 ? `${key.slice(0, 7)}...${key.slice(-4)}` : 'AIzaSy...configured';
      }
      
      return res.status(200).json({
        openai_configured: hasOpenAi,
        gemini_configured: hasGemini,
        openai_masked: oMasked,
        gemini_masked: gMasked
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch credentials status" });
    }
  }

  if (req.method === 'POST') {
    try {
      const { openaiKey, geminiKey } = req.body;
      
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

      if (openaiKey !== undefined) {
        envContent = updateEnvValue(envContent, 'OPENAI_API_KEY', openaiKey);
        process.env.OPENAI_API_KEY = openaiKey;
      }
      if (geminiKey !== undefined) {
        envContent = updateEnvValue(envContent, 'GEMINI_API_KEY', geminiKey);
        process.env.GEMINI_API_KEY = geminiKey;
      }

      fs.writeFileSync(envPath, envContent, 'utf-8');
      
      return res.status(200).json({ success: true, message: "Credentials successfully updated in .env" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to update credentials" });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
