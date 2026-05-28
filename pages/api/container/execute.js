import { getRepoById, upsertRepo } from '../../../lib/repos';
import { runContainerPipeline } from '../../../lib/executor';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { repoId, containerId } = req.body;
    if (!containerId) {
      return res.status(400).json({ error: "Container ID is required" });
    }

    // Load repo metadata
    const repo = getRepoById(repoId);

    // Execute the pipeline stages
    const result = await runContainerPipeline(containerId, ['install', 'build', 'test']);

    // Update repository metadata based on pipeline execution outcome
    if (repo) {
      repo.containerStatus = 'stopped';
      repo.lastRun = {
        runId: result.runId,
        status: result.status,
        time: result.endTime
      };
      upsertRepo(repo);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('[Pipeline Run API Error]:', err);
    return res.status(500).json({ error: `Pipeline run failed: ${err.message}` });
  }
}
