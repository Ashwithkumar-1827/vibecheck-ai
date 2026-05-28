import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const SCRATCH_DIR = path.join(process.cwd(), 'scratch');
const CONTAINER_STORE = path.join(SCRATCH_DIR, 'containers');
const DOWNLOAD_DIR = path.join(SCRATCH_DIR, 'downloads');

function resolveWorkspace(sandboxId) {
  const base = path.resolve(CONTAINER_STORE);
  const workspace = path.resolve(base, sandboxId, 'workspace');

  if (!workspace.startsWith(base + path.sep)) {
    throw new Error('Invalid sandbox path.');
  }

  if (!fs.existsSync(workspace)) {
    throw new Error('Sandbox workspace does not exist.');
  }

  return workspace;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { sandboxId } = req.query;
    if (!sandboxId || typeof sandboxId !== 'string') {
      return res.status(400).json({ error: 'sandboxId is required.' });
    }

    const workspace = resolveWorkspace(sandboxId);
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

    const archiveName = `${sandboxId.replace(/[^a-zA-Z0-9_-]/g, '_')}.tar.gz`;
    const archivePath = path.join(DOWNLOAD_DIR, archiveName);

    execFileSync('tar', ['-czf', archivePath, '-C', workspace, '.'], {
      windowsHide: true
    });

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${archiveName}"`);

    const stream = fs.createReadStream(archivePath);
    stream.on('error', (err) => {
      console.error('[Sandbox Download Stream Error]:', err);
      res.destroy(err);
    });
    stream.pipe(res);
  } catch (err) {
    console.error('[Sandbox Download API Error]:', err);
    return res.status(500).json({ error: `Failed to prepare repository archive: ${err.message}` });
  }
}
