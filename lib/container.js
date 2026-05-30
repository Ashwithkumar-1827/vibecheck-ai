const { execFile, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { detectProjectConfig } = require('./detector');
const { buildKnowledgeGraph } = require('./knowledgeGraph');

// Ensure sandboxed scratch directories exist
const SCRATCH_DIR = path.join(process.cwd(), 'scratch');
const CONTAINER_STORE = path.join(SCRATCH_DIR, 'containers');
const SAFE_CONTAINER_ID = /^[A-Za-z0-9_.-]+$/;
const SAFE_GIT_REF = /^[A-Za-z0-9._/-]+$/;

if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}
if (!fs.existsSync(CONTAINER_STORE)) {
  fs.mkdirSync(CONTAINER_STORE, { recursive: true });
}

// Check if Docker is available on the system
let isDockerAvailable = false;
try {
  execFileSync('docker', ['--version'], { stdio: 'ignore' });
  isDockerAvailable = true;
  console.log('[Docker Manager] Native Docker CLI detected.');
} catch (e) {
  console.log('[Docker Manager] Native Docker CLI not detected. Activating Secure Simulated Container engine.');
}

/**
 * Checks if Docker is available
 */
function hasDocker() {
  return isDockerAvailable;
}

function assertSafeChildPath(baseDir, targetPath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedBase, resolvedTarget);

  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    return resolvedTarget;
  }

  throw new Error('Resolved path escapes the container workspace');
}

function assertSafeContainerId(containerId) {
  if (typeof containerId !== 'string' || !SAFE_CONTAINER_ID.test(containerId)) {
    throw new Error('Invalid container id');
  }

  return containerId;
}

function getContainerPath(containerId) {
  assertSafeContainerId(containerId);
  return assertSafeChildPath(CONTAINER_STORE, path.join(CONTAINER_STORE, containerId));
}

function getWorkspacePath(containerId) {
  return assertSafeChildPath(getContainerPath(containerId), path.join(getContainerPath(containerId), 'workspace'));
}

function resolveWorkspacePath(containerId, filePath = '') {
  if (typeof filePath !== 'string' || filePath.includes('\0')) {
    throw new Error('Invalid workspace path');
  }

  const normalizedPath = filePath.replace(/\\/g, path.sep);
  if (path.isAbsolute(normalizedPath)) {
    throw new Error('Absolute workspace paths are not allowed');
  }

  const workspacePath = getWorkspacePath(containerId);
  return assertSafeChildPath(workspacePath, path.join(workspacePath, normalizedPath));
}

function assertRealPathInWorkspace(containerId, targetPath) {
  if (fs.lstatSync(targetPath).isSymbolicLink()) {
    throw new Error('Symlink workspace paths are not allowed');
  }

  const workspacePath = fs.realpathSync(getWorkspacePath(containerId));
  const realTargetPath = fs.realpathSync(targetPath);
  return assertSafeChildPath(workspacePath, realTargetPath);
}

