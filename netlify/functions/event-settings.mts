import { drizzle } from 'drizzle-orm/netlify-db';
import { getUser, verifyRequestOrigin } from '@netlify/identity';
import { eventSettings } from '../../db/schema.js';
import { defaultSettings, validateSettings, isHost } from '../lib/settings-helpers.mjs';

export default async (request: Request) => {
  const headers = { 'Cache-Control': 'no-store' };
  if (!['GET', 'PUT'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers });
  try {
    if (request.method === 'PUT') {
      try { verifyRequestOrigin(request); } catch { return new Response('Forbidden', { status: 403, headers }); }
      if (!isHost(await getUser())) return new Response('Host sign-in required', { status: 403, headers });
      let input;
      try { input = await request.json(); } catch { return new Response('Invalid settings', { status: 400, headers }); }
      const settings = validateSettings(input);
      if (!settings) return new Response('Invalid settings. Use a valid tournament date and an http or https Maps link.', { status: 400, headers });
      const db = drizzle();
      await db.insert(eventSettings).values({ id: 1, ...settings }).onConflictDoUpdate({ target: eventSettings.id, set: settings });
      return Response.json(settings, { headers });
    }
    const db = drizzle();
    const [settings] = await db.select().from(eventSettings).limit(1);
    return Response.json(settings || defaultSettings(), { headers });
  } catch {
    return Response.json({ error: 'Settings are temporarily unavailable. Please retry.' }, { status: 503, headers });
  }
};
export const config = { path: '/api/event-settings' };
