export function defaultSettings() {
  return {
    registrationsOpen: true,
    tournamentDate: '',
    sessionNumber: 'SESSION 01 / FIND THE TRACK',
    location: 'SyNo. 144, 1, Gurramguda Road, Sri Laxmi Nagar, Teachers Colony, Rajyalaxmi Nagar-2, Gurram Guda, Hyderabad, Telangana 501510',
    mapsUrl: 'https://maps.google.com/?q=SyNo.+144+Gurramguda+Road+Hyderabad+Telangana+501510',
  };
}
export function isHost(user) {
  return !!user && user.emailVerified === true && user.email?.toLowerCase() === 'mgpremierseries.18@gmail.com';
}
export function validateSettings(input) {
  if (!input || typeof input.registrationsOpen !== 'boolean') return null;
  if (typeof input.sessionNumber !== 'string' || !input.sessionNumber.trim() || input.sessionNumber.length > 80) return null;
  if (typeof input.location !== 'string' || !input.location.trim() || input.location.length > 400) return null;
  if (typeof input.mapsUrl !== 'string' || input.mapsUrl.length > 2000) return null;
  const tournamentDate = input.tournamentDate ?? '';
  if (typeof tournamentDate !== 'string') return null;
  if (tournamentDate !== '') {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(tournamentDate)) return null;
    const parsed = new Date(tournamentDate + 'T00:00:00Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== tournamentDate || tournamentDate < '0001-01-01') return null;
  }
  const mapsUrl = input.mapsUrl.trim() || 'https://maps.google.com/?q=' + encodeURIComponent(input.location.trim());
  try { if (!['http:', 'https:'].includes(new URL(mapsUrl).protocol)) return null; } catch { return null; }
  return { tournamentDate, registrationsOpen: input.registrationsOpen, sessionNumber: input.sessionNumber.trim(), location: input.location.trim(), mapsUrl };
}
