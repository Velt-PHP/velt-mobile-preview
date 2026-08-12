const test = require('node:test');
const assert = require('node:assert/strict');
const { addRecentProject, loadRecentProjects, saveRecentProjects } = require('../src/recentProjects');

test('deduplicates and orders recent projects', () => {
  const projects = addRecentProject([{ url: 'http://one', name: 'Old' }], { url: 'http://one', name: 'New' });
  assert.equal(projects.length, 1);
  assert.equal(projects[0].name, 'New');
});

test('persists recent projects through the storage contract', async () => {
  const values = new Map();
  const storage = {
    getItem: async (key) => values.get(key) || null,
    setItem: async (key, value) => values.set(key, value),
  };
  await saveRecentProjects(storage, [{ url: 'http://project', name: 'Demo' }]);
  assert.deepEqual(await loadRecentProjects(storage), [{ url: 'http://project', name: 'Demo' }]);
});