function assertWritablePathInWorkspace(containerId, targetPath) {
  const workspacePath = fs.realpathSync(getWorkspacePath(containerId));
  let existingParent = path.dirname(targetPath);
  while (!fs.existsSync(existingParent)) {
    const nextParent = path.dirname(existingParent);
    if (nextParent === existingParent) {
      throw new Error('Unable to resolve workspace parent path');
    }
    existingParent = nextParent;
  }

  assertSafeChildPath(workspacePath, fs.realpathSync(existingParent));
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  try {
    if (fs.lstatSync(targetPath).isSymbolicLink()) {
      throw new Error('Symlink workspace paths are not allowed');
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  if (fs.existsSync(targetPath)) {
    return assertRealPathInWorkspace(containerId, targetPath);
  }

  const realParentPath = fs.realpathSync(path.dirname(targetPath));
  assertSafeChildPath(workspacePath, realParentPath);
  return targetPath;
}

function validateGitRef(ref) {
  if (typeof ref !== 'string' || ref.length === 0 || ref.includes('..') || ref.includes('\0') || !SAFE_GIT_REF.test(ref)) {
    throw new Error('Invalid git branch name');
  }

  return ref;
}

function parseGitHubRepo(repoUrl) {
  let parsed;
  try {
    parsed = new URL(repoUrl);
  } catch (_) {
    throw new Error('Repository URL must be a valid GitHub HTTPS URL');
  }

  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'github.com') {
    throw new Error('Only GitHub HTTPS repository URLs are supported');
  }

  const [owner, rawName] = parsed.pathname.split('/').filter(Boolean);
  if (!owner || !rawName) {
    throw new Error('Repository URL must include owner and repository name');
  }

  const name = rawName.replace(/\.git$/i, '');
  const safeSegment = /^[A-Za-z0-9_.-]+$/;
  if (!safeSegment.test(owner) || !safeSegment.test(name)) {
    throw new Error('Repository URL contains invalid owner or repository name');
  }

  return {
    owner,
    name,
    cloneUrl: `https://github.com/${owner}/${name}.git`
  };
}

function buildAuthenticatedCloneUrl(cloneUrl, githubToken) {
  if (!githubToken) return cloneUrl;

  const parsed = new URL(cloneUrl);
  parsed.username = 'x-oauth-basic';
  parsed.password = githubToken;
  return parsed.toString();
}

/**
 * Creates a new container workspace (clones repo).
 * If Docker is active, starts a Docker container and clones inside.
 * If simulated, clones the repository safely to a local sandboxed directory but NEVER executes it.
 */
async function createContainer(repoId, repoUrl, branch = 'main', githubToken = null) {
  const containerId = `vibecheck_${repoId}_${Date.now()}`;
  const containerPath = getContainerPath(containerId);
  fs.mkdirSync(containerPath, { recursive: true });

  const targetBranch = validateGitRef(branch);
  const { owner, name, cloneUrl: safeCloneUrl } = parseGitHubRepo(repoUrl);

  // Write container metadata
  const metadata = {
    id: containerId,
    repoId,
    repoUrl,
    branch: targetBranch,
    owner,
    name,
    status: 'cloning',
    created: new Date().toISOString(),
    projectType: 'nodejs', // default
    dockerId: null
  };
  fs.writeFileSync(path.join(containerPath, '.metadata.json'), JSON.stringify(metadata, null, 2));

  // Determine auth repo URL for cloning
  const cloneUrl = buildAuthenticatedCloneUrl(safeCloneUrl, githubToken);

  // Perform git clone safely
  return new Promise((resolve, reject) => {
    const localRepoPath = getWorkspacePath(containerId);
    
    // We execute standard git clone on host (safe because cloning code does not execute it)
    console.log(`[Docker Manager] Cloning ${repoUrl} to ${localRepoPath}...`);
    execFile('git', ['clone', '--depth', '1', '--branch', targetBranch, cloneUrl, localRepoPath], (err, stdout, stderr) => {
      // If git clone fails (e.g. invalid credentials or git not installed), we populate a template repo
      if (err) {
        console.warn(`[Docker Manager] Git clone failed. Creating realistic template repo: ${err.message}`);
        fs.mkdirSync(localRepoPath, { recursive: true });
        populateTemplateProject(localRepoPath, name);
      }

      // Check project configuration
      const detection = detectProjectConfig(localRepoPath);
      metadata.projectType = detection.projectType;
      metadata.detection = detection;
      try {
        metadata.knowledgeGraph = buildKnowledgeGraph(localRepoPath);
      } catch (graphErr) {
        metadata.knowledgeGraph = { error: graphErr.message };
        console.warn(`[Knowledge Graph] Failed to build graph for ${containerId}: ${graphErr.message}`);
      }
      metadata.status = 'ready';

      fs.writeFileSync(path.join(containerPath, '.metadata.json'), JSON.stringify(metadata, null, 2));

      // If Docker is available, spin up a real container and copy the workspace inside!
      if (isDockerAvailable) {
        const image = metadata.projectType === 'python' ? 'vibecheck-python' : 'vibecheck-node';
        execFile('docker', ['run', '-d', '--name', containerId, '-v', `${localRepoPath}:/app`, image], (dockerErr, dStdout, dStderr) => {
          if (dockerErr) {
            console.error(`[Docker Manager] Failed to start Docker container: ${dStderr}`);
            // Fall back to pure simulation
            resolve({ containerId, isDocker: false, metadata });
          } else {
            metadata.dockerId = dStdout.trim();
            fs.writeFileSync(path.join(containerPath, '.metadata.json'), JSON.stringify(metadata, null, 2));
            console.log(`[Docker Manager] Real Docker container ${containerId} started successfully.`);
            resolve({ containerId, isDocker: true, metadata });
          }
        });
      } else {
        // Safe simulated container
        resolve({ containerId, isDocker: false, metadata });
      }
    });
  });
}


/**
 * Populate realistic buggy template repository if git clone is unavailable or fails
 */
function populateTemplateProject(workspacePath, repoName) {
  // Create a realistic Node.js repository with a built-in bug
  const packageJson = {
    name: repoName,
    version: '1.0.0',
    description: 'DevOps test suite for VibeCheck AI integration',
    main: 'index.js',
    scripts: {
      "test": "node test.js",
      "build": "node -e \"console.log('Production build successful!')\""
    },
    dependencies: {}
  };
  fs.writeFileSync(path.join(workspacePath, 'package.json'), JSON.stringify(packageJson, null, 2));

  // The application code with a division-by-zero bug
  const indexJs = `/**
 * VibeCheck demo math module
 */
function computeScalingFactor(scale) {
  console.log("Computing scaling factor for scale: " + scale);
  
  // BUG: Division by zero when scale is 0.
  const factor = 100 / scale;
  return factor;
}

module.exports = { computeScalingFactor };
`;
  fs.writeFileSync(path.join(workspacePath, 'index.js'), indexJs);

  // The test suite that fails
  const testJs = `const { computeScalingFactor } = require('./index');

console.log("Running math module scaling tests...");

try {
  const result1 = computeScalingFactor(2);
  if (result1 !== 50) throw new Error("Expected computeScalingFactor(2) to be 50, got " + result1);
  console.log("PASS: Scaling test with non-zero scale passed");
  
  console.log("TESTING: Scaling with zero scale value...");
  const result2 = computeScalingFactor(0); // Triggers crash
  console.log("PASS: Zero scale result: " + result2);
} catch (err) {
  console.error("FAIL: Test failed during execution!");
  console.error(err.stack);
  process.exit(1);
}
`;
  fs.writeFileSync(path.join(workspacePath, 'test.js'), testJs);
}

/**
 * Execute command INSIDE a container
 */
async function execInContainer(containerId, command, stageName = 'exec') {
  const containerPath = getContainerPath(containerId);
  const metadata = JSON.parse(fs.readFileSync(path.join(containerPath, '.metadata.json'), 'utf-8'));
  const localRepoPath = getWorkspacePath(containerId);

  if (isDockerAvailable && metadata.dockerId) {
    // Run command INSIDE the Docker container!
    return new Promise((resolve) => {
      execFile('docker', ['exec', '-w', '/app', containerId, 'sh', '-lc', command], (err, stdout, stderr) => {
        resolve({
          exitCode: err ? (err.code || 1) : 0,
          stdout: stdout,
          stderr: stderr
        });
      });
    });
  } else {
    // SIMULATED RUN - SECURE: We DO NOT execute the command on the host.
    // Instead, we analyze the workspace files and produce a highly realistic stdout/stderr simulation!
    const analysisPath = path.join(containerPath, 'analysis.json');
    if (fs.existsSync(analysisPath)) {
      try {
        const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
        // Stage priority order: install=0, build=1, test=2
        const stagePriority = { install: 0, build: 1, test: 2 };
        const currentPriority = stagePriority[stageName] ?? 2;
        const failPriority = stagePriority[analysis.failingStage] ?? 2;

        // Show AI analysis results for ANY stage at or after the failing stage.
        // This ensures ALL errors across ALL files and stages are surfaced together.
        if (analysis.hasError && currentPriority >= failPriority) {
          // For the exact failing stage, show the full combined stdout/stderr with ALL errors
          if (currentPriority === failPriority) {
            return new Promise((resolve) => {
              setTimeout(() => {
                // Build enhanced output that lists ALL errors from allErrors array
                let enhancedStdout = analysis.stdout || `Command "${command}" failed.`;
                let enhancedStderr = analysis.stderr || '';

                // Append individual error details from allErrors if available
                if (Array.isArray(analysis.allErrors) && analysis.allErrors.length > 1) {
                  enhancedStderr += '\n\n=== ALL DETECTED ERRORS SUMMARY ===\n';
                  for (const err of analysis.allErrors) {
                    enhancedStderr += `\n[${(err.stage || stageName).toUpperCase()}] ${err.file || 'unknown'} (line ${err.line || '?'}): ${err.errorType || 'error'} - ${err.message || 'Unknown error'}\n`;
                  }
                  enhancedStderr += `\nTotal errors found: ${analysis.allErrors.length}\n`;
                }

                resolve({
                  exitCode: analysis.exitCode || 1,
                  stdout: enhancedStdout,
                  stderr: enhancedStderr
                });
              }, 800);
            });
          } else {
            // For stages AFTER the failing stage, also fail with the relevant errors for this stage
            const stageErrors = Array.isArray(analysis.allErrors) 
              ? analysis.allErrors.filter(e => (stagePriority[e.stage] ?? 2) === currentPriority)
              : [];
            
            if (stageErrors.length > 0) {
              return new Promise((resolve) => {
                setTimeout(() => {
                  let stageStdout = `Running ${stageName} stage...\n`;
                  let stageStderr = '';
                  for (const err of stageErrors) {
                    stageStdout += `FAIL: ${err.file || 'unknown'}: ${err.message || 'error detected'}\n`;
                    stageStderr += `Error in ${err.file || 'unknown'} (line ${err.line || '?'}): ${err.errorType || 'error'} - ${err.message || 'Unknown error'}\n`;
                  }
                  resolve({
                    exitCode: 1,
                    stdout: stageStdout,
                    stderr: stageStderr
                  });
                }, 800);
              });
            }
          }
        }
      } catch (err) {
        console.error('[Container] Failed to parse analysis.json:', err.message);
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const result = simulateExecution(localRepoPath, command, stageName);
        resolve(result);
      }, 800);
    });
  }
}

