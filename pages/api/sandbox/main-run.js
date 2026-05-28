import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { getRepoById, upsertRepo } from '../../../lib/repos';
import { writeFileToContainer } from '../../../lib/container';
import { runContainerPipeline } from '../../../lib/executor';

const CONTAINER_STORE = path.join(process.cwd(), 'scratch', 'containers');

function resolveWorkspace(containerId) {
  const base = path.resolve(CONTAINER_STORE);
  const target = path.resolve(base, containerId, 'workspace');

  if (!target.startsWith(base + path.sep)) {
    throw new Error('Invalid sandbox path.');
  }

  if (!fs.existsSync(target)) {
    throw new Error('Sandbox workspace does not exist.');
  }

  return target;
}

function listChangedFiles(workspacePath) {
  try {
    const output = execFileSync('git', ['status', '--porcelain'], {
      cwd: workspacePath,
      encoding: 'utf-8',
      windowsHide: true
    });

    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.slice(2).trim().replace(/^"|"$/g, ''))
      .filter(Boolean);
  } catch (_) {
    const fallback = ['index.js', 'src/index.js', 'app.js', 'main.py'];
    return fallback.filter((file) => fs.existsSync(path.join(workspacePath, file)));
  }
}

function safeReadChangedFile(workspacePath, relativePath) {
  const resolved = path.resolve(workspacePath, relativePath);
  if (!resolved.startsWith(workspacePath + path.sep)) {
    throw new Error(`Refusing to read path outside sandbox: ${relativePath}`);
  }

  const stat = fs.statSync(resolved);
  if (!stat.isFile()) {
    return null;
  }

  if (stat.size > 1024 * 1024) {
    throw new Error(`Changed file is too large to promote through this gate: ${relativePath}`);
  }

  return fs.readFileSync(resolved, 'utf-8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { repoId, sandboxId } = req.body || {};

    if (!repoId || !sandboxId) {
      return res.status(400).json({ error: 'repoId and sandboxId are required.' });
    }

    const repo = getRepoById(repoId);
    if (!repo || !repo.containerId) {
      return res.status(404).json({ error: 'Repository container not found.' });
    }

    const sandboxWorkspace = resolveWorkspace(sandboxId);
    const changedFiles = listChangedFiles(sandboxWorkspace);

    if (changedFiles.length === 0) {
      return res.status(400).json({ error: 'No reviewed sandbox changes detected for main pipeline run.' });
    }

    for (const filePath of changedFiles) {
      const content = safeReadChangedFile(sandboxWorkspace, filePath);
      if (content !== null) {
        writeFileToContainer(repo.containerId, filePath, content);
      }
    }

    const result = await runContainerPipeline(repo.containerId, ['install', 'build', 'test']);

    repo.lastMainRun = {
      runId: result.runId,
      status: result.status,
      time: result.endTime,
      promotedFromSandbox: sandboxId,
      changedFiles
    };
    upsertRepo(repo);

    return res.status(200).json({
      ...result,
      changedFiles
    });
  } catch (err) {
    console.error('[Sandbox Main Pipeline API Error]:', err);
    return res.status(500).json({ error: `Main repo pipeline failed: ${err.message}` });
  }
}
