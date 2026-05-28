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
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

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
          console.warn(`[Gemini] Model ${model} timed out (12s). Moving to next model...`);
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
  const systemPrompt = `You are VibeCheck AI, an elite DevOps agent specializing in autonomous autonomic hotfix codebases.
Your task is to analyze a failed pipeline execution log and generate a high-precision code patch to fix the failure.

Analyze the logs carefully:
1. Identify the primary file causing the crash. If multiple tests failed, look for the underlying shared module in the import stack traces and fix the ROOT CAUSE at its source.
   Use the repository knowledge graph context when available to understand central files, shared dependencies, and cascading failures.
2. Determine the exact lines of code that need replacement (originalCode). Include sufficient context lines (comments, indentation) for precise matching.
3. Write the corrected code block (patchedCode) as a drop-in replacement.
4. Provide a clear, detailed, professional explanation of:
   - What the bug is and exactly where it occurs (file and line)
   - Why it happens (root cause analysis)
   - What cascading effects it has on downstream services
   - Whether other errors in the log are independent failures or downstream symptoms
   - How the fix resolves the issue
5. CRITICAL: Do NOT use any emojis. Keep the tone completely professional and technical.
6. CRITICAL: The originalCode must be an EXACT substring of the actual file contents. Do not add traceback markers like ">" or extra whitespace.
${sourceCode ? `7. SPECIAL INSTRUCTION: The developer has provided the exact source code of the buggy file. Your originalCode MUST match a portion of this source code exactly, and your patchedCode must be the drop-in replacement for it.` : ''}

You MUST respond with a strict, valid JSON object containing exactly these keys:
{
  "filePath": "${sourceCode ? 'the path of the buggy file (e.g. src/utils.js)' : (isMock ? 'relative path to buggy file starting with mock_project/ (e.g. mock_project/core/security.py)' : 'relative path to the buggy file relative to the repository root (e.g. index.js or src/math.js)')}",
  "explanation": "detailed professional explanation of the bug, root cause, impact, and fix",
  "originalCode": "exact text from the original file to replace — must match the file contents precisely",
  "patchedCode": "the corrected drop-in replacement code"
}`;

  let userMessage = `Here is the failed pipeline output:\n\n${failedLog}\n\n`;
  if (repoContext) {
    userMessage += `Here is the repository knowledge graph audit report and central-node summary. Use this to reason about cross-file impact and multiple pipeline errors:\n\n${repoContext}\n\n`;
  }
  if (sourceCode) {
    userMessage += `Here is the original source code of the buggy file to patch:\n\n${sourceCode}\n\n`;
  }
  userMessage += `Please analyze this failure and generate the JSON fix.`;

  try {
    const rawText = await callGemini(systemPrompt, userMessage, { jsonMode: true });
    console.log('[Gemini] Diagnosis response received successfully.');

    const parsed = JSON.parse(rawText);

    // Ensure file paths are correct relative to workspace for mock project mode only
    if (isMock && !sourceCode && parsed.filePath && !parsed.filePath.startsWith('mock_project/')) {
      parsed.filePath = 'mock_project/' + parsed.filePath;
    } else if (!isMock && parsed.filePath) {
      // Strip mock_project/ if AI returned it by mistake when we are NOT in mock mode
      parsed.filePath = parsed.filePath.replace(/^mock_project\//, '');
    }

    return parsed;
  } catch (err) {
    console.error('[Gemini] Diagnosis failed:', err.message);
    // Return structured error — no hardcoded fallback
    return {
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
  const systemPrompt = `You are VibeCheck AI, an expert DevOps diagnostic assistant. You are helping a developer understand a specific pipeline failure and the proposed fix.

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

Rules:
1. Answer the developer's questions clearly and professionally based on the context above.
2. If they ask about the bug, explain it in detail with references to specific lines and files.
3. If they ask about the fix, explain why the proposed patch works and what it changes.
4. If they ask about potential risks, be honest about edge cases or limitations.
5. Keep answers concise but thorough. Use markdown formatting (bold, code blocks) for readability.
6. Do NOT use any emojis. Maintain a professional, technical tone.
7. If asked something outside the scope of this specific issue, politely redirect to the pipeline failure context.`;

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

  const reply = await callGemini(systemPrompt, fullUserMessage, { jsonMode: false });
  return reply.trim();
}

module.exports = {
  diagnosePipeline,
  chatWithAI
};
