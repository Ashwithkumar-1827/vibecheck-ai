import { readFileFromContainer, writeFileToContainer } from '../../../lib/container';
import { resilientReplace } from '../../../lib/patcher';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { containerId, filePath, originalCode, patchedCode } = req.body;
    if (!containerId || !filePath || !originalCode || !patchedCode) {
      return res.status(400).json({ error: "Missing required parameters (containerId, filePath, originalCode, patchedCode)" });
    }

    console.log(`[Apply Fix API] Applying patch to ${filePath} inside container ${containerId}...`);

    // 1. Read existing content from container
    const originalContent = readFileFromContainer(containerId, filePath);
    if (!originalContent) {
      return res.status(404).json({ error: `File ${filePath} not found inside container workspace` });
    }

    // 2. Perform resilient fuzzy patch
    const patchedContent = resilientReplace(originalContent, originalCode, patchedCode);

    // 3. Save modified content inside container
    writeFileToContainer(containerId, filePath, patchedContent);

    console.log(`[Apply Fix API] Patch applied successfully inside container!`);

    return res.status(200).json({
      success: true,
      message: "Patch successfully applied inside container workspace",
      filePath
    });
  } catch (err) {
    console.error('[Apply Fix API Error]:', err.message);
    return res.status(500).json({ error: `Failed to apply patch: ${err.message}` });
  }
}
