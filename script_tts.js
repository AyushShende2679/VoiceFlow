const textInput = document.getElementById("textInput");
const voiceSelect = document.getElementById("voiceSelect");
const listenBtn = document.getElementById("listenBtn");
const downloadBtn = document.getElementById("downloadBtn");
const voicePreview = document.getElementById("voicePreview");
const audioSection = document.getElementById("audioSection");
const charCount = document.getElementById("charCount");
const btnIcon = document.getElementById("btnIcon");
const btnText = document.getElementById("btnText");
const ttsAlert = document.getElementById("ttsAlert");
const waveform = document.getElementById("waveform");
const audioMetaLeft = document.getElementById("audioMetaLeft");
const audioTime = document.getElementById("audioTime");
const helperLang = document.getElementById("helperLang");

const API_BASE = "https://voiceflow-30h7.onrender.com";
const MAX_CHARS = 200;

function toast(msg, type = "") {
  const c = document.getElementById("toastContainer");
  if (!c) return;
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  const icon = type === "success" ? '<i data-lucide="check-circle"></i>' : type === "error" ? '<i data-lucide="alert-circle"></i>' : '<i data-lucide="info"></i>';
  div.innerHTML = `${icon}<span>${msg}</span>`;
  c.appendChild(div);
  if (window.lucide) lucide.createIcons({ nodes: [div] });
  setTimeout(() => { div.style.opacity = "0"; div.style.transform = "translateY(8px)"; setTimeout(() => div.remove(), 300); }, 2600);
}

function showAlert(msg, type) {
  if (!ttsAlert) return;
  const icon = type === "success" ? '<i data-lucide="check-circle"></i>' : type === "error" ? '<i data-lucide="alert-triangle"></i>' : '<i data-lucide="info"></i>';
  ttsAlert.innerHTML = `<div class="alert alert-${type}" role="alert">${icon}<span>${msg}</span></div>`;
  if (window.lucide) lucide.createIcons({ nodes: [ttsAlert] });
  if (type === "success") setTimeout(() => (ttsAlert.innerHTML = ""), 3000);
}

function updateCharCount() {
  const len = textInput.value.length;
  charCount.textContent = `${len} / ${MAX_CHARS} characters`;
  charCount.classList.remove("warn", "danger");
  if (len > MAX_CHARS) charCount.classList.add("danger");
  else if (len > MAX_CHARS * 0.8) charCount.classList.add("warn");
  // helper lang hint
  if (helperLang && voiceSelect.value) {
    const lang = voiceSelect.value.split("_")[0];
    helperLang.textContent = `• Voice language: ${lang.toUpperCase()}`;
  } else if (helperLang) helperLang.textContent = "";
}

textInput.addEventListener("input", updateCharCount);
voiceSelect.addEventListener("change", updateCharCount);
textInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    generateSpeech();
  }
});

async function loadVoices() {
  try {
    const res = await fetch(`${API_BASE}/api/voices`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    voiceSelect.innerHTML = '<option value="">Choose a voice…</option>';
    data.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = v.name;
      voiceSelect.appendChild(opt);
    });
    // preselect en_female if exists
    const pref = data.find(v => v.id === "en_female") || data[0];
    if (pref) voiceSelect.value = pref.id;
    updateCharCount();
  } catch (err) {
    console.error("Voice load error:", err);
    voiceSelect.innerHTML = '<option value="">⚠️ Failed to load — retry</option>';
    showAlert("Could not load voices. Check backend connection.", "error");
    // add retry on click
    voiceSelect.addEventListener("click", () => { if (voiceSelect.options.length <= 1) loadVoices(); }, { once: true });
  }
}

let currentObjectUrl = null;

async function generateSpeech() {
  const text = textInput.value.trim();
  const voiceId = voiceSelect.value;

  // inline validation (ux: inline + role=alert)
  if (!text) {
    showAlert("Please enter some text to convert.", "error");
    textInput.focus();
    return;
  }
  if (!voiceId) {
    showAlert("Please choose a voice first.", "error");
    voiceSelect.focus();
    return;
  }
  if (text.length > MAX_CHARS) {
    showAlert(`Text too long (${text.length}/${MAX_CHARS}). Please shorten it.`, "error");
    return;
  }

  // loading state
  listenBtn.disabled = true;
  btnIcon.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
  btnText.textContent = "Generating…";
  audioSection.classList.remove("show");
  if (waveform) waveform.classList.remove("playing");
  ttsAlert.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id: voiceId })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("TTS error:", errText);
      throw new Error(res.status === 400 ? "Invalid request" : "TTS service unavailable");
    }

    const blob = await res.blob();
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    const audioUrl = URL.createObjectURL(blob);
    currentObjectUrl = audioUrl;
    voicePreview.src = audioUrl;
    voicePreview.load();

    audioSection.classList.add("show");
    audioSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (audioMetaLeft) audioMetaLeft.textContent = `${voiceSelect.options[voiceSelect.selectedIndex]?.text || voiceId} • MP3 • ${blob.size ? (blob.size/1024).toFixed(0)+' KB' : ''}`;

    // autoplay attempt
    try {
      await voicePreview.play();
      if (waveform) waveform.classList.add("playing");
      showAlert("Speech generated and playing.", "success");
      toast("Speech ready — playing", "success");
    } catch (err) {
      console.warn("Autoplay blocked:", err);
      showAlert("Speech generated. Press play to listen.", "success");
      toast("Speech ready — tap play", "success");
    }

    // download
    downloadBtn.onclick = () => {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `voiceflow-${voiceId}-${Date.now()}.mp3`;
      link.click();
      toast("Download started", "success");
    };

  } catch (err) {
    console.error(err);
    showAlert("Error generating speech: " + err.message, "error");
    toast(err.message || "Generation failed", "error");
  } finally {
    listenBtn.disabled = false;
    btnIcon.innerHTML = '<i data-lucide="play"></i>';
    btnText.textContent = "Generate Speech";
    if (window.lucide) lucide.createIcons();
  }
}

// audio events for waveform
if (voicePreview) {
  voicePreview.addEventListener("play", () => waveform?.classList.add("playing"));
  voicePreview.addEventListener("pause", () => waveform?.classList.remove("playing"));
  voicePreview.addEventListener("ended", () => waveform?.classList.remove("playing"));
  voicePreview.addEventListener("timeupdate", () => {
    if (!audioTime || !voicePreview.duration) return;
    const cur = voicePreview.currentTime;
    const dur = voicePreview.duration;
    const fmt = (s) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
    audioTime.textContent = `${fmt(cur)} / ${isFinite(dur) ? fmt(dur) : "0:00"}`;
  });
}

listenBtn.addEventListener("click", generateSpeech);
window.addEventListener("load", () => { loadVoices(); updateCharCount(); if (window.lucide) lucide.createIcons(); });

// cleanup object URLs on unload
window.addEventListener("beforeunload", () => { if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl); });
