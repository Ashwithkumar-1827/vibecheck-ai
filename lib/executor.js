const fs = require('fs');
const path = require('path');
const { execInContainer } = require('./container');

const SCRATCH_DIR = path.join(process.cwd(), 'scratch');
const CONTAINER_STORE = path.join(SCRATCH_DIR, 'containers');

/**
 * Executes a full pipeline run inside a container
 * @param {string} containerId 
 * @param {string[]} stagesToRun 
 * @returns {Promise<object>} Detailed pipeline run results
 */
async function runContainerPipeline(containerId, stagesToRun = ['install', 'build', 'test']) {
  const containerPath = path.join(CONTAINER_STORE, containerId);
  const metadataPath = path.join(containerPath, '.metadata.json');
  
  if (!fs.existsSync(metadataPath)) {
    throw new Error('Container does not exist');
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  const projectType = metadata.projectType;

  // Check if there is a pipeline inside the cloned repo
  const workspacePath = path.join(containerPath, 'workspace');
  const hasNoPipeline = !fs.existsSync(workspacePath) || (
    !fs.existsSync(path.join(workspacePath, 'package.json')) &&
    !fs.existsSync(path.join(workspacePath, 'requirements.txt')) &&
    !fs.existsSync(path.join(workspacePath, 'setup.py')) &&
    !fs.existsSync(path.join(workspacePath, 'pom.xml')) &&
    !fs.existsSync(path.join(workspacePath, 'build.gradle')) &&
    !fs.existsSync(path.join(workspacePath, 'azure-pipelines.yml')) &&
    !fs.existsSync(path.join(workspacePath, '.gitlab-ci.yml')) &&
    !fs.existsSync(path.join(workspacePath, 'Jenkinsfile')) &&
    !fs.existsSync(path.join(workspacePath, '.github', 'workflows'))
  );

  if (hasNoPipeline) {
    try {
      const { getRepoById, upsertRepo } = require('./repos');
      const repo = getRepoById(metadata.repoId);
      if (repo) {
        repo.hasNoPipeline = true;
        if (!repo.detection) repo.detection = {};
        repo.detection.hasCICD = false;
        upsertRepo(repo);
      }
    } catch (e) {
      console.error('[Executor] Failed to update repo with no pipeline status:', e);
    }
    throw new Error('no pipeline detected');
  }

  // Command map per language
  const commands = {
    nodejs: {
      install: 'npm install',
      build: 'npm run build',
      test: 'npm test'
    },
    python: {
      install: 'pip install -r requirements.txt',
      build: 'echo "No build step required for Python"',
      test: 'pytest'
    }
  };

  const projectCmds = commands[projectType] || commands.nodejs;
  
  // Trigger static analysis in simulated mode
  const analysisPath = path.join(containerPath, 'analysis.json');
  if (!metadata.dockerId) {
    console.log(`[Executor] Running AI-powered workspace static analysis for ${containerId}...`);
    try {
      const { buildKnowledgeGraph, readKnowledgeContext } = require('./knowledgeGraph');
      const { analyzeWorkspaceForBugs } = require('./openai');
      buildKnowledgeGraph(workspacePath);
      const repoContext = readKnowledgeContext(workspacePath);
      
      const analysisResult = await analyzeWorkspaceForBugs(workspacePath, repoContext);
      fs.writeFileSync(analysisPath, JSON.stringify(analysisResult, null, 2), 'utf-8');
      console.log(`[Executor] AI static analysis completed. Has error: ${analysisResult.hasError}`);
      
      // Store the allErrors manifest for later injection into pipeline logs
      if (analysisResult.hasError && Array.isArray(analysisResult.allErrors) && analysisResult.allErrors.length > 0) {
        metadata._analysisErrors = analysisResult.allErrors;
      }
    } catch (analysisErr) {
      console.error('[Executor] AI static analysis failed:', analysisErr.message);
    }
  } else {
    if (fs.existsSync(analysisPath)) {
      try { fs.unlinkSync(analysisPath); } catch (_) {}
    }
  }
  
  const results = {
    runId: `run_${Date.now()}`,
    status: 'passed',
    startTime: new Date().toISOString(),
    stages: [],
    logs: ''
  };

  // Ensure execution logs directory exists
  const logsDir = path.join(containerPath, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  let fullLogs = `=== VIBECHECK AI PIPELINE RUN [${results.runId}] ===\n`;
  fullLogs += `Project: ${metadata.name} (${projectType.toUpperCase()})\n`;
  fullLogs += `Branch: ${metadata.branch}\n`;
  fullLogs += `Started: ${results.startTime}\n`;
  fullLogs += `==============================================\n\n`;

  for (const stage of stagesToRun) {
    if (!projectCmds[stage]) continue;

    const cmd = projectCmds[stage];
    const stageStart = Date.now();
    
    fullLogs += `>>> STAGE [${stage.toUpperCase()}]: Running "${cmd}"...\n`;
    
    // Execute inside container (Docker or Safe simulation)
    const execRes = await execInContainer(containerId, cmd, stage);
    const duration = ((Date.now() - stageStart) / 1000).toFixed(2);

    fullLogs += execRes.stdout;
    if (execRes.stderr) {
      fullLogs += `\nSTDERR:\n${execRes.stderr}`;
    }

    const stageStatus = execRes.exitCode === 0 ? 'passed' : 'failed';
    results.stages.push({
      name: stage,
      command: cmd,
      status: stageStatus,
      duration: `${duration}s`,
      exitCode: execRes.exitCode
    });

    fullLogs += `\n<<< STAGE [${stage.toUpperCase()}] ${stageStatus.toUpperCase()} in ${duration}s\n\n`;

    if (stageStatus === 'failed') {
      results.status = 'failed';
      fullLogs += `!!! PIPELINE FAILURE DETECTED AT STAGE [${stage.toUpperCase()}] !!!\n`;
      // Continue running remaining stages to collect ALL errors across the pipeline
    }
  }

  if (results.status === 'passed') {
    fullLogs += `🎉 PIPELINE PASSED ALL STAGES SUCCESSFULLY! 🎉\n`;
  }

  // Inject structured allErrors manifest into logs for AI diagnosis accuracy
  if (metadata._analysisErrors && metadata._analysisErrors.length > 0) {
    fullLogs += `\n=== STATIC ANALYSIS ERROR MANIFEST (${metadata._analysisErrors.length} error(s)) ===\n`;
    for (const err of metadata._analysisErrors) {
      fullLogs += `  [${(err.stage || 'unknown').toUpperCase()}] ${err.file}:${err.line || '?'} — ${err.errorType || 'error'}: ${err.message}\n`;
    }
    fullLogs += `=== END ERROR MANIFEST ===\n`;
    // Clean up temp field
    delete metadata._analysisErrors;
  }

  results.endTime = new Date().toISOString();
  results.logs = fullLogs;

  // Save detailed run logs in container directory
  fs.writeFileSync(path.join(logsDir, `${results.runId}.log`), fullLogs, 'utf-8');
  fs.writeFileSync(path.join(logsDir, `${results.runId}_meta.json`), JSON.stringify(results, null, 2), 'utf-8');

  // Save last run metadata
  metadata.lastRun = {
    runId: results.runId,
    status: results.status,
    time: results.endTime
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  return results;
}

module.exports = {
  runContainerPipeline
};
