const fs = require('fs');
const path = require('path');

// Load environment variables (such as GEMINI_API_KEY from .env)
require('dotenv').config();

// ONLY use Gemini API key as requested by the user
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Core Gemini API caller — sends a prompt and returns the raw text response.
 * Try different free-tier models in priority order to self-heal against 429 quota limits.
 * Used by both diagnosePipeline and chatWithAI.
 */
async function callGemini(systemPrompt, userMessage, options = {}) {
  if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Gemini API key is not configured. Please add your GEMINI_API_KEY in the .env file or via the Settings panel.');
  }

  const { jsonMode = false } = options;

  const body = {
    contents: [{
      parts: [{
        text: `${systemPrompt}\n\n${userMessage}`
      }]
    }]
  };

  if (jsonMode) {
    body.generationConfig = { responseMimeType: 'application/json' };
  }

  // Prioritized list of Gemini free-tier (zero-credit) models.
  // Will try each model in order if a 429 Daily Quota error is hit.
  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-flash-latest'
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    console.log(`[Gemini] Attempting call with model ${model}...`);
    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${geminiKey}`;
    
    const MAX_RETRIES = 2; // For transient rate limits on the same model
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      let response = null;
      let errorText = '';
      let parsedError = {};

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout for large multi-file analysis

        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Gemini API returned an empty or malformed response.');
          }
          console.log(`[Gemini] Call succeeded with model ${model}`);
          return data.candidates[0].content.parts[0].text;
        }

        errorText = await response.text();
        try {
          parsedError = JSON.parse(errorText).error || {};
        } catch (_) {
          parsedError = { message: errorText };
        }

        console.warn(`[Gemini] Model ${model} failed (Attempt ${attempt}/${MAX_RETRIES}): ${response.status} - ${parsedError.message || errorText}`);
        lastError = new Error(`Gemini API error for model ${model}: ${response.status} - ${parsedError.message || errorText}`);
      } catch (err) {
        console.error(`[Gemini] Exception for model ${model} (Attempt ${attempt}/${MAX_RETRIES}):`, err.message);
        lastError = err;

        if (err.name === 'AbortError') {
          console.warn(`[Gemini] Model ${model} timed out (30s). Moving to next model...`);
          break; // Try next model immediately
        }
      }

      // Handle response status failure modes
      if (response) {
        if (response.status === 429) {
          // If it is a daily quota exhaustion limit, fail fast and try next model
          if (errorText.includes('GenerateRequestsPerDay') || errorText.includes('quota') || errorText.includes('limit')) {
            console.warn(`[Gemini] Model ${model} daily quota exhausted. Moving to next model...`);
            break; // Try next model
          }

          if (attempt < MAX_RETRIES) {
            const retryDelay = attempt * 2000;
            console.log(`[Gemini] Retrying model ${model} in ${retryDelay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
        } else if (response.status >= 500) {
          // Server error / High demand (503). Move to next model immediately to self-heal
          console.warn(`[Gemini] Model ${model} has server issue (${response.status}). Moving to next model...`);
          break; // Try next model
        } else {
          // Other error (400, etc.). Move to next model
          console.warn(`[Gemini] Model ${model} returned ${response.status}. Moving to next model...`);
          break; // Try next model
        }
      } else {
        // No response (connection error / exception). Try next model
        console.warn(`[Gemini] Model ${model} connection failed. Moving to next model...`);
        break; // Try next model
      }
    }
  }

  throw lastError || new Error('All Gemini models failed or exhausted their quotas.');
}

/**
 * Diagnoses a pipeline failure using the Gemini AI model.
 * NO hardcoded fallbacks — the AI analyzes the logs dynamically every time.
 * Returns: { filePath, explanation, originalCode, patchedCode }
 */
