import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { getRepoById, upsertRepo } from '../../../lib/repos';
import { writeFileToContainer } from '../../../lib/container';
import { runContainerPipeline } from '../../../lib/executor';

const CONTAINER_STORE = path.join(process.cwd(), 'scratch', 'containers');

const IGNORE_COPY = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'coverage',
  '__pycache__', '.venv', 'venv', 'graphify-out', 'logs'
]);

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
    return [];
  }
}

function listAllWorkspaceFiles(workspacePath, rel, result) {
  if (rel === undefined) rel = '';
  if (result === undefined) result = [];

  const full = path.join(workspacePath, rel);
  if (!fs.existsSync(full)) return result;

  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (IGNORE_COPY.has(entry.name)) continue;
    if (entry.name === '.metadata.json') continue;

    const relChild = rel ? (rel + '/' + entry.name) : entry.name;
    const fullChild = path.join(workspacePath, relChild);

    if (entry.isDirectory()) {
      listAllWorkspaceFiles(workspacePath, relChild, result);
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(fullChild);
        if (stat.size <= 1024 * 1024) {
          result.push(relChild);
        }
      } catch (_) {}
    }
  }

  return result;
}

function safeReadChangedFile(workspacePath, relativePath) {
  const resolved = path.resolve(workspacePath, relativePath);
  if (!resolved.startsWith(workspacePath + path.sep)) {
    throw new Error('Refusing to read path outside sandbox: ' + relativePath);
  }

  let stat;
  try {
    stat = fs.statSync(resolved);
  } catch (_) {
    return null;
  }

  if (!stat.isFile()) return null;
  if (stat.size > 1024 * 1024) return null;

  return fs.readFileSync(resolved, 'utf-8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method ' + req.method + ' Not Allowed');
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

    // Try git-tracked changed files first; fall back to full workspace sync
    let changedFiles = listChangedFiles(sandboxWorkspace);
    let syncMode = 'git-diff';

    if (changedFiles.length === 0) {
      changedFiles = listAllWorkspaceFiles(sandboxWorkspace);
      syncMode = 'full-sync';
      console.log('[Main Run] No git changes in sandbox: full workspace sync (' + changedFiles.length + ' files).');
    }

    if (changedFiles.length === 0) {
      return res.status(400).json({ error: 'Sandbox workspace is empty: nothing to verify.' });
    }

    let copiedCount = 0;
    for (const filePath of changedFiles) {
      try {
        const content = safeReadChangedFile(sandboxWorkspace, filePath);
        if (content !== null) {
          writeFileToContainer(repo.containerId, filePath, content);
          copiedCount++;
        }
      } catch (copyErr) {
        console.warn('[Main Run] Skipping ' + filePath + ': ' + copyErr.message);
      }
    }

    console.log('[Main Run] Synced ' + copiedCount + '/' + changedFiles.length + ' files (mode: ' + syncMode + ').');

    const result = await runContainerPipeline(repo.containerId, ['install', 'build', 'test']);

    repo.lastMainRun = {
      runId: result.runId,
      status: result.status,
      time: result.endTime,
      promotedFromSandbox: sandboxId,
      changedFiles,
      syncMode
    };
    upsertRepo(repo);

    return res.status(200).json({
      ...result,
      changedFiles,
      syncMode
    });
  } catch (err) {
    console.error('[Sandbox Main Pipeline API Error]:', err);
    return res.status(500).json({ error: 'Main repo pipeline failed: ' + err.message });
  }
}
