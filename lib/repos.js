const fs = require('fs');
const path = require('path');

const REPOS_JSON_PATH = path.join(process.cwd(), 'repos.json');

/**
 * Initialize repos.json if it doesn't exist
 */
function initReposFile() {
  if (!fs.existsSync(REPOS_JSON_PATH)) {
    fs.writeFileSync(REPOS_JSON_PATH, JSON.stringify({ repos: [] }, null, 2), 'utf-8');
  }
}

/**
 * Read all tracked repositories
 */
function getRepos() {
  initReposFile();
  try {
    const data = fs.readFileSync(REPOS_JSON_PATH, 'utf-8');
    return JSON.parse(data).repos || [];
  } catch (err) {
    console.error('[Repos DB] Error reading repos.json:', err);
    return [];
  }
}

/**
 * Write repositories array back to repos.json
 */
function saveRepos(repos) {
  initReposFile();
  try {
    fs.writeFileSync(REPOS_JSON_PATH, JSON.stringify({ repos }, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Repos DB] Error writing repos.json:', err);
  }
}

/**
 * Adds a new repository or updates an existing one
 */
function upsertRepo(repo) {
  const repos = getRepos();
  const index = repos.findIndex(r => r.id === repo.id);
  
  if (index >= 0) {
    repos[index] = { ...repos[index], ...repo };
  } else {
    repos.push(repo);
  }
  
  saveRepos(repos);
  return repo;
}

/**
 * Gets a single repository by ID
 */
function getRepoById(id) {
  const repos = getRepos();
  return repos.find(r => r.id === id) || null;
}

/**
 * Removes a repository by ID
 */
function deleteRepo(id) {
  const repos = getRepos();
  const filtered = repos.filter(r => r.id !== id);
  saveRepos(filtered);
}

module.exports = {
  getRepos,
  upsertRepo,
  getRepoById,
  deleteRepo
};
