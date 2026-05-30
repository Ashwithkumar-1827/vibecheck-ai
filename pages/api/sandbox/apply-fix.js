import { readFileFromContainer, writeFileToContainer } from '../../../lib/container';
import { resilientReplace } from '../../../lib/patcher';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { sandboxId, filePath, originalCode, patchedCode, patches } = req.body;
    if (!sandboxId) {
      return res.status(400).json({ error: "sandboxId is required" });
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
        console.warn(`[Sandbox Apply Fix] Patcher failed for ${patch.filePath}: ${patchErr.message}. Attempting direct write fallback...`);
        // Direct write fallback: use the AI's patchedCode as the full file content
        try {
          writeFileToContainer(sandboxId, patch.filePath, patch.patchedCode);
          results.push({ filePath: patch.filePath, success: true, fallback: true });
          console.log(`[Sandbox Apply Fix] Direct write fallback succeeded for ${patch.filePath}`);
        } catch (writeErr) {
          results.push({ filePath: patch.filePath, success: false, error: writeErr.message });
        }
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
