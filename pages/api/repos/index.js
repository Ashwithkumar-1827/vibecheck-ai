import fs from 'fs';
import path from 'path';
import { getRepos, upsertRepo } from '../../../lib/repos';
import { createContainer } from '../../../lib/container';
import { createSandbox } from '../../../lib/sandbox';
import { getUserFromRequest, getGitHubToken } from '../../../lib/session';

function parseGitHubRepoUrl(repoUrl) {
  const parsed = new URL(repoUrl);
  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'github.com') {
    throw new Error('Only GitHub HTTPS repository URLs are supported');
  }

  const [owner, rawName] = parsed.pathname.split('/').filter(Boolean);
  const name = rawName?.replace(/\.git$/i, '');
  const safeSegment = /^[A-Za-z0-9_.-]+$/;

  if (!owner || !name || !safeSegment.test(owner) || !safeSegment.test(name)) {
    throw new Error('Repository URL must include a valid GitHub owner and repository name');
  }

  return { owner, name };
}

function isSafeGitRef(ref) {
  return typeof ref === 'string' &&
    ref.length > 0 &&
    !ref.includes('..') &&
    !ref.includes('\0') &&
    /^[A-Za-z0-9._/-]+$/.test(ref);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const username = await getUserFromRequest(req);
      if (!username) {
        return res.status(200).json([]);
      }
      const list = getRepos().filter(r => r.user === username);
      return res.status(200).json(list);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to list repositories" });
    }
  }

  if (req.method === 'POST') {
    try {
      const token = getGitHubToken(req);
      const username = await getUserFromRequest(req);
      if (!token || !username) {
        return res.status(401).json({ error: "Unauthorized: Please connect GitHub first" });
      }

      const { url, branch } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Repository URL is required" });
      }

      const targetBranch = branch || 'main';
      if (!isSafeGitRef(targetBranch)) {
        return res.status(400).json({ error: "Invalid git branch name" });
      }

      let repoInfo;
      try {
        repoInfo = parseGitHubRepoUrl(url);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
      const { owner, name } = repoInfo;

      // Create a unique repoId
      const repoId = `repo_${Math.random().toString(36).substring(2, 9)}`;
      
      const newRepo = {
        id: repoId,
        user: username,
        url,
        name,
        owner,
        branch: targetBranch,
        status: 'cloning',
        containerId: null,
        sandboxId: null,
        created: new Date().toISOString(),
        projectType: 'nodejs',
        detection: null
      };

      // Add to database immediately so it shows as "cloning..." in the UI
      upsertRepo(newRepo);

      // Async clone in background to keep API responsive, or wait? Let's run it and return the new object!
      // To prevent frontend timeouts, we can start the container creation.
      // Since container cloning is fast (shallow clone), we can await it or run it in background.
      // Let's run it and await so that the response returns the finished configuration.
      const { containerId, isDocker, metadata } = await createContainer(repoId, url, targetBranch, token);
      const sandboxId = await createSandbox(containerId);

      newRepo.status = 'ready';
      newRepo.containerId = containerId;
      newRepo.sandboxId = sandboxId;
      newRepo.projectType = metadata.projectType;
      newRepo.detection = metadata.detection || null;
      newRepo.knowledgeGraph = metadata.knowledgeGraph || null;
      newRepo.containerStatus = 'running';

      // Check if no pipeline files exist
      const workspacePath = path.join(process.cwd(), 'scratch', 'containers', containerId, 'workspace');
      const hasNoPipeline = !fs.existsSync(workspacePath) || (
        !fs.existsSync(path.join(workspacePath, 'package.json')) &&
        !fs.existsSync(path.join(workspacePath, 'requirements.txt')) &&
        !fs.existsSync(path.join(workspacePath, 'setup.py')) &&
        !fs.existsSync(path.join(workspacePath, 'pom.xml')) &&
        !fs.existsSync(path.join(workspacePath, 'build.gradle')) &&
        !fs.existsSync(path.join(workspacePath, 'azure-pipelines.yml')) &&
        !fs.existsSync(path.join(workspacePath, '.gitlab-ci.yml')) &&
        !fs.existsSync(path.join(workspacePath, 'Jenkinsfile')) &&
        !fs.existsSync(path.join(workspacePath, '.github', 'workflows'))
      );

      if (hasNoPipeline) {
        newRepo.hasNoPipeline = true;
        if (!newRepo.detection) newRepo.detection = {};
        newRepo.detection.hasCICD = false;
      }

      upsertRepo(newRepo);

      return res.status(201).json(newRepo);
    } catch (err) {
      console.error('[Clone API Error]:', err);
      return res.status(500).json({ error: `Failed to clone repository: ${err.message}` });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
