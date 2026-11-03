const STORAGE_KEY = "mgpsHostDemoRecords";

const loginPanel = document.getElementById("login-panel");
const dashboardPanel = document.getElementById("dashboard-panel");
const loginForm = document.getElementById("host-login-form");
const loginMessage = document.getElementById("login-message");
const rows = document.getElementById("registration-rows");
const emptyState = document.getElementById("empty-state");
const tableWrap = document.querySelector(".table-wrap");
const searchInput = document.getElementById("search-input");
let isLoggedIn = false;

async function authRequest(body) {
  const response = await fetch("/api/host-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to sign in. Use your confirmed official host account.");
  return data;
}
function showDashboard() {
  isLoggedIn = true;
  loginPanel.hidden = true;
  dashboardPanel.hidden = false;
  loginMessage.textContent = "";
  renderDashboard();
  loadEventSettings();
}
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.submitter;
  const action = button?.value || "login";
  const email = document.getElementById("host-email").value.trim();
  const password = document.getElementById("host-password").value;
  if (button) button.disabled = true;
  try {
    const params = new URLSearchParams(location.hash.slice(1));
    const token = params.get("recovery_token");
    const data = await authRequest({ action: token && action === "login" ? "recover" : action, email, password, token });
    if (data.ok) { history.replaceState(null, "", location.pathname); location.href = "host.html"; }
    else loginMessage.textContent = data.message;
  } catch (error) { loginMessage.textContent = error.message; }
  finally { if (button) button.disabled = false; }
});
document.getElementById("logout-btn").addEventListener("click", async () => {
  try { await authRequest({ action: "logout" }); location.href = "host.html"; }
  catch { document.getElementById("settings-message").textContent = "Could not sign out. Please retry."; }
});
async function restoreHostSession() {
  try {
    const response = await fetch("/api/host-auth", { cache: "no-store" });
    if (response.ok && (await response.json()).authenticated) showDashboard();
  } catch { loginMessage.textContent = "Unable to connect. Please retry sign-in."; }
}
restoreHostSession();

