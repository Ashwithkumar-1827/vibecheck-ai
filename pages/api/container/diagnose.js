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

    // Step 1: Pre-read ALL known buggy file sources from analysis.json BEFORE the first AI call
    // This ensures the AI receives every error file's actual code upfront for maximum accuracy.
    const fileSourceMap = {};
    for (const err of analysisErrors) {
      if (err.file && !fileSourceMap[err.file]) {
        const actualSource = readFileFromContainer(containerId, err.file);
        if (actualSource) {
          fileSourceMap[err.file] = actualSource;
        }
      }
    }

    // Build combined source from all known buggy files for the initial diagnosis
    let initialSource = '';
    const preloadedFiles = Object.keys(fileSourceMap);
    if (preloadedFiles.length > 0) {
      for (const filePath of preloadedFiles) {
        initialSource += `\n--- FILE: ${filePath} ---\n${fileSourceMap[filePath]}\n\n`;
      }
      console.log(`[AI Diagnosis] Pre-loaded ${preloadedFiles.length} buggy file source(s) from analysis.json: ${preloadedFiles.join(', ')}`);
    }

    // Step 2: Initial AI diagnosis pass with ALL known buggy file sources included
    let diagnosis = await diagnosePipeline(logs, initialSource, { isMock: false, repoContext });
    
    // Step 3: Self-correcting precision pass: collect any additional file sources from the
    // AI's response that weren't in analysis.json, and run a combined re-diagnosis.
    if (Array.isArray(diagnosis.patches) && diagnosis.patches.length > 0) {
      // Add any new files the AI identified that we haven't read yet
      let hasNewFiles = false;
      for (const patch of diagnosis.patches) {
        if (patch.filePath && !fileSourceMap[patch.filePath]) {
          const actualSource = readFileFromContainer(containerId, patch.filePath);
          if (actualSource) {
            fileSourceMap[patch.filePath] = actualSource;
            hasNewFiles = true;
            console.log(`[AI Diagnosis] Added new file from AI diagnosis: ${patch.filePath}`);
          }
        }
      }

      const filePathsWithSource = Object.keys(fileSourceMap);

      // Only re-run precision pass if we have source files to refine against
      if (filePathsWithSource.length > 0) {
        // Build a combined source code string with ALL buggy files
        let combinedSource = '';
        for (const filePath of filePathsWithSource) {
          combinedSource += `\n--- FILE: ${filePath} ---\n${fileSourceMap[filePath]}\n\n`;
        }
        
        // Run precision pass only if we discovered new files or need to refine
        if (hasNewFiles || filePathsWithSource.length > preloadedFiles.length) {
          console.log(`[AI Diagnosis] Found ${filePathsWithSource.length} total buggy file(s). Running precision pass with ALL file sources...`);
          const preciseDiagnosis = await diagnosePipeline(logs, combinedSource, { isMock: false, repoContext });

          if (preciseDiagnosis && !preciseDiagnosis.error && Array.isArray(preciseDiagnosis.patches) && preciseDiagnosis.patches.length > 0) {
            if (preciseDiagnosis.patches.length >= diagnosis.patches.length) {
              diagnosis.patches = preciseDiagnosis.patches;
            } else {
              // Merge: precise patches override originals for the same file
              const preciseFileMap = {};
              for (const pp of preciseDiagnosis.patches) {
                if (pp.filePath) preciseFileMap[pp.filePath] = pp;
              }
              const mergedPatches = [];
              for (const origPatch of diagnosis.patches) {
                if (origPatch.filePath && preciseFileMap[origPatch.filePath]) {
                  mergedPatches.push(preciseFileMap[origPatch.filePath]);
                  delete preciseFileMap[origPatch.filePath];
                } else {
                  mergedPatches.push(origPatch);
                }
              }
              for (const remaining of Object.values(preciseFileMap)) {
                mergedPatches.push(remaining);
              }
              diagnosis.patches = mergedPatches;
            }
            console.log(`[AI Diagnosis] Precision pass returned ${preciseDiagnosis.patches.length} patch(es). Final merged count: ${diagnosis.patches.length}.`);
          }
        }

        // Step 4: Cross-validate — ensure every file from analysis.json has a patch.
        // If any are missing, run a targeted single-file pass for just those missing files.
        const patchedFiles = new Set(diagnosis.patches.map(p => p.filePath).filter(Boolean));
        const missingFiles = analysisErrors
          .map(e => e.file)
          .filter(f => f && !patchedFiles.has(f) && fileSourceMap[f]);
        const uniqueMissing = [...new Set(missingFiles)];

        if (uniqueMissing.length > 0) {
          console.log(`[AI Diagnosis] Cross-validation: ${uniqueMissing.length} file(s) from analysis.json still missing patches: ${uniqueMissing.join(', ')}. Running targeted passes...`);
          for (const missingFile of uniqueMissing) {
            try {
              const targetedDiag = await diagnosePipeline(logs, fileSourceMap[missingFile], { isMock: false, repoContext });
              if (targetedDiag && !targetedDiag.error) {
                const targetedPatch = Array.isArray(targetedDiag.patches) && targetedDiag.patches[0]
                  ? targetedDiag.patches[0]
                  : targetedDiag;
                if (targetedPatch.originalCode && targetedPatch.patchedCode) {
                  diagnosis.patches.push({
                    filePath: missingFile,
                    explanation: targetedPatch.explanation || '',
                    originalCode: targetedPatch.originalCode,
                    patchedCode: targetedPatch.patchedCode
                  });
                  console.log(`[AI Diagnosis] Targeted pass succeeded for missing file: ${missingFile}`);
                }
              }
            } catch (targetErr) {
              console.warn(`[AI Diagnosis] Targeted pass failed for ${missingFile}: ${targetErr.message}`);
            }
          }
        }

        // Deduplicate patches — keep only the last (most refined) patch per file
        const deduped = new Map();
        for (const patch of diagnosis.patches) {
          if (patch.filePath) {
            deduped.set(patch.filePath, patch);
          }
        }
        diagnosis.patches = [...deduped.values()];
        console.log(`[AI Diagnosis] Final deduplicated patch count: ${diagnosis.patches.length}`);
      }
      
      // Update root-level backward compatible fields from first patch
      if (diagnosis.patches[0]) {
        diagnosis.filePath = diagnosis.patches[0].filePath;
        diagnosis.explanation = diagnosis.patches[0].explanation;
        diagnosis.originalCode = diagnosis.patches[0].originalCode;
        diagnosis.patchedCode = diagnosis.patches[0].patchedCode;
      }
    } else if (diagnosis.filePath && !diagnosis.error) {
      // Legacy single-patch format: try to refine it with actual source
      const actualSource = readFileFromContainer(containerId, diagnosis.filePath);
      if (actualSource) {
        // Also include any analysis.json files not yet covered
        let combinedLegacy = `\n--- FILE: ${diagnosis.filePath} ---\n${actualSource}\n\n`;
        for (const err of analysisErrors) {
          if (err.file && err.file !== diagnosis.filePath && fileSourceMap[err.file]) {
            combinedLegacy += `\n--- FILE: ${err.file} ---\n${fileSourceMap[err.file]}\n\n`;
          }
        }
        
        console.log(`[AI Diagnosis] Legacy format. Re-running precise diagnosis with all known files...`);
        const preciseDiagnosis = await diagnosePipeline(logs, combinedLegacy, { isMock: false, repoContext });
        
        if (preciseDiagnosis && !preciseDiagnosis.error) {
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
