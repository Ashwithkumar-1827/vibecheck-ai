import { runContainerPipeline } from '../../../lib/executor';
import { getRepos } from '../../../lib/repos';
import { getUserFromRequest } from '../../../lib/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const username = await getUserFromRequest(req);
    if (!username) {
      return res.status(401).json({ error: "Unauthorized: Please connect GitHub first" });
    }

    const { sandboxId } = req.body;
    if (!sandboxId) {
      return res.status(400).json({ error: "Sandbox container ID is required" });
    }

    // Verify ownership of the sandbox
    const repo = getRepos().find(r => r.sandboxId === sandboxId);
    if (!repo || repo.user !== username) {
      return res.status(404).json({ error: "Sandbox not found" });
    }

    // Execute the test stages inside the sandbox container!
    const result = await runContainerPipeline(sandboxId, ['install', 'build', 'test']);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Sandbox Run API Error]:', err);
    return res.status(500).json({ error: `Sandbox execution failed: ${err.message}` });
  }
}
