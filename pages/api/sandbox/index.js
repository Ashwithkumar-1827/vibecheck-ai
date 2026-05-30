import { createSandbox, destroySandbox, getSandboxDiff } from '../../../lib/sandbox';
import { getWorkspacePath } from '../../../lib/container';
import { buildKnowledgeGraph } from '../../../lib/knowledgeGraph';
import { getRepos, getRepoById, upsertRepo } from '../../../lib/repos';
import { getUserFromRequest } from '../../../lib/session';
import fs from 'fs';
import path from 'path';

const SCRATCH_DIR = path.join(process.cwd(), 'scratch');
const CONTAINER_STORE = path.join(SCRATCH_DIR, 'containers');

export default async function handler(req, res) {
  const username = await getUserFromRequest(req);
  if (!username) {
    return res.status(401).json({ error: "Unauthorized: Please connect GitHub first" });
  }

  if (req.method === 'POST') {
    try {
      const { repoId, containerId } = req.body;
      if (!containerId || !repoId) {
        return res.status(400).json({ error: "repoId and containerId are required" });
      }

      const repo = getRepoById(repoId);
      if (!repo || repo.user !== username) {
        return res.status(404).json({ error: "Repository not found" });
      }

      // Create isolated sandbox
      const sandboxId = await createSandbox(containerId);

      // Save sandbox association to repo db
      repo.sandboxId = sandboxId;
      upsertRepo(repo);

      return res.status(201).json({
        success: true,
        message: "Isolated sandbox environment successfully created",
        sandboxId
      });
    } catch (err) {
      console.error('[Sandbox Create API Error]:', err);
      return res.status(500).json({ error: `Failed to create sandbox: ${err.message}` });
    }
  }

  if (req.method === 'GET') {
    try {
      const { sandboxId } = req.query;
      if (!sandboxId) {
        return res.status(400).json({ error: "sandboxId is required" });
      }

      // Find the repository associated with this sandbox to verify ownership
      const repo = getRepos().find(r => r.sandboxId === sandboxId);
      if (!repo || repo.user !== username) {
        return res.status(404).json({ error: "Sandbox not found" });
      }

      const sandboxPath = path.join(CONTAINER_STORE, sandboxId);
      if (!fs.existsSync(sandboxPath)) {
        return res.status(404).json({ error: "Sandbox container does not exist" });
      }

      // Load metadata
      const metadata = JSON.parse(fs.readFileSync(path.join(sandboxPath, '.metadata.json'), 'utf-8'));
      const workspacePath = getWorkspacePath(sandboxId);

      if (!fs.existsSync(path.join(workspacePath, 'graphify-out', 'graph.json'))) {
        try {
          metadata.knowledgeGraph = buildKnowledgeGraph(workspacePath);
          fs.writeFileSync(path.join(sandboxPath, '.metadata.json'), JSON.stringify(metadata, null, 2));
        } catch (graphErr) {
          metadata.knowledgeGraph = { error: graphErr.message };
        }
      }

      // Generate git diff
      const diff = getSandboxDiff(sandboxId);

      return res.status(200).json({
        id: sandboxId,
        metadata,
        diff,
        knowledgeGraph: metadata.knowledgeGraph || null
      });
    } catch (err) {
      console.error('[Sandbox GET API Error]:', err);
      return res.status(500).json({ error: `Failed to load sandbox details: ${err.message}` });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { sandboxId, repoId } = req.query;
      if (!sandboxId) {
        return res.status(400).json({ error: "sandboxId is required" });
      }

      // Verify ownership before deleting
      if (repoId) {
        const repo = getRepoById(repoId);
        if (!repo || repo.user !== username) {
          return res.status(404).json({ error: "Repository not found" });
        }
      } else {
        const repo = getRepos().find(r => r.sandboxId === sandboxId);
        if (!repo || repo.user !== username) {
          return res.status(404).json({ error: "Sandbox not found" });
        }
      }

      await destroySandbox(sandboxId);

      // Clean reference from repo db
      if (repoId) {
        const repo = getRepoById(repoId);
        if (repo) {
          delete repo.sandboxId;
          upsertRepo(repo);
        }
      }

      return res.status(200).json({ success: true, message: "Sandbox destroyed successfully" });
    } catch (err) {
      console.error('[Sandbox Delete API Error]:', err);
      return res.status(500).json({ error: `Failed to destroy sandbox: ${err.message}` });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
