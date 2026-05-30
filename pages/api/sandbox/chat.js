import { chatWithAI } from '../../../lib/openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { sandboxId, message, history = [], context = {} } = req.body || {};

    if (!sandboxId || typeof sandboxId !== 'string') {
      return res.status(400).json({ error: 'sandboxId is required.' });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (message.length > 4000) {
      return res.status(413).json({ error: 'Message is too large.' });
    }

    const cleanHistory = Array.isArray(history)
      ? history
          .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
          .slice(-8)
          .map((item) => ({ role: item.role, content: item.content.slice(0, 4000) }))
      : [];

    const buildContext = {
      logOutput: String(context.logOutput || '').slice(-16000),
      explanation: `${String(context.explanation || '')}\n\nRepository graph context: ${String(context.graphSummary || '')}`.trim(),
      filePath: String(context.filePath || ''),
      originalCode: String(context.originalCode || ''),
      patchedCode: String(context.patchedCode || '')
    };

    const result = await chatWithAI(buildContext, message.trim(), cleanHistory);

    return res.status(200).json({
      sandboxId,
      reply: typeof result === 'string' ? result : result.reply,
      modifyCode: result.modifyCode || false,
      originalCode: result.originalCode || '',
      patchedCode: result.patchedCode || ''
    });
  } catch (err) {
    console.error('[Sandbox Chat API Error]:', err);
    return res.status(500).json({ error: `Failed to answer sandbox question: ${err.message}` });
  }
}
