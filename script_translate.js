const translateInput = document.getElementById("translateInput");
const translateSelect = document.getElementById("translateSelect");
const translateBtn = document.getElementById("translateBtn");
const translateOutput = document.getElementById("translateOutput");
const translatedSection = document.getElementById("translatedSection");
const translateCharCount = document.getElementById("translateCharCount");
const translateOutputCount = document.getElementById("translateOutputCount");
const translateAlert = document.getElementById("translateAlert");
const detectedLang = document.getElementById("detectedLang");

const API_BASE = "https://voiceflow-30h7.onrender.com";

function toast(msg, type="") {
  const c = document.getElementById("toastContainer");
  if (!c) return;
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.innerHTML = `<i data-lucide="${type==='success'?'check-circle':type==='error'?'alert-circle':'info'}"></i><span>${msg}</span>`;
  c.appendChild(div);
  if (window.lucide) lucide.createIcons({ nodes: [div] });
  setTimeout(()=> { div.style.opacity="0"; setTimeout(()=>div.remove(),300); }, 2600);
}

function showAlert(message, type) {
  if (!translateAlert) return;
  const icon = type==="success" ? "check-circle" : type==="error" ? "alert-triangle" : "info";
  translateAlert.innerHTML = `<div class="alert alert-${type}" role="alert"><i data-lucide="${icon}"></i><span>${message}</span></div>`;
  if (window.lucide) lucide.createIcons({ nodes: [translateAlert] });
  if (type==="success") setTimeout(()=> translateAlert.innerHTML="", 3200);
}

function updateCounts() {
  const lenIn = translateInput.value.length;
  translateCharCount.textContent = `${lenIn} characters`;
  translateCharCount.classList.toggle("warn", lenIn > 800);
  translateCharCount.classList.toggle("danger", lenIn > 950);
  const lenOut = translateOutput.value.length;
  if (translateOutputCount) translateOutputCount.textContent = `${lenOut} characters`;
}

translateInput.addEventListener("input", updateCounts);
translateOutput.addEventListener("input", updateCounts);

translateInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    translateBtn.click();
  }
});

// keep output count in sync when programmatically changed
const obs = new MutationObserver(updateCounts);
if (translateOutput) obs.observe(translateOutput, { attributes:true, childList:true, characterData:true });

translateBtn.addEventListener("click", async () => {
  const text = translateInput.value.trim();
  const targetLang = translateSelect.value;
  if (!text) {
    showAlert("Please enter text to translate.", "error");
    translateInput.focus();
    return;
  }

  const originalHTML = translateBtn.innerHTML;
  translateBtn.disabled = true;
  translateBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Translating…';
  translateAlert.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.translated) throw new Error("Empty translation");

    translateOutput.value = data.translated;
    if (translateOutputCount) translateOutputCount.textContent = `${data.translated.length} characters`;
    if (translatedSection) translatedSection.style.display = "block";
    // subtle highlight animation
    translateOutput.style.background = "color-mix(in srgb, var(--color-accent) 6%, var(--color-card))";
    setTimeout(()=> translateOutput.style.background = "", 600);
    // detected language badge (if API returns detected source, we infer from input)
    if (detectedLang) {
      detectedLang.style.display = "inline-flex";
      detectedLang.textContent = `→ ${translateSelect.options[translateSelect.selectedIndex].text} • ${data.translated.length} chars`;
    }
    updateCounts();
    showAlert("Translated successfully!", "success");
    toast("Translation ready", "success");
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error(err);
    showAlert("Translation failed. Please try again. " + (err.message || ""), "error");
    toast("Translation failed", "error");
  } finally {
    translateBtn.disabled = false;
    translateBtn.innerHTML = originalHTML;
    if (window.lucide) lucide.createIcons({ nodes: [translateBtn] });
  }
});

// initialize
updateCounts();
if (window.lucide) lucide.createIcons();
