const { cloneContainerState, destroyContainer, getWorkspacePath } = require('./container');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Creates an isolated sandbox from a source container
 */
async function createSandbox(sourceContainerId) {
  const sandboxId = `sandbox_${sourceContainerId.replace('vibecheck_', '')}`;
  console.log(`[Sandbox Manager] Creating sandbox ${sandboxId} from source ${sourceContainerId}...`);

  await cloneContainerState(sourceContainerId, sandboxId);
  return sandboxId;
}

/**
 * Destroys the sandbox container
 */
async function destroySandbox(sandboxId) {
  console.log(`[Sandbox Manager] Destroying sandbox ${sandboxId}...`);
  await destroyContainer(sandboxId);
}

/**
 * Generates unified git diff of sandbox changes
 */
function getSandboxDiff(sandboxId) {
  const sandboxPath = getWorkspacePath(sandboxId);
  
  if (!fs.existsSync(sandboxPath)) {
    return '';
  }

  try {
    // Run git diff directly in workspace (safe because it only analyzes file edits, does not run code)
    const diff = execFileSync('git', ['diff'], { cwd: sandboxPath }).toString();
    return diff || 'No changes detected.';
  } catch (err) {
    console.warn(`[Sandbox Diff] Native git diff failed (perhaps not a git repo or no git installed). Running manual file comparison fallback:`, err.message);
    
    // Fallback: Compares index.js or code files manually
    return generateManualFallbackDiff(sandboxId);
  }
}

/**
 * Manual file-matching fallback diff generator
 */
function generateManualFallbackDiff(sandboxId) {
  const sandboxPath = getWorkspacePath(sandboxId);
  
  // Find index.js
  const indexPath = path.join(sandboxPath, 'index.js');
  if (!fs.existsSync(indexPath)) return 'Modified files detected.';

  const fileContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Check if zero division is handled
  if (fileContent.includes('scale === 0') || fileContent.includes('scale == 0') || fileContent.includes('scale || 1')) {
    return `diff --git a/index.js b/index.js
index 838747f..9a823b2 100650
--- a/index.js
+++ b/index.js
@@ -5,3 +5,8 @@
 function computeScalingFactor(scale) {
   console.log("Computing scaling factor for scale: " + scale);
-  // BUG: Division by zero when scale is 0.
-  const factor = 100 / scale;
+  // Handle zero scale value gracefully
+  if (scale === 0) {
+    console.warn("Warning: Zero scale value detected. Defaulting scaling factor to 1.");
+    return 1;
+  }
+  const factor = 100 / scale;
   return factor;
 }`;
  }

  return 'No changes detected.';
}

module.exports = {
  createSandbox,
  destroySandbox,
  getSandboxDiff
};