async function diagnosePipeline(failedLog, sourceCode = '', options = {}) {
  const isMock = options.isMock !== false;
  const repoContext = options.repoContext || '';
  const hasMultipleFiles = sourceCode && sourceCode.includes('--- FILE:');
  const systemPrompt = `You are VibeCheck AI, an elite DevOps agent specializing in autonomous autonomic hotfix codebases.
Your task is to analyze a failed pipeline execution log and generate high-precision code patches to fix ALL distinct root-cause errors.

CRITICAL: You MUST identify and patch ALL errors in a single response. Do NOT return just one error if there are multiple. The patches array MUST contain one entry for each distinct root-cause bug.

Analyze the logs carefully:
1. Identify ALL unique errors and buggy files causing the pipeline failure. A large pipeline can have multiple independent or cascading errors. Group related downstream symptoms with their root cause, but identify ALL distinct root cause bugs separately.
2. For each root-cause error, generate a high-precision patch. Each patch must target a single file.
3. For each patch, determine the exact lines of code that need replacement (originalCode). Include sufficient context lines (comments, indentation) for precise matching.
4. Write the corrected code block (patchedCode) as a drop-in replacement.
5. Provide a clear, detailed, professional explanation of the bug, why it occurs, and how the fix resolves it.
6. CRITICAL: Do NOT use any emojis in the explanation or description. Keep the tone completely professional and technical.
7. CRITICAL: The originalCode must be an EXACT substring of the actual file contents. Do not add traceback markers like ">" or extra whitespace.
8. CRITICAL: If there are errors in MULTIPLE files, you MUST create a SEPARATE patch entry for EACH file. Never combine multiple file fixes into one patch.
${sourceCode ? (hasMultipleFiles 
  ? `9. SPECIAL INSTRUCTION: The developer has provided the exact source code of MULTIPLE buggy files (separated by "--- FILE:" headers). Your originalCode for each patch MUST match a portion of the corresponding file source code exactly.`
  : `9. SPECIAL INSTRUCTION: The developer has provided the exact source code of the buggy file. Your originalCode MUST match a portion of this source code exactly, and your patchedCode must be the drop-in replacement for it.`) : ''}

You MUST respond with a strict, valid JSON object containing a "patches" array. Each item in the array must represent a separate patch and contain exactly these keys:
{
  "patches": [
    {
      "filePath": "${sourceCode ? 'the path of the buggy file (e.g. src/utils.js)' : (isMock ? 'relative path to buggy file starting with mock_project/ (e.g. mock_project/core/security.py)' : 'relative path to the buggy file relative to the repository root (e.g. index.js or src/math.js)')}",
      "explanation": "detailed professional explanation of this bug, its root cause, impact, and fix (DO NOT USE EMOJIS)",
      "originalCode": "exact text from the original file to replace — must match the file contents precisely",
      "patchedCode": "the corrected drop-in replacement code"
    }
  ]
}`;

  let userMessage = `Here is the failed pipeline output:\n\n${failedLog}\n\n`;
  if (repoContext) {
    userMessage += `Here is the repository knowledge graph audit report and central-node summary. Use this to reason about cross-file impact and multiple pipeline errors:\n\n${repoContext}\n\n`;
  }
  if (sourceCode) {
    if (hasMultipleFiles) {
      userMessage += `Here are the original source code files of the buggy files to patch (one per "--- FILE:" header):\n\n${sourceCode}\n\n`;
    } else {
      userMessage += `Here is the original source code of the buggy file to patch:\n\n${sourceCode}\n\n`;
    }
  }
  userMessage += `Please analyze this failure, identify ALL errors across all files, and generate the JSON fix with a separate patch for EACH error.`;

  try {
    const rawText = await callGemini(systemPrompt, userMessage, { jsonMode: true });
    console.log('[Gemini] Diagnosis response received successfully.');

    let cleanedText = rawText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(cleanedText);

    // Normalize response into a patches array
    let patches = [];
    if (Array.isArray(parsed.patches)) {
      patches = parsed.patches;
    } else if (parsed.filePath) {
      patches = [{
        filePath: parsed.filePath,
        explanation: parsed.explanation || '',
        originalCode: parsed.originalCode || '',
        patchedCode: parsed.patchedCode || ''
      }];
    }

    // Ensure all file paths are correct relative to workspace
    for (const patch of patches) {
      if (patch.filePath) {
        if (isMock && !sourceCode && !patch.filePath.startsWith('mock_project/')) {
          patch.filePath = 'mock_project/' + patch.filePath;
        } else if (!isMock) {
          patch.filePath = patch.filePath.replace(/^mock_project\//, '');
        }
      }
    }

    const mainPatch = patches[0] || {};
    return {
      patches,
      filePath: mainPatch.filePath || null,
      explanation: mainPatch.explanation || '',
      originalCode: mainPatch.originalCode || '',
      patchedCode: mainPatch.patchedCode || ''
    };
  } catch (err) {
    console.error('[Gemini] Diagnosis failed:', err.message);
    return {
      patches: [],
      filePath: null,
      explanation: `AI Diagnosis Failed: ${err.message}. Please verify your Gemini API key is configured correctly in Settings.`,
      originalCode: '',
      patchedCode: '',
      error: true
    };
  }
}

/**
 * Chat with AI about a specific build's issue.
 * Provides full context (logs, diagnosis, patch) and supports multi-turn conversation.
 *
 * @param {object} buildContext - { logOutput, explanation, filePath, originalCode, patchedCode }
 * @param {string} userMessage - The user's question
 * @param {Array} chatHistory - Previous messages [{ role: 'user'|'assistant', content: string }]
 * @returns {string} The AI's response
 */
async function chatWithAI(buildContext, userMessage, chatHistory = []) {
  const systemPrompt = `You are VibeCheck AI, an expert DevOps diagnostic assistant. You are helping a developer understand a specific pipeline failure, review the proposed fix, and modify the fix if requested.

Here is the full context of the issue:

--- FAILED PIPELINE LOG ---
${buildContext.logOutput}

--- AI DIAGNOSIS ---
File: ${buildContext.filePath || 'Unknown'}
Explanation: ${buildContext.explanation || 'No explanation available'}

--- PROPOSED PATCH ---
Original Code:
${buildContext.originalCode || 'N/A'}

Patched Code:
${buildContext.patchedCode || 'N/A'}
--- END CONTEXT ---

Your goal is to answer the developer's questions clearly, professionally, and technically.
If the developer asks you to modify, rewrite, adjust, or change the proposed patch (e.g. "change the default port", "use a try-catch", "modify the default return value"), you must generate the modified patched code block and indicate it in the JSON response.

You MUST respond with a strict, valid JSON object containing exactly these keys:
{
  "reply": "A concise, technical, markdown-formatted conversational reply to the developer's message.",
  "modifyCode": true/false (set to true ONLY if the developer explicitly asked you to change, modify, rewrite, adjust, or refine the patch code; otherwise false),
  "originalCode": "the exact text from the original file to replace (usually identical to the one in the context, but can be adjusted if needed)",
  "patchedCode": "the modified drop-in replacement code (only set if modifyCode is true; otherwise empty string or same as context)"
}

Rules:
1. Do NOT use any emojis. Keep the tone technical and professional.
2. If modifyCode is true, ensure originalCode and patchedCode are complete blocks that can be safely used as drop-in replacements.
3. originalCode must match the actual file contents on disk precisely.`;

  // Build the conversation history as context
  let conversationContext = '';
  if (chatHistory.length > 0) {
    conversationContext = '\n\n--- PREVIOUS CONVERSATION ---\n';
    for (const msg of chatHistory) {
      const role = msg.role === 'user' ? 'Developer' : 'VibeCheck AI';
      conversationContext += `${role}: ${msg.content}\n\n`;
    }
    conversationContext += '--- END PREVIOUS CONVERSATION ---\n';
  }

  const fullUserMessage = `${conversationContext}\nDeveloper's question: ${userMessage}`;

  try {
    const replyText = await callGemini(systemPrompt, fullUserMessage, { jsonMode: true });
    console.log('[Gemini Chat] Parsed JSON response successfully.');
    let cleanedReply = replyText.trim();
    if (cleanedReply.startsWith('```')) {
      cleanedReply = cleanedReply.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleanedReply);
  } catch (err) {
    console.error('[Gemini Chat] Parsing failed, falling back to raw text:', err.message);
    // Safe fallback if JSON parsing or connection failed
    const rawReply = (err.message && err.message.includes('API key')) ? err.message : 'I experienced an issue calling the diagnostic helper. Please verify your keys.';
    return {
      reply: rawReply,
      modifyCode: false,
      originalCode: buildContext.originalCode || '',
      patchedCode: buildContext.patchedCode || ''
    };
  }
}

const CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.rb', '.php', '.cs', '.cpp', '.c', '.h', '.mjs', '.cjs']);
const CONFIG_EXTS = new Set(['package.json', 'requirements.txt', 'setup.py', 'pom.xml', 'build.gradle', 'ci-cd.yml', 'workflow.yml']);
const IGNORE_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'coverage', 'graphify-out', '__pycache__', '.venv', 'venv']);

