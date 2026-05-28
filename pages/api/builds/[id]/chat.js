const db = require('../../../../lib/db');
const { chatWithAI } = require('../../../../lib/openai');

/**
 * POST /api/builds/:id/chat
 * 
 * Handles conversational AI chat about a specific build's issue.
 * Accepts: { message: string }
 * Returns: { reply: string, history: [...] }
 * 
 * GET /api/builds/:id/chat
 * Returns the existing chat history for this build.
 */
export default async function handler(req, res) {
  const { id } = req.query; // Build ID

  // GET: Return existing chat history
  if (req.method === 'GET') {
    try {
      const history = db.getChatHistory(id);
      return res.status(200).json({ history });
    } catch (err) {
      console.error('[Chat API] Error fetching chat history:', err);
      return res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  }

  // POST: Send a message and get AI response
  if (req.method === 'POST') {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
      }

      // Load build context
      const build = db.getBuildById(id);
      if (!build) {
        return res.status(404).json({ error: `Build #${id} not found.` });
      }

      // Build context for the AI
      const buildContext = {
        logOutput: build.log_output || '',
        explanation: build.patch?.explanation || '',
        filePath: build.patch?.file_path || '',
        originalCode: build.patch?.original_code || '',
        patchedCode: build.patch?.patched_code || ''
      };

      // Load existing chat history
      const existingHistory = db.getChatHistory(id);
      const chatHistory = existingHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Store the user's message
      db.addChatMessage(id, 'user', message.trim());

      console.log(`[Chat API] Build #${id}: Processing user question: "${message.trim().substring(0, 80)}..."`);

      // Call the AI
      const reply = await chatWithAI(buildContext, message.trim(), chatHistory);

      // Store the AI's response
      db.addChatMessage(id, 'assistant', reply);

      // Return updated history
      const updatedHistory = db.getChatHistory(id);

      console.log(`[Chat API] Build #${id}: AI responded successfully.`);

      return res.status(200).json({
        reply,
        history: updatedHistory
      });
    } catch (err) {
      console.error('[Chat API] Error processing chat message:', err);
      return res.status(500).json({
        error: `Failed to get AI response: ${err.message}`
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
