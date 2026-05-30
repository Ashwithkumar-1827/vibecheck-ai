import { removeStoredToken } from '../../../lib/github';
import { getRepos, deleteRepo } from '../../../lib/repos';
import { destroyContainer } from '../../../lib/container';
import { destroySandbox } from '../../../lib/sandbox';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 1. Retrieve all active workspaces and clean them up
    const repos = getRepos();
    console.log(`[GitHub Disconnect] Cleaning up ${repos.length} active workspaces...`);
    
    for (const repo of repos) {
      // Cleanup sandbox if exists
      if (repo.sandboxId) {
        try {
          console.log(`[GitHub Disconnect] Destroying sandbox for workspace: ${repo.id}`);
          await destroySandbox(repo.sandboxId);
        } catch (sandboxErr) {
          console.warn(`[GitHub Disconnect] Failed to destroy sandbox ${repo.sandboxId}: ${sandboxErr.message}`);
        }
      }
      
      // Cleanup Docker container
      if (repo.containerId) {
        try {
          console.log(`[GitHub Disconnect] Destroying container for workspace: ${repo.id}`);
          await destroyContainer(repo.containerId);
        } catch (containerErr) {
          console.warn(`[GitHub Disconnect] Failed to destroy container ${repo.containerId}: ${containerErr.message}`);
        }
      }
      
      // Delete metadata from DB
      try {
        deleteRepo(repo.id);
      } catch (dbErr) {
        console.warn(`[GitHub Disconnect] Failed to delete repo from DB: ${dbErr.message}`);
      }
    }

    // 2. Remove OAuth token
    removeStoredToken();
    
    return res.status(200).json({ 
      success: true, 
      message: "Disconnected from GitHub, and all active workspaces have been cleaned up." 
    });
  } catch (err) {
    console.error('[GitHub Disconnect] Failed:', err);
    return res.status(500).json({ error: "Failed to disconnect" });
  }
}
