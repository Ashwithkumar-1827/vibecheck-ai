const fs = require('fs');
const path = require('path');

/**
 * Detects languages, build systems, test systems and CI tools inside a container's cloned local directory.
 */
function detectProjectConfig(workspacePath) {
  const result = {
    projectType: 'nodejs', // default
    packageManager: 'npm',
    buildScript: 'npm run build',
    testRunner: 'jest',
    testCommand: 'npm test',
    hasDocker: false,
    hasCICD: false,
    cicdType: 'none',
    detectedFiles: []
  };

  if (!fs.existsSync(workspacePath)) {
    return result;
  }

  const files = fs.readdirSync(workspacePath);
  result.detectedFiles = files;

  // 1. Project type / language detection
  if (files.includes('package.json')) {
    result.projectType = 'nodejs';
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(workspacePath, 'package.json'), 'utf-8'));
      
      // Package manager detection
      if (files.includes('yarn.lock')) {
        result.packageManager = 'yarn';
        result.testCommand = 'yarn test';
      } else if (files.includes('pnpm-lock.yaml')) {
        result.packageManager = 'pnpm';
        result.testCommand = 'pnpm test';
      }

      // Check build script
      if (packageJson.scripts) {
        if (!packageJson.scripts.build) {
          result.buildScript = '';
        }
        if (packageJson.scripts.test) {
          if (packageJson.scripts.test.includes('jest')) result.testRunner = 'jest';
          else if (packageJson.scripts.test.includes('mocha')) result.testRunner = 'mocha';
          else if (packageJson.scripts.test.includes('vitest')) result.testRunner = 'vitest';
          else result.testRunner = 'custom';
        }
      }
    } catch (_) {}
  } else if (files.includes('requirements.txt') || files.includes('setup.py') || files.some(f => f.endsWith('.py'))) {
    result.projectType = 'python';
    result.packageManager = 'pip';
    result.buildScript = '';
    result.testRunner = 'pytest';
    result.testCommand = 'pytest';
    
    if (files.includes('Pipfile')) result.packageManager = 'pipenv';
    else if (files.includes('poetry.lock')) result.packageManager = 'poetry';
  } else if (files.includes('pom.xml')) {
    result.projectType = 'java';
    result.packageManager = 'maven';
    result.buildScript = 'mvn compile';
    result.testRunner = 'junit';
    result.testCommand = 'mvn test';
  } else if (files.includes('build.gradle')) {
    result.projectType = 'java';
    result.packageManager = 'gradle';
    result.buildScript = 'gradle build -x test';
    result.testRunner = 'junit';
    result.testCommand = 'gradle test';
  }

  // 2. Docker detection
  if (files.includes('Dockerfile') || files.includes('docker-compose.yml')) {
    result.hasDocker = true;
  }

  // 3. CI/CD pipelines detection
  if (files.includes('.github')) {
    const ghPath = path.join(workspacePath, '.github', 'workflows');
    if (fs.existsSync(ghPath) && fs.readdirSync(ghPath).length > 0) {
      result.hasCICD = true;
      result.cicdType = 'github-actions';
    }
  } else if (files.includes('.gitlab-ci.yml')) {
    result.hasCICD = true;
    result.cicdType = 'gitlab-ci';
  } else if (files.includes('Jenkinsfile')) {
    result.hasCICD = true;
    result.cicdType = 'jenkins';
  } else if (files.includes('azure-pipelines.yml')) {
    result.hasCICD = true;
    result.cicdType = 'azure-pipelines';
  }

  return result;
}

module.exports = {
  detectProjectConfig
};