function getWorkspaceFilesForAnalysis(workspacePath, current = workspacePath, files = []) {
  if (!fs.existsSync(current)) return files;

  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      getWorkspaceFilesForAnalysis(workspacePath, fullPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const isCode = CODE_EXTS.has(ext);
      const isConfig = CONFIG_EXTS.has(entry.name.toLowerCase()) || ext === '.yml' || ext === '.yaml';
      
      if (isCode || isConfig) {
        try {
          const stat = fs.statSync(fullPath);
          if (stat.size <= 256 * 1024) { // Only read files up to 256KB
            const relPath = path.relative(workspacePath, fullPath).replace(/\\/g, '/');
            const content = fs.readFileSync(fullPath, 'utf-8');
            files.push({ relPath, content });
          }
        } catch (_) {}
      }
    }
  }

  return files;
}

/**
 * Analyzes the workspace and its Knowledge Graph context to check for bugs/errors.
 */
async function analyzeWorkspaceForBugs(workspacePath, repoContext = '') {
  const files = getWorkspaceFilesForAnalysis(workspacePath);
  
  let filesContext = '';
  for (const file of files) {
    filesContext += `--- FILE: ${file.relPath} ---\n${file.content}\n\n`;
  }

  const systemPrompt = `You are VibeCheck AI, an elite static analysis and DevOps testing bot.
Your job is to study the cloned repository workspace files and its Knowledge Graph to detect syntax errors, runtime bugs, failed tests, compiler errors, or logic issues that would cause a CI/CD build or test pipeline to fail.

We run a pipeline consisting of:
1. Install ('npm install' or 'pip install')
2. Build ('npm run build' or equivalent)
3. Test ('npm test' or 'pytest' or equivalent)

You must study all files provided in the context, paying special attention to files with syntax errors, typos, or logic bugs.
Also study the Knowledge Graph context to understand connections.

CRITICAL RULES:
1. Do NOT just report the first error you find. You MUST study the ENTIRE codebase and identify ALL distinct errors across ALL files.
2. Each error must be reported as a separate item in the "allErrors" array.
3. Syntax errors (missing brackets, broken expressions, invalid tokens) should be reported as "build" stage failures.
4. Logic bugs, wrong return values, broken imports, or test assertion failures should be reported as "test" stage failures.
5. Missing dependencies or broken package manifests should be reported as "install" stage failures.
6. The "failingStage" field should indicate the EARLIEST stage that would fail (install < build < test).
7. The "stdout" field must contain a COMBINED realistic log output showing ALL errors across ALL files, as if the real CI/CD pipeline ran and reported every single failure.
8. The "stderr" field must contain ALL error tracebacks combined.

If you find ANY errors, return a JSON response with:
{
  "hasError": true,
  "failingStage": "install" | "build" | "test" (the earliest stage that fails),
  "errorFile": "comma-separated list of ALL relative file paths containing errors",
  "errorMessage": "comma-separated short descriptions of ALL errors found",
  "exitCode": 1,
  "stdout": "realistic combined stdout log showing ALL detected errors across ALL files and stages",
  "stderr": "realistic combined stderr log showing ALL error tracebacks or compiler errors",
  "allErrors": [
    {
      "file": "relative/path/to/file.js",
      "stage": "build" | "test",
      "errorType": "syntax" | "runtime" | "logic" | "import" | "assertion" | "dependency",
      "message": "short description of this specific error",
      "line": 42
    }
  ]
}

If everything looks correct and there are NO errors, return:
{
  "hasError": false,
  "failingStage": null,
  "errorFile": null,
  "errorMessage": null,
  "exitCode": 0,
  "stdout": "All compilation, build, and test steps passed successfully.",
  "stderr": "",
  "allErrors": []
}

Do NOT output any markdown headers or text outside of the JSON object. Keep the tone professional.`;

  let userMessage = `Here are the files in the workspace:\n\n${filesContext}\n\n`;
  if (repoContext) {
    userMessage += `Here is the Knowledge Graph context (Graphify):\n\n${repoContext}\n\n`;
  }
  userMessage += `Please analyze this workspace and return the JSON response.`;

  try {
    const rawText = await callGemini(systemPrompt, userMessage, { jsonMode: true });
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (err) {
    console.error('[Gemini Workspace Analysis] Failed:', err.message);
    return {
      hasError: false,
      failingStage: null,
      errorFile: null,
      errorMessage: null,
      exitCode: 0,
      stdout: `[Workspace Analysis Failed] ${err.message}`,
      stderr: ''
    };
  }
}

module.exports = {
  diagnosePipeline,
  chatWithAI,
  analyzeWorkspaceForBugs
};
