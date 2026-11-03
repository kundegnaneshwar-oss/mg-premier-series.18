import { login, logout, signup, getUser, confirmEmail, requestPasswordRecovery, recoverPassword, verifyRequestOrigin, AuthError, MissingIdentityError } from '@netlify/identity';
import { isHost } from '../lib/settings-helpers.mjs';

export default async (request: Request) => {
  const headers = { 'Cache-Control': 'no-store' };
  const fail = (error: string, status: number) => Response.json({ error }, { status, headers });
  if (request.method === 'GET') return Response.json({ authenticated: isHost(await getUser()) }, { headers });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
  try { verifyRequestOrigin(request); } catch { return fail('Sign-in must be submitted from this site. Reload the host page and retry.', 403); }
  try {
    const { action, email, password, token } = await request.json();
    if (action === 'logout') { await logout(); return Response.json({ ok: true }, { headers }); }
    if (action === 'confirm') {
      const user = await confirmEmail(token);
      if (!isHost(user)) { await logout(); return fail('Host access required. Use the official host account.', 403); }
      return Response.json({ message: 'Email confirmed. Sign in with your host email and password.' }, { headers });
    }
    if (typeof email !== 'string' || email.trim().toLowerCase() !== 'mgpremierseries.18@gmail.com') return fail('Use the official host email address.', 403);
    const hostEmail = email.trim().toLowerCase();
    if (action === 'reset') { await requestPasswordRecovery(hostEmail); return Response.json({ message: 'Check your email for a password reset link.' }, { headers }); }
    if (typeof password !== 'string' || !password) return fail('Enter your password.', 400);
    if (['signup', 'recover'].includes(action) && password.length < 8) return fail('Use a new password of at least 8 characters.', 400);
    if (action === 'signup') {
      await signup(hostEmail, password);
      return Response.json({ message: 'Check your host email to confirm your account, then sign in. The old demo password does not create a secure account.' }, { headers });
    }
    if (action === 'recover') {
      if (typeof token !== 'string' || !token) return fail('Open the password reset link from your email and retry.', 400);
      await recoverPassword(token, password);
    }
    const user = ['recover', 'login'].includes(action) ? await login(hostEmail, password) : null;
    if (!isHost(user)) { if (user) await logout(); return fail('Sign in with the confirmed official host account.', 403); }
    return Response.json({ ok: true }, { headers });
  } catch (error) {
    if (error instanceof MissingIdentityError) return fail('Host sign-in is temporarily unavailable. Please retry later.', 503);
    if (error instanceof AuthError) {
      if (/not confirmed|confirm your email/i.test(error.message)) return fail('Confirm your host email using the link in your inbox, then sign in.', 403);
      if (/already registered|already exists/i.test(error.message)) return fail('This account already exists. Select Sign in or Reset password.', 409);
      if ([400, 401].includes(error.status ?? 0)) return fail('Sign-in failed. Check your email and password, or use Reset password. Email links may have expired; request a new link if needed.', 401);
      if (error.status === 429) return fail('Too many attempts. Please wait a few minutes and retry.', 429);
    }
    return fail('Unable to complete sign-in. Please retry, or use Reset password.', 503);
  }
};
export const config = { path: '/api/host-auth' };
