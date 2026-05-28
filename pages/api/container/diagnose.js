import { diagnosePipeline } from '../../../lib/openai';
import { readFileFromContainer, getWorkspacePath } from '../../../lib/container';
import { buildKnowledgeGraph, readKnowledgeContext } from '../../../lib/knowledgeGraph';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { containerId, logs } = req.body;
    if (!containerId || !logs) {
      return res.status(400).json({ error: "Container ID and pipeline logs are required" });
    }

    console.log(`[AI Diagnosis] Running diagnostics for container ${containerId}...`);
    const workspacePath = getWorkspacePath(containerId);
    try {
      buildKnowledgeGraph(workspacePath);
    } catch (graphErr) {
      console.warn(`[AI Diagnosis] Knowledge graph refresh failed: ${graphErr.message}`);
    }
    const repoContext = readKnowledgeContext(workspacePath);

    // Step 1: Initial AI diagnosis pass on logs
    let diagnosis = await diagnosePipeline(logs, '', { isMock: false, repoContext });
    
    // Step 2: Self-healing lookup - read actual file content from container and run precise pass if file exists
    if (diagnosis.filePath && !diagnosis.error) {
      const actualSource = readFileFromContainer(containerId, diagnosis.filePath);
      
      if (actualSource) {
        console.log(`[AI Diagnosis] Found buggy file inside container workspace: ${diagnosis.filePath}. Re-running precise diagnosis pass...`);
        const preciseDiagnosis = await diagnosePipeline(logs, actualSource, { isMock: false, repoContext });
        
        if (preciseDiagnosis && !preciseDiagnosis.error) {
          diagnosis = {
            ...preciseDiagnosis,
            filePath: diagnosis.filePath // maintain file path format
          };
        }
      }
    }

    return res.status(200).json(diagnosis);
  } catch (err) {
    console.error('[AI Diagnosis API Error]:', err);
    return res.status(500).json({ error: `AI Diagnosis failed: ${err.message}` });
  }
}