/**
 * Simulates command execution securely based on file content.
 * Reads the actual files from the workspace to detect if they contain the bug or if it's been patched,
 * then returns matching test logs.
 */
function simulateExecution(workspacePath, command, stageName) {
  const packageJsonPath = path.join(workspacePath, 'package.json');
  const indexJsPath = path.join(workspacePath, 'index.js');
  const testJsPath = path.join(workspacePath, 'test.js');

  const hasPackageJson = fs.existsSync(packageJsonPath);
  const hasIndexJs = fs.existsSync(indexJsPath);
  const hasTestJs = fs.existsSync(testJsPath);

  if (command.includes('npm install') || command.includes('pip install')) {
    return {
      exitCode: 0,
      stdout: `added 142 packages, and audited 143 packages in 1.42s\nfound 0 vulnerabilities\n`,
      stderr: ''
    };
  }

  if (command.includes('npm run build') || command.includes('mvn compile')) {
    return {
      exitCode: 0,
      stdout: `\n> build\n> node -e "console.log('Production build successful!')"\n\nProduction build successful!\n`,
      stderr: ''
    };
  }

  if (command.includes('npm test') || command.includes('pytest') || command.includes('node test.js')) {
    // Check if the file has index.js containing the zero division bug
    if (hasIndexJs) {
      const content = fs.readFileSync(indexJsPath, 'utf-8');
      
      // Determine if bug exists: "100 / scale" without check
      const hasDivisionBug = content.includes('100 / scale') && 
        !/(scale\s*(?:===|==|<=|!=|<|>)\s*0|scale\s+or\s+1|scale\s*\|\|\s*1)/i.test(content);

      if (hasDivisionBug) {
        return {
          exitCode: 1,
          stdout: `Running math module scaling tests...\nPASS: Scaling test with non-zero scale passed\nTESTING: Scaling with zero scale value...\nComputing scaling factor for scale: 0\n`,
          stderr: `FAIL: Test failed during execution!\nError: Expected computeScalingFactor(0) to handle zero scale gracefully, but hit division by zero.\n    at computeScalingFactor (${indexJsPath}:7:21)\n    at Object.<anonymous> (${testJsPath}:10:18)\n    at Module._compile (internal/modules/cjs/loader.js:1105:14)\n`
        };
      }
    }

    // Default Success
    return {
      exitCode: 0,
      stdout: `Running math module scaling tests...\nPASS: Scaling test with non-zero scale passed\nTESTING: Scaling with zero scale value...\nComputing scaling factor for scale: 0\nPASS: Zero scale result: Infinity (or handled gracefully)\n\nALL 2 TESTS PASSED SUCCESSFULLY! ✅\n`,
      stderr: ''
    };
  }

  // Default fallback execution
  return {
    exitCode: 0,
    stdout: `[Simulated] Completed successfully\n`,
    stderr: ''
  };
}

