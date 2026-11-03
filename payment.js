const registration = JSON.parse(sessionStorage.getItem("mgpsRegistration") || "null");
const summaryCaptain = document.getElementById("summary-captain");
const summaryTeam = document.getElementById("summary-team");
const summaryEmail = document.getElementById("summary-email");
const proofInput = document.getElementById("payment-proof");
const previewWrap = document.getElementById("preview-wrap");
const proofPreview = document.getElementById("proof-preview");
const fileName = document.getElementById("file-name");
const removeProof = document.getElementById("remove-proof");
const completeBtn = document.getElementById("complete-btn");
const proofForm = document.getElementById("proof-form");
const uploadMessage = document.getElementById("upload-message");
const completionPanel = document.getElementById("completion-panel");
const referenceId = document.getElementById("reference-id");
let selectedProof = null;
let previewUrl = null;

if (registration) {
  summaryCaptain.textContent = registration.captainName || "—";
  summaryTeam.textContent = registration.teamName || "—";
  summaryEmail.textContent = registration.email || "—";
} else {
  summaryCaptain.textContent = "No registration details";
  summaryTeam.textContent = "Please start from the registration page";
  summaryEmail.textContent = "—";
}

proofInput.addEventListener("change", () => {
  uploadMessage.textContent = "";
  const file = proofInput.files && proofInput.files[0];
  if (!file) { clearProof(); return; }
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) { clearProof(); uploadMessage.textContent = "Please choose a PNG, JPG, or WEBP image."; return; }
  if (file.size > 8 * 1024 * 1024) { clearProof(); uploadMessage.textContent = "The screenshot must be 8 MB or smaller."; return; }
  selectedProof = file;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  proofPreview.src = previewUrl;
  fileName.textContent = file.name;
  previewWrap.hidden = false;
  completeBtn.disabled = false;
  completeBtn.textContent = "COMPLETE REGISTRATION →";
});
function clearProof() {
  selectedProof = null; proofInput.value = ""; previewWrap.hidden = true; proofPreview.removeAttribute("src");
  completeBtn.disabled = true; completeBtn.innerHTML = 'UPLOAD PROOF TO CONTINUE <span aria-hidden="true">→</span>';
  if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
}
removeProof.addEventListener("click", clearProof);

proofForm.addEventListener("submit", async (event) => {
  event.preventDefault(); uploadMessage.textContent = "";
  if (!selectedProof) { uploadMessage.textContent = "Upload your payment screenshot before completing registration."; return; }
  if (!registration) { uploadMessage.textContent = "Start from the registration page first so your team details are included."; return; }

  try {
    // Demo-only: persist to this browser's localStorage for the host page on the same browser.
    const proofDataUrl = await readFileAsDataURL(selectedProof);
    const key = "mgpsHostDemoRecords";
    const records = JSON.parse(localStorage.getItem(key) || "[]");
    const localReference = "MGPS-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    records.push({
      id: localReference,
      ...registration,
      utr: document.getElementById("utr").value.trim(),
      proofName: selectedProof.name,
      proofDataUrl,
      status: "Pending host review",
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(records));
    referenceId.textContent = localReference;
    completionPanel.hidden = false;
    completionPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    uploadMessage.textContent = "Screenshot attached in this browser. Registration is pending host verification.";
    completeBtn.disabled = true;
    completeBtn.textContent = "PROOF ATTACHED ✓";
  } catch {
    uploadMessage.textContent = "Could not save this screenshot in browser storage. Try a smaller image.";
  }
});
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
  });
}
document.getElementById("back-home").addEventListener("click", () => { window.location.href = "index.html"; });
