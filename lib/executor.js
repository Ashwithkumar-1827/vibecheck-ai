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
      fullLogs += `!!! PIPELINE FAILED AT STAGE [${stage.toUpperCase()}] !!!\n`;
      break; // stop execution on failure
    }
  }

  if (results.status === 'passed') {
    fullLogs += `🎉 PIPELINE PASSED ALL STAGES SUCCESSFULLY! 🎉\n`;
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
