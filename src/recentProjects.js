const STORAGE_KEY = 'velt.preview.recent-projects.v1';
const MAX_RECENT_PROJECTS = 8;

function addRecentProject(projects, project) {
  const normalized = {
    url: project.url,
    name: project.name || 'Velt project',
    openedAt: project.openedAt || new Date().toISOString(),
  };

  return [normalized, ...projects.filter((item) => item.url !== normalized.url)]
    .slice(0, MAX_RECENT_PROJECTS);
}

async function loadRecentProjects(storage) {
  const value = await storage.getItem(STORAGE_KEY);
  if (!value) return [];
  try {
    const projects = JSON.parse(value);
    return Array.isArray(projects) ? projects.filter((item) => item && typeof item.url === 'string') : [];
  } catch {
    return [];
  }
}

async function saveRecentProjects(storage, projects) {
  await storage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_RECENT_PROJECTS)));
}

module.exports = { STORAGE_KEY, addRecentProject, loadRecentProjects, saveRecentProjects };
