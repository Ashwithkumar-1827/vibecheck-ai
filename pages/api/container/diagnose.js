import { diagnosePipeline } from '../../../lib/openai';
import { readFileFromContainer, getWorkspacePath, getContainerPath } from '../../../lib/container';
import { buildKnowledgeGraph, readKnowledgeContext } from '../../../lib/knowledgeGraph';
import fs from 'fs';
import path from 'path';

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

    // Load analysis.json to get the structured allErrors list
    let analysisErrors = [];
    try {
      const containerPath = getContainerPath(containerId);
      const analysisPath = path.join(containerPath, 'analysis.json');
      if (fs.existsSync(analysisPath)) {
        const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
        if (Array.isArray(analysis.allErrors)) {
          analysisErrors = analysis.allErrors;
          console.log(`[AI Diagnosis] Found ${analysisErrors.length} error(s) in analysis.json across files: ${[...new Set(analysisErrors.map(e => e.file))].join(', ')}`);
        }
      }
    } catch (analysisReadErr) {
      console.warn(`[AI Diagnosis] Could not read analysis.json: ${analysisReadErr.message}`);
    }

    // Step 1: Initial AI diagnosis pass on logs: this MUST return ALL errors at once
    let diagnosis = await diagnosePipeline(logs, '', { isMock: false, repoContext });
    
    // Step 2: Self-correcting precision pass: read ALL buggy file sources from the container
    // and run a SINGLE combined re-diagnosis with all file contents for maximum accuracy.
    if (Array.isArray(diagnosis.patches) && diagnosis.patches.length > 0) {
      // Collect all unique file sources from the container workspace
      const fileSourceMap = {};
      for (const patch of diagnosis.patches) {
        if (patch.filePath && !fileSourceMap[patch.filePath]) {
          const actualSource = readFileFromContainer(containerId, patch.filePath);
          if (actualSource) {
            fileSourceMap[patch.filePath] = actualSource;
          }
        }
      }

      // ALSO read files from analysis.json allErrors that the first AI pass may have missed
      for (const err of analysisErrors) {
        if (err.file && !fileSourceMap[err.file]) {
          const actualSource = readFileFromContainer(containerId, err.file);
          if (actualSource) {
            fileSourceMap[err.file] = actualSource;
            console.log(`[AI Diagnosis] Added file from analysis.json allErrors: ${err.file}`);
          }
        }
      }

      const filePathsWithSource = Object.keys(fileSourceMap);

      if (filePathsWithSource.length > 0) {
        // Build a combined source code string with all buggy files for a SINGLE precise pass
        let combinedSource = '';
        for (const filePath of filePathsWithSource) {
          combinedSource += `\n--- FILE: ${filePath} ---\n${fileSourceMap[filePath]}\n\n`;
        }
        
        console.log(`[AI Diagnosis] Found ${filePathsWithSource.length} buggy file(s) inside container. Running single precise diagnosis pass with ALL file sources...`);

        const preciseDiagnosis = await diagnosePipeline(logs, combinedSource, { isMock: false, repoContext });

        if (preciseDiagnosis && !preciseDiagnosis.error && Array.isArray(preciseDiagnosis.patches) && preciseDiagnosis.patches.length > 0) {
          // Merge: use precise patches where available, keep original patches for files not covered by precise pass
          if (preciseDiagnosis.patches.length >= diagnosis.patches.length) {
            // Precise pass found same or more patches — use them all
            diagnosis.patches = preciseDiagnosis.patches;
          } else {
            // Precise pass returned fewer patches — merge with originals to avoid losing errors
            const preciseFileMap = {};
            for (const pp of preciseDiagnosis.patches) {
              if (pp.filePath) preciseFileMap[pp.filePath] = pp;
            }
            const mergedPatches = [];
            for (const origPatch of diagnosis.patches) {
              if (origPatch.filePath && preciseFileMap[origPatch.filePath]) {
                // Use the refined precise patch for this file
                mergedPatches.push(preciseFileMap[origPatch.filePath]);
                delete preciseFileMap[origPatch.filePath];
              } else {
                mergedPatches.push(origPatch);
              }
            }
            // Add any remaining precise patches for files not in original set
            for (const remaining of Object.values(preciseFileMap)) {
              mergedPatches.push(remaining);
            }
            diagnosis.patches = mergedPatches;
          }
          console.log(`[AI Diagnosis] Precise pass returned ${preciseDiagnosis.patches.length} patch(es). Final merged count: ${diagnosis.patches.length}.`);
        } else {
          // If precise pass failed or returned fewer patches, keep original patches
          // but try to refine each one individually as fallback
          const updatedPatches = [];
          for (const patch of diagnosis.patches) {
            if (patch.filePath && fileSourceMap[patch.filePath]) {
              try {
                const singlePrecise = await diagnosePipeline(logs, fileSourceMap[patch.filePath], { isMock: false, repoContext });
                if (singlePrecise && !singlePrecise.error) {
                  const refinedPatch = Array.isArray(singlePrecise.patches) && singlePrecise.patches[0]
                    ? singlePrecise.patches[0]
                    : singlePrecise;
                  updatedPatches.push({
                    ...patch,
                    originalCode: refinedPatch.originalCode || patch.originalCode,
                    patchedCode: refinedPatch.patchedCode || patch.patchedCode,
                    explanation: refinedPatch.explanation || patch.explanation,
                    filePath: patch.filePath
                  });
                  continue;
                }
              } catch (preciseErr) {
                console.warn(`[AI Diagnosis] Individual precise pass failed for ${patch.filePath}: ${preciseErr.message}`);
              }
            }
            updatedPatches.push(patch);
          }
          diagnosis.patches = updatedPatches;
        }
      }
      
      // Update root-level backward compatible fields from first patch
      if (diagnosis.patches[0]) {
        diagnosis.filePath = diagnosis.patches[0].filePath;
        diagnosis.explanation = diagnosis.patches[0].explanation;
        diagnosis.originalCode = diagnosis.patches[0].originalCode;
        diagnosis.patchedCode = diagnosis.patches[0].patchedCode;
      }
    } else if (diagnosis.filePath && !diagnosis.error) {
      // Legacy single-patch format: try to refine it
      const actualSource = readFileFromContainer(containerId, diagnosis.filePath);
      if (actualSource) {
        console.log(`[AI Diagnosis] Found buggy file inside container workspace: ${diagnosis.filePath}. Re-running precise diagnosis pass...`);
        const preciseDiagnosis = await diagnosePipeline(logs, actualSource, { isMock: false, repoContext });
        
        if (preciseDiagnosis && !preciseDiagnosis.error) {
          // If precise pass found multiple patches, use them all
          if (Array.isArray(preciseDiagnosis.patches) && preciseDiagnosis.patches.length > 0) {
            diagnosis = {
              ...preciseDiagnosis,
              patches: preciseDiagnosis.patches
            };
          } else {
            diagnosis = {
              ...preciseDiagnosis,
              filePath: diagnosis.filePath
            };
          }
        }
      }
    }

    return res.status(200).json(diagnosis);
  } catch (err) {
    console.error('[AI Diagnosis API Error]:', err);
    return res.status(500).json({ error: `AI Diagnosis failed: ${err.message}` });
  }
}
