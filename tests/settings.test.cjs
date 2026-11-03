const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('settings validate booleans, lengths and safe map URLs', async () => {
  const { validateSettings, defaultSettings, isHost } = await import('../netlify/lib/settings-helpers.mjs');
  const settings = defaultSettings();
  assert.equal(validateSettings(settings).registrationsOpen, true);
  assert.equal(validateSettings({ ...settings, registrationsOpen: false }).registrationsOpen, false);
  assert.equal(validateSettings({ ...settings, registrationsOpen: 'true' }), null);
  assert.equal(validateSettings({ ...settings, mapsUrl: 'javascript:alert(1)' }), null);
  assert.equal(validateSettings({ ...settings, location: 'x'.repeat(401) }), null);
  assert.equal(validateSettings({ ...settings, tournamentDate: '2028-02-29' }).tournamentDate, '2028-02-29');
  for (const tournamentDate of ['2026-02-29', '2026-04-31', '03/11/2026', '0000-01-01', 123]) {
    assert.equal(validateSettings({ ...settings, tournamentDate }), null);
  }
  assert.equal(validateSettings({ ...settings, tournamentDate: '' }).tournamentDate, '');
  assert.equal(isHost(null), false);
  assert.equal(isHost({ email: 'mgpremierseries.18@gmail.com', emailVerified: true }), false);
  assert.equal(isHost({ email: 'mgpremierseries.18@gmail.com', confirmedAt: 'invalid' }), false);
  assert.equal(isHost({ email: 'visitor@example.com', confirmedAt: '2026-11-03T15:00:00Z' }), false);
  assert.equal(isHost({ email: 'mgpremierseries.18@gmail.com', confirmedAt: undefined }), false);
  assert.equal(isHost({ email: 'mgpremierseries.18@gmail.com', confirmedAt: '2026-11-03T15:00:00Z' }), true);
});

test('a fresh mobile browser opens and closes registration from shared settings', async () => {
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { hidden: id === 'registration-form', textContent: '', addEventListener() {}, reportValidity: () => true });
    return nodes.get(id);
  }
  let settings = { registrationsOpen: true };
  let fail = false;
  const calls = [];
  const context = vm.createContext({
    document: { hidden: false, getElementById: node, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} },
    window: { addEventListener() {} },
    fetch: async (url, options) => { calls.push([url, options]); if (fail) throw new Error(); return { ok: true, json: async () => settings }; },
    setInterval() {},
    localStorage: { getItem() { throw new Error('Mobile has no host storage'); } },
  });
  vm.runInContext(fs.readFileSync('script.js', 'utf8'), context);
  await vm.runInContext('refreshPublicSettings()', context);
  assert.equal(node('registration-form').hidden, false);
  assert.equal(node('registration-closed').hidden, true);
  assert.equal(node('tournament-date-display').textContent, 'To be announced');
  settings = { registrationsOpen: true, tournamentDate: '2026-11-15' };
  await vm.runInContext('refreshPublicSettings()', context);
  assert.equal(node('tournament-date-display').textContent, '15 November 2026');
  settings = { registrationsOpen: false, tournamentDate: '2026-12-01' };
  await vm.runInContext('refreshPublicSettings()', context);
  assert.equal(node('registration-form').hidden, true);
  assert.equal(node('registration-closed').hidden, false);
  assert.equal(node('tournament-date-display').textContent, '1 December 2026');
  fail = true;
  await vm.runInContext('refreshPublicSettings()', context);
  assert.equal(node('registration-status').hidden, false);
  assert.match(node('registration-status-text').textContent, /retry/);
  fail = false; settings = { registrationsOpen: true };
  await vm.runInContext('refreshPublicSettings()', context);
  assert.equal(node('registration-form').hidden, false);
  assert.ok(calls.every(([url, options]) => url === '/api/event-settings' && options.cache === 'no-store'));
});

test('host authorization accepts the installed Identity SDK user format', async () => {
  const { getUser } = await import('@netlify/identity');
  const { isHost } = await import('../netlify/lib/settings-helpers.mjs');
  const originalFetch = globalThis.fetch;
  const originalNetlify = globalThis.Netlify;
  let confirmed = true;
  globalThis.Netlify = { context: {
    url: 'https://host-auth.example/host.html',
    cookies: { get: () => 'test-session' },
  } };
  globalThis.fetch = async url => {
    assert.equal(String(url), 'https://host-auth.example/.netlify/identity/user');
    return Response.json({
      id: 'test-host', email: 'mgpremierseries.18@gmail.com',
      confirmed_at: confirmed ? '2026-11-03T15:00:00Z' : null,
    });
  };
  try {
    const user = await getUser();
    assert.equal(user.confirmedAt, '2026-11-03T15:00:00Z');
    assert.equal(isHost(user), true);
    confirmed = false;
    assert.equal(isHost(await getUser()), false);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.Netlify = originalNetlify;
  }
});
