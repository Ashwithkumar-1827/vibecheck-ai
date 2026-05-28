const db = require('../../../../lib/db');

export default async function handler(req, res) {
  const { id } = req.query; // patch ID
  
  if (req.method === 'POST') {
    try {
      const patch = db.getPatchById(id);
      if (!patch) {
        return res.status(404).json({ error: "Patch not found" });
      }
      
      // Update patch status to REJECTED
      db.updatePatchStatus(id, "REJECTED");
      
      // Mark the build status back to FAILED (from PENDING_APPROVAL) to show approval was dismissed
      db.updateBuildStatus(patch.build_id, "FAILED");
      
      const updatedBuild = db.getBuildById(patch.build_id);
      return res.status(200).json({
        success: true,
        build: updatedBuild
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to reject proposed patch" });
    }
  }
  
  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};
