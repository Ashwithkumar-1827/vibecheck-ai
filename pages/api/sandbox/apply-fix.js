import { readFileFromContainer, writeFileToContainer } from '../../../lib/container';
import { resilientReplace } from '../../../lib/patcher';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { sandboxId, filePath, originalCode, patchedCode } = req.body;
    if (!sandboxId || !filePath || !originalCode || !patchedCode) {
      return res.status(400).json({ error: "Missing required parameters (sandboxId, filePath, originalCode, patchedCode)" });
    }

    console.log(`[Sandbox Apply Fix] Applying patch to ${filePath} inside sandbox ${sandboxId}...`);

    // 1. Read existing content from sandbox container
    const originalContent = readFileFromContainer(sandboxId, filePath);
    if (!originalContent) {
      return res.status(404).json({ error: `File ${filePath} not found inside sandbox workspace` });
    }

    // 2. Perform resilient fuzzy patch
    const patchedContent = resilientReplace(originalContent, originalCode, patchedCode);

    // 3. Save modified content inside container
    writeFileToContainer(sandboxId, filePath, patchedContent);

    console.log(`[Sandbox Apply Fix] Patch successfully written to sandbox!`);

    return res.status(200).json({
      success: true,
      message: "Patch successfully applied in sandbox",
      filePath
    });
  } catch (err) {
    console.error('[Sandbox Apply Fix Error]:', err.message);
    return res.status(500).json({ error: `Failed to apply sandbox patch: ${err.message}` });
  }
}
