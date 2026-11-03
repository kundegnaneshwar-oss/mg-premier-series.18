const form = document.getElementById("registration-form");
const message = document.getElementById("form-message");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

function applyPublicSettings() {
  let cfg = {};
  try { cfg = JSON.parse(localStorage.getItem("mgpsEventSettings") || "{}"); } catch {}
  const isOpen = cfg.registrationsOpen === true;
  const closed = document.getElementById("registration-closed");
  if (closed) closed.hidden = isOpen;
  if (form) form.hidden = !isOpen;
  const demoNote = document.querySelector(".registration-card .demo-note");
  if (demoNote) demoNote.hidden = !isOpen;
  const session = cfg.sessionNumber || "01 / FIND THE TRACK";
  const sessionEl = document.getElementById("venue-session");
  if (sessionEl) sessionEl.textContent = session.toUpperCase();
  const address = cfg.location || "Tournament location will be announced soon.";
  const addressEl = document.getElementById("venue-address");
  if (addressEl) addressEl.textContent = address;
  const mapUrl = cfg.mapsUrl || "https://maps.google.com/?q=" + encodeURIComponent(address);
  ["directions-link", "map-link", "map-footer-link"].forEach(id => { const el = document.getElementById(id); if (el) el.href = mapUrl; });
  const subtitle = document.getElementById("map-subtitle");
  if (subtitle) subtitle.textContent = session.toUpperCase();
}
applyPublicSettings();

form.addEventListener("submit", (event) => {
  if (form.hidden) { event.preventDefault(); return; }
  event.preventDefault();
  message.textContent = "";

  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const registration = {
    captainName: String(data.get("captainName") || "").trim(),
    teamName: String(data.get("teamName") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    email: String(data.get("email") || "").trim(),
    createdAt: new Date().toISOString()
  };

  // Demo-only handoff in this browser. A backend is needed for secure, shared storage.
  sessionStorage.setItem("mgpsRegistration", JSON.stringify(registration));
  window.location.href = "payment.html";
});