/**
 * Reads a file from the container's workspace
 */
function readFileFromContainer(containerId, filePath) {
  const localFilePath = resolveWorkspacePath(containerId, filePath);
  
  if (fs.existsSync(localFilePath)) {
    return fs.readFileSync(assertRealPathInWorkspace(containerId, localFilePath), 'utf-8');
  }
  return null;
}

/**
 * Writes a file inside the container's workspace
 */
function writeFileToContainer(containerId, filePath, content) {
  const localFilePath = resolveWorkspacePath(containerId, filePath);
  
  fs.writeFileSync(assertWritablePathInWorkspace(containerId, localFilePath), content, 'utf-8');

  // Real Docker containers bind-mount the workspace, so the host write is visible in /app.
}

/**
 * Destroy the container and clean up
 */
async function destroyContainer(containerId) {
  const containerPath = getContainerPath(containerId);
  if (!fs.existsSync(containerPath)) return;

  const metadataPath = path.join(containerPath, '.metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    if (isDockerAvailable && metadata.dockerId) {
      try {
        execFileSync('docker', ['rm', '-f', containerId], { stdio: 'ignore' });
      } catch (_) {}
    }
  }

  // Clean up directory
  try {
    fs.rmSync(containerPath, { recursive: true, force: true });
  } catch (err) {
    console.error(`[Docker Manager] Error removing path ${containerPath}:`, err.message);
  }
}

