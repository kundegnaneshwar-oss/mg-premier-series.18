(async () => {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.has('recovery_token')) {
    if (!location.pathname.endsWith('host.html')) location.replace('host.html' + location.hash);
    else document.getElementById('login-message').textContent = 'Enter the official host email and your new password, then select Sign in to reset your password.';
    return;
  }
  const token = params.get('confirmation_token');
  if (!token) return;
  history.replaceState(null, '', location.pathname);
  try {
    const response = await fetch('/api/host-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'confirm', token }) });
    if (!response.ok) throw new Error();
    location.replace('host.html?confirmed=1');
  } catch {
    const status = document.getElementById('login-message') || document.getElementById('form-message');
    status.textContent = 'Account confirmation failed. Retry the confirmation email link or reset your password on the host page.';
  }
})();