function getRecords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function setRecords(records) { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

function renderDashboard() {
  if (!isLoggedIn) return;
  const all = getRecords();
  const query = (searchInput.value || "").trim().toLowerCase();
  const filtered = all.filter(r => [r.teamName, r.captainName, r.email, r.phone, r.status].some(v => String(v || "").toLowerCase().includes(query)));
  document.getElementById("total-count").textContent = all.length;
  document.getElementById("pending-count").textContent = all.filter(r => (r.status || "Pending host review") !== "Approved").length;
  document.getElementById("approved-count").textContent = all.filter(r => r.status === "Approved").length;
  rows.replaceChildren();
  emptyState.hidden = filtered.length > 0;
  tableWrap.hidden = filtered.length === 0;

  filtered.forEach(record => {
    const tr = document.createElement("tr");
    const team = document.createElement("td"); team.className = "team-cell";
    const teamStrong = document.createElement("strong"); teamStrong.textContent = record.teamName || "Unnamed team";
    const captain = document.createElement("span"); captain.textContent = "Captain: " + (record.captainName || "—");
    team.append(teamStrong, captain);

    const contact = document.createElement("td"); contact.className = "contact-cell";
    const email = document.createElement("span"); email.textContent = record.email || "—";
    const phone = document.createElement("span"); phone.textContent = record.phone || "—";
    const utr = document.createElement("span"); utr.textContent = "UTR: " + (record.utr || "—");
    contact.append(email, phone, utr);

    const proof = document.createElement("td");
    const proofBtn = document.createElement("button"); proofBtn.className = "action-btn"; proofBtn.textContent = record.proofDataUrl ? "View screenshot" : "No screenshot";
    proofBtn.disabled = !record.proofDataUrl;
    proofBtn.addEventListener("click", () => showProof(record));
    proof.append(proofBtn);

    const status = document.createElement("td");
    const pill = document.createElement("span"); pill.className = "status-pill" + (record.status === "Approved" ? " approved" : "");
    pill.textContent = record.status || "Pending host review"; status.append(pill);

    const actions = document.createElement("td"); actions.className = "action-row";
    const approve = document.createElement("button"); approve.className = "action-btn approve"; approve.textContent = "Approve";
    approve.addEventListener("click", () => updateStatus(record.id, "Approved"));
    const reject = document.createElement("button"); reject.className = "action-btn reject"; reject.textContent = "Reject";
    reject.addEventListener("click", () => updateStatus(record.id, "Rejected"));
    actions.append(approve, reject);
    tr.append(team, contact, proof, status, actions); rows.append(tr);
  });
}

function updateStatus(id, status) {
  const records = getRecords().map(r => r.id === id ? {...r, status} : r);
  setRecords(records); renderDashboard();
}

function showProof(record) {
  document.getElementById("modal-proof").src = record.proofDataUrl;
  document.getElementById("modal-proof-name").textContent = record.proofName || "Payment screenshot";
  document.getElementById("proof-modal").hidden = false;
}
document.getElementById("close-modal").addEventListener("click", () => document.getElementById("proof-modal").hidden = true);
document.getElementById("proof-modal").addEventListener("click", e => { if (e.target.id === "proof-modal") e.currentTarget.hidden = true; });
searchInput.addEventListener("input", renderDashboard);

document.getElementById("export-btn").addEventListener("click", () => {
  const records = getRecords();
  const header = ["Team","Captain","Phone","Email","UTR","Status","Created"];
  const lines = [header, ...records.map(r => [r.teamName,r.captainName,r.phone,r.email,r.utr,r.status,r.createdAt])];
  const csv = lines.map(row => row.map(v => '"' + String(v || "").replaceAll('"','""') + '"').join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "mg-premier-series-registrations.csv"; a.click(); URL.revokeObjectURL(url);
});

document.getElementById("clear-demo-btn").addEventListener("click", () => {
  if (confirm("Clear all local demo records from this browser?")) { setRecords([]); renderDashboard(); }
});


const settingsForm = document.getElementById("event-settings-form");
async function loadEventSettings() {
  const saveButton = settingsForm.querySelector('button[type="submit"]');
  saveButton.disabled = true;
  try {
    const response = await fetch("/api/event-settings", { cache: "no-store" });
    if (!response.ok) throw new Error();
    const cfg = await response.json();
    document.getElementById("registrations-open").checked = cfg.registrationsOpen;
    document.getElementById("session-number").value = cfg.sessionNumber;
    document.getElementById("tournament-date").value = cfg.tournamentDate || "";
    document.getElementById("tournament-location").value = cfg.location;
    document.getElementById("maps-url").value = cfg.mapsUrl;
    saveButton.disabled = false;
  } catch { document.getElementById("settings-message").textContent = "Could not load shared settings. Reload this page to retry."; }
}
settingsForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isLoggedIn) return;
  const cfg = {
    registrationsOpen: document.getElementById("registrations-open").checked,
    sessionNumber: document.getElementById("session-number").value.trim(),
    tournamentDate: document.getElementById("tournament-date").value,
    location: document.getElementById("tournament-location").value.trim(),
    mapsUrl: document.getElementById("maps-url").value.trim() || "https://maps.google.com/?q=" + encodeURIComponent(document.getElementById("tournament-location").value.trim())
  };
  const button = settingsForm.querySelector('button[type="submit"]');
  const status = document.getElementById("settings-message");
  button.disabled = true;
  status.textContent = "Saving…";
  try {
    const response = await fetch("/api/event-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
    if (!response.ok) throw new Error();
    status.textContent = "Saved for all devices. Open registration pages update within 15 seconds.";
  } catch { status.textContent = "Settings were not saved. Check your connection and host sign-in, then retry."; }
  finally { button.disabled = false; }
});
