const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'db.json');

function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    // First-time setup: seed with initial enterprise scenarios
    try {
      const { seedInitialData } = require('./refresh_usecases');
      seedInitialData();
    } catch (err) {
      // Fallback: create a minimal empty database if refresh_usecases fails
      console.warn("[DB] Failed to run seedInitialData, creating minimal db:", err.message);
      const minimalData = { builds: [], patches: [], chatMessages: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(minimalData, null, 2), 'utf-8');
    }
  }
  // If db.json already exists, do nothing -- all data is preserved across restarts
}

// Read helper with basic error handling
function readData() {
  initDb();
  try {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to read db.json:", err);
    return { builds: [], patches: [], chatMessages: [] };
  }
}

// Atomic write helper
function writeData(data) {
  try {
    const tempPath = DB_PATH + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_PATH);
  } catch (err) {
    console.error("Failed to write to db.json:", err);
  }
}

const db = {
  // Initialize database schema
  initDb,

  // Get all builds, sorted by timestamp descending
  getBuilds() {
    const data = readData();
    return [...data.builds].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // Get specific build and attach its proposed patch
  getBuildById(id) {
    const data = readData();
    const build = data.builds.find(b => String(b.id) === String(id));
    if (!build) return null;
    
    const patch = data.patches.find(p => String(p.build_id) === String(id));
    return { ...build, patch: patch || null };
  },

  // Create a new build record
  createBuild(status, logOutput, targetScenario) {
    const data = readData();
    const newId = (Math.max(...data.builds.map(b => parseInt(b.id) || 0), 100) + 1).toString();
    const newBuild = {
      id: newId,
      timestamp: new Date().toISOString(),
      status,
      log_output: logOutput,
      target_scenario: targetScenario
    };
    data.builds.push(newBuild);
    writeData(data);
    return newBuild;
  },

  // Update status and log of an existing build
  updateBuildStatus(id, status, logOutput = null) {
    const data = readData();
    const build = data.builds.find(b => String(b.id) === String(id));
    if (build) {
      build.status = status;
      if (logOutput !== null) {
        build.log_output = logOutput;
      }
      writeData(data);
    }
    return build;
  },

  // Create an AI proposed patch
  createPatch(buildId, filePath, explanation, originalCode, patchedCode) {
    const data = readData();
    const patchId = "p_" + Math.random().toString(36).substr(2, 9);
    const newPatch = {
      id: patchId,
      build_id: buildId,
      file_path: filePath,
      explanation,
      original_code: originalCode,
      patched_code: patchedCode,
      status: "PENDING",
      created_at: new Date().toISOString()
    };
    // Clean out any old pending patches for this build
    data.patches = data.patches.filter(p => p.build_id !== buildId);
    data.patches.push(newPatch);
    writeData(data);
    return newPatch;
  },

  // Update patch status
  updatePatchStatus(patchId, status) {
    const data = readData();
    const patch = data.patches.find(p => p.id === patchId);
    if (patch) {
      patch.status = status;
      writeData(data);
    }
    return patch;
  },

  // Helper to retrieve patch by ID
  getPatchById(patchId) {
    const data = readData();
    return data.patches.find(p => p.id === patchId) || null;
  },

  // Get all chat messages for a specific build
  getChatHistory(buildId) {
    const data = readData();
    if (!data.chatMessages) return [];
    return data.chatMessages
      .filter(m => String(m.build_id) === String(buildId))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  // Append a chat message (role: 'user' or 'assistant')
  addChatMessage(buildId, role, content) {
    const data = readData();
    if (!data.chatMessages) data.chatMessages = [];
    const msg = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      build_id: String(buildId),
      role,
      content,
      timestamp: new Date().toISOString()
    };
    data.chatMessages.push(msg);
    writeData(data);
    return msg;
  }
};

module.exports = db;
