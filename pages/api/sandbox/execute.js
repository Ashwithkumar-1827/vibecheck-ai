import { runContainerPipeline } from '../../../lib/executor';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { sandboxId } = req.body;
    if (!sandboxId) {
      return res.status(400).json({ error: "Sandbox container ID is required" });
    }

    // Execute the test stages inside the sandbox container!
    const result = await runContainerPipeline(sandboxId, ['install', 'build', 'test']);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Sandbox Run API Error]:', err);
    return res.status(500).json({ error: `Sandbox execution failed: ${err.message}` });
  }
}
