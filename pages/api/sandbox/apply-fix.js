import { readFileFromContainer, writeFileToContainer } from '../../../lib/container';
import { resilientReplace } from '../../../lib/patcher';
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

    const { sandboxId, filePath, originalCode, patchedCode, patches } = req.body;
    if (!sandboxId) {
      return res.status(400).json({ error: "sandboxId is required" });
    }

    // Verify ownership of the sandbox
    const repo = getRepos().find(r => r.sandboxId === sandboxId);
    if (!repo || repo.user !== username) {
      return res.status(404).json({ error: "Sandbox not found" });
    }

    const patchesToApply = Array.isArray(patches)
      ? patches
      : [{ filePath, originalCode, patchedCode }];

    if (patchesToApply.length === 0 || !patchesToApply[0].filePath) {
      return res.status(400).json({ error: "Missing required patch parameters" });
    }

    const results = [];

    for (const patch of patchesToApply) {
      if (!patch.filePath || !patch.originalCode || !patch.patchedCode) {
        continue;
      }
      
      console.log(`[Sandbox Apply Fix] Applying patch to ${patch.filePath} inside sandbox ${sandboxId}...`);

      // 1. Read existing content from sandbox container
      const originalContent = readFileFromContainer(sandboxId, patch.filePath);
      if (!originalContent) {
        results.push({ filePath: patch.filePath, success: false, error: 'File not found in sandbox workspace' });
        continue;
      }

      try {
        // 2. Perform resilient fuzzy patch
        const patchedContent = resilientReplace(originalContent, patch.originalCode, patch.patchedCode);

        // 3. Save modified content inside container
        writeFileToContainer(sandboxId, patch.filePath, patchedContent);
        results.push({ filePath: patch.filePath, success: true });
      } catch (patchErr) {
        console.warn(`[Sandbox Apply Fix] Patcher failed for ${patch.filePath}: ${patchErr.message}. Patch could not be safely matched to file contents.`);
        results.push({ filePath: patch.filePath, success: false, error: `Patch match failed: ${patchErr.message}. File was NOT modified to prevent corruption. Please review the patch or re-run diagnosis.` });
      }
    }

    const failedCount = results.filter(r => !r.success).length;
    if (failedCount > 0) {
      console.warn(`[Sandbox Apply Fix] ${failedCount} of ${results.length} patches had issues.`);
    } else {
      console.log(`[Sandbox Apply Fix] All ${results.length} patches successfully written to sandbox!`);
    }

    return res.status(200).json({
      success: failedCount === 0,
      message: failedCount === 0 
        ? `All ${results.length} patches successfully applied in sandbox` 
        : `${results.length - failedCount} of ${results.length} patches applied (${failedCount} had issues)`,
      results
    });
  } catch (err) {
    console.error('[Sandbox Apply Fix Error]:', err.message);
    return res.status(500).json({ error: `Failed to apply sandbox patches: ${err.message}` });
  }
}
