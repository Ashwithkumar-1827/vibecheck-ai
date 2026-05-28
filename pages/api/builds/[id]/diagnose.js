const db = require('../../../../lib/db');
const { diagnosePipeline } = require('../../../../lib/openai');

/**
 * POST /api/builds/:id/diagnose
 *
 * Triggers the AI to diagnose a FAILED build that doesn't have a patch yet.
 * This is called when the user clicks "Run AI Diagnosis" on a failed build.
 * The AI analyzes the logs and generates a patch dynamically.
 */
export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      const build = db.getBuildById(id);
      if (!build) {
        return res.status(404).json({ error: `Build #${id} not found.` });
      }

      if (build.patch) {
        return res.status(200).json({
          message: 'Build already has a diagnosis.',
          build
        });
      }

      if (build.status === 'SUCCESS') {
        return res.status(400).json({ error: 'Cannot diagnose a successful build.' });
      }

      console.log(`[Diagnose API] Triggering AI diagnosis for Build #${id}...`);

      // Call the AI to analyze the logs — fully dynamic, no hardcoded answers
      const diagnosis = await diagnosePipeline(build.log_output);

      if (diagnosis.error) {
        return res.status(500).json({
          error: diagnosis.explanation
        });
      }

      if (diagnosis.filePath) {
        // Store the AI-generated patch
        const patch = db.createPatch(
          id,
          diagnosis.filePath,
          diagnosis.explanation,
          diagnosis.originalCode,
          diagnosis.patchedCode
        );

        // Update build status to PENDING_APPROVAL
        db.updateBuildStatus(id, 'PENDING_APPROVAL');

        console.log(`[Diagnose API] AI Patch stored for Build #${id}. Status updated to PENDING_APPROVAL.`);

        const updatedBuild = db.getBuildById(id);
        return res.status(200).json({ build: updatedBuild });
      }

      return res.status(500).json({ error: 'AI could not generate a patch for this failure.' });
    } catch (err) {
      console.error('[Diagnose API] Error:', err);
      return res.status(500).json({ error: `AI Diagnosis failed: ${err.message}` });
    }
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
