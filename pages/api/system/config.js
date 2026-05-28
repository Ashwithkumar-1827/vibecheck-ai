require('dotenv').config();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const hasOpenAiKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE';
    const hasGeminiKey = !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
    
    return res.status(200).json({
      openai_configured: hasOpenAiKey,
      gemini_configured: hasGeminiKey,
      environment: process.env.NODE_ENV || 'development',
      system_time: new Date().toISOString()
    });
  }
  
  res.setHeader('Allow', ['GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};
