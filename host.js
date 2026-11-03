const HOST_EMAIL = "mgpremierseries.18@gmail.com";
const HOST_PASSWORD = "43104310"; // Demo-only: do not use this client-side login on a public deployment.
const STORAGE_KEY = "mgpsHostDemoRecords";
const EVENT_SETTINGS_KEY = "mgpsEventSettings";

const loginPanel = document.getElementById("login-panel");
const dashboardPanel = document.getElementById("dashboard-panel");
const loginForm = document.getElementById("host-login-form");
const loginMessage = document.getElementById("login-message");
const rows = document.getElementById("registration-rows");
const emptyState = document.getElementById("empty-state");
const tableWrap = document.querySelector(".table-wrap");
const searchInput = document.getElementById("search-input");
let isLoggedIn = false;

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("host-email").value.trim().toLowerCase();
  const password = document.getElementById("host-password").value;
  if (email === HOST_EMAIL && password === HOST_PASSWORD) {
    isLoggedIn = true;
    loginPanel.hidden = true;
    dashboardPanel.hidden = false;
    loginMessage.textContent = "";
    renderDashboard();
    loadEventSettings();
  } else {
    loginMessage.textContent = "Invalid host email or password.";
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  isLoggedIn = false;
  dashboardPanel.hidden = true;
  loginPanel.hidden = false;
  loginForm.reset();
});

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
function defaultEventSettings() {
  return { registrationsOpen: false, sessionNumber: "SESSION 01 / FIND THE TRACK", location: "SyNo. 144, 1, Gurramguda Road, Sri Laxmi Nagar, Teachers Colony, Rajyalaxmi Nagar-2, Gurram Guda, Hyderabad, Telangana 501510", mapsUrl: "https://maps.google.com/?q=SyNo.+144+Gurramguda+Road+Hyderabad+Telangana+501510" };
}
function getEventSettings() {
  try { return {...defaultEventSettings(), ...JSON.parse(localStorage.getItem(EVENT_SETTINGS_KEY) || "{}")} }
  catch { return defaultEventSettings(); }
}
function loadEventSettings() {
  const cfg = getEventSettings();
  document.getElementById("registrations-open").checked = !!cfg.registrationsOpen;
  document.getElementById("session-number").value = cfg.sessionNumber;
  document.getElementById("tournament-location").value = cfg.location;
  document.getElementById("maps-url").value = cfg.mapsUrl;
}
settingsForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!isLoggedIn) return;
  const cfg = {
    registrationsOpen: document.getElementById("registrations-open").checked,
    sessionNumber: document.getElementById("session-number").value.trim(),
    location: document.getElementById("tournament-location").value.trim(),
    mapsUrl: document.getElementById("maps-url").value.trim() || "https://maps.google.com/?q=" + encodeURIComponent(document.getElementById("tournament-location").value.trim())
  };
  localStorage.setItem(EVENT_SETTINGS_KEY, JSON.stringify(cfg));
  document.getElementById("settings-message").textContent = "Saved. The registration page updates automatically in this browser. Use the same site address; these demo settings do not sync to other browsers or devices.";
});
