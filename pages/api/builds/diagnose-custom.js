const db = require('../../../lib/db');
const { diagnosePipeline } = require('../../../lib/openai');

/**
 * POST /api/builds/diagnose-custom
 *
 * Receives custom developer console logs and optional source code.
 * Dynamically runs AI diagnostics (via the Gemini multi-model fallback chain),
 * creates a custom build, saves the proposed patch, and returns the build record.
 */
export default async function handler(req, res) {
  db.initDb();

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { jobName, logOutput, sourceCode } = req.body;

  if (!jobName || !jobName.trim()) {
    return res.status(400).json({ error: "Job/Service name is required." });
  }

  if (!logOutput || !logOutput.trim()) {
    return res.status(400).json({ error: "Console log output is required." });
  }

  try {
    console.log(`[Custom Diagnose API] Triggering AI custom diagnostics for job: "${jobName}"...`);

    // Create the initial build in the DB representing the custom failure.
    // The scenario is marked with "Custom: " to signify client-side copy/download patches.
    const scenarioMarker = `Custom: ${jobName.trim()}`;
    const initialBuild = db.createBuild("FAILED", logOutput, scenarioMarker);

    // Call dynamic AI diagnosis with logs and optional source code
    const diagnosis = await diagnosePipeline(logOutput, sourceCode || '', { isMock: false });

    if (diagnosis.error) {
      // Update build status to FAILED and return the explanation
      db.updateBuildStatus(initialBuild.id, "FAILED");
      return res.status(500).json({
        error: diagnosis.explanation
      });
    }

    // AI generated a patch successfully
    const resolvedPath = diagnosis.filePath || 'healed_file.py';
    
    // Create the patch record associated with this custom build
    db.createPatch(
      initialBuild.id,
      resolvedPath,
      diagnosis.explanation,
      diagnosis.originalCode || '',
      diagnosis.patchedCode || ''
    );

    // Mark build status as PENDING_APPROVAL so the card expands and prompts operator review
    db.updateBuildStatus(initialBuild.id, "PENDING_APPROVAL");

    console.log(`[Custom Diagnose API] Success: Dynamic AI patch created for Custom Build #${initialBuild.id}`);

    const completedBuild = db.getBuildById(initialBuild.id);
    return res.status(200).json(completedBuild);

  } catch (err) {
    console.error("[Custom Diagnose API] Critical failure:", err);
    return res.status(500).json({ error: `Custom AI Diagnosis failed: ${err.message}` });
  }
}