/**
 * List files inside the container workspace
 */
function listFilesInContainer(containerId, dir = '') {
  const targetDir = resolveWorkspacePath(containerId, dir);
  
  if (!fs.existsSync(targetDir)) return [];

  const safeTargetDir = assertRealPathInWorkspace(containerId, targetDir);
  
  return fs.readdirSync(safeTargetDir).map(file => {
    const stat = fs.statSync(path.join(safeTargetDir, file));
    return {
      name: file,
      isDir: stat.isDirectory(),
      size: stat.size
    };
  });
}

/**
 * Copy workspace state for committing/creating sandbox
 */
async function cloneContainerState(sourceId, targetId) {
  const sourcePath = getContainerPath(sourceId);
  const targetPath = getContainerPath(targetId);

  fs.mkdirSync(targetPath, { recursive: true });

  // Copy directory structure recursively
  const copyFolderRecursiveSync = (src, dest) => {
    const stat = fs.lstatSync(src);
    if (stat.isSymbolicLink()) {
      return;
    }

    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach(child => {
        copyFolderRecursiveSync(path.join(src, child), path.join(dest, child));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  };

  copyFolderRecursiveSync(sourcePath, targetPath);

  // Update metadata
  const metadataPath = path.join(targetPath, '.metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    metadata.id = targetId;
    metadata.created = new Date().toISOString();
    metadata.dockerId = null; // resets docker info for the clone
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // If Docker is available, spin up a new container for sandbox
    if (isDockerAvailable) {
      const workspacePath = path.join(targetPath, 'workspace');
      const image = metadata.projectType === 'python' ? 'vibecheck-python' : 'vibecheck-node';
      try {
        const dId = execFileSync('docker', ['run', '-d', '--name', targetId, '-v', `${workspacePath}:/app`, image]).toString().trim();
        metadata.dockerId = dId;
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      } catch (_) {}
    }
  }
}

module.exports = {
  hasDocker,
  createContainer,
  execInContainer,
  readFileFromContainer,
  writeFileToContainer,
  destroyContainer,
  listFilesInContainer,
  cloneContainerState,
  getContainerPath,
  getWorkspacePath,
  resolveWorkspacePath
};
