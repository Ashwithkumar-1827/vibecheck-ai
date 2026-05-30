import { getRepos, deleteRepo } from '../../../lib/repos';
import { destroyContainer } from '../../../lib/container';
import { destroySandbox } from '../../../lib/sandbox';
import { getUserFromRequest, clearGitHubCookie } from '../../../lib/session';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const username = await getUserFromRequest(req);
    
    if (username) {
      // 1. Retrieve active workspaces belonging to this user and clean them up
      const repos = getRepos().filter(r => r.user === username);
      console.log(`[GitHub Disconnect] Cleaning up ${repos.length} active workspaces for user ${username}...`);
      
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
        
        // Cleanup container
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
    }

    // 2. Clear secure session cookie
    clearGitHubCookie(res);
    
    return res.status(200).json({ 
      success: true, 
      message: "Disconnected from GitHub, and all active workspaces have been cleaned up." 
    });
  } catch (err) {
    console.error('[GitHub Disconnect] Failed:', err);
    return res.status(500).json({ error: "Failed to disconnect" });
  }
}
