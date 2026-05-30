import { getRepoById, deleteRepo } from '../../../lib/repos';
import { destroyContainer } from '../../../lib/container';
import { getUserFromRequest } from '../../../lib/session';

export default async function handler(req, res) {
  const { id } = req.query;

  const username = await getUserFromRequest(req);
  if (!username) {
    return res.status(401).json({ error: "Unauthorized: Please connect GitHub first" });
  }

  if (req.method === 'GET') {
    try {
      const repo = getRepoById(id);
      if (!repo || repo.user !== username) {
        return res.status(404).json({ error: "Repository not found" });
      }
      return res.status(200).json(repo);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to load repository" });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const repo = getRepoById(id);
      if (!repo || repo.user !== username) {
        return res.status(404).json({ error: "Repository not found" });
      }

      // Cleanup Docker / local filesystem sandbox
      if (repo.containerId) {
        await destroyContainer(repo.containerId);
      }

      // Remove from metadata database
      deleteRepo(id);

      return res.status(200).json({ success: true, message: "Repository successfully removed" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to remove repository" });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
