import { login, logout, signup, getUser, confirmEmail, requestPasswordRecovery, recoverPassword, verifyRequestOrigin } from '@netlify/identity';
import { isHost } from '../lib/settings-helpers.mjs';

export default async (request: Request) => {
  const headers = { 'Cache-Control': 'no-store' };
  if (request.method === 'GET') return Response.json({ authenticated: isHost(await getUser()) }, { headers });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
  try { verifyRequestOrigin(request); } catch { return new Response('Forbidden', { status: 403, headers }); }
  try {
    const { action, email, password, token } = await request.json();
    if (action === 'logout') { await logout(); return Response.json({ ok: true }, { headers }); }
    if (action === 'confirm') {
      const user = await confirmEmail(token);
      if (!isHost(user)) { await logout(); return new Response('Host access required', { status: 403, headers }); }
      return Response.json({ ok: true }, { headers });
    }
    if (typeof email !== 'string' || email.trim().toLowerCase() !== 'mgpremierseries.18@gmail.com') return new Response('Use the official host email address.', { status: 403, headers });
    if (action === 'reset') { await requestPasswordRecovery(email.trim()); return Response.json({ message: 'Check your email for a password reset link.' }, { headers }); }
    if (typeof password !== 'string' || password.length < 8) return new Response('Use a password of at least 8 characters.', { status: 400, headers });
    if (action === 'signup') {
      await signup(email.trim(), password);
      return Response.json({ message: 'Check your host email to confirm your account, then sign in. The old demo password does not create a secure account.' }, { headers });
    }
    const user = action === 'recover' ? await recoverPassword(token, password) : action === 'login' ? await login(email.trim(), password) : null;
    if (!isHost(user)) { if (user) await logout(); return new Response('Sign in with the confirmed host account.', { status: 403, headers }); }
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ error: 'Unable to complete sign-in. Check your details and confirmation email, or retry the account setup/reset link.' }, { status: 400, headers });
  }
};
export const config = { path: '/api/host-auth' };
