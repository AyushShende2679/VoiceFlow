const speechBtn = document.getElementById("speechToTextBtn");
const sttOutput = document.getElementById("sttOutput");
const sttCharCount = document.getElementById("sttCharCount");
const copySttBtn = document.getElementById("copySttBtn");
const clearSttBtn = document.getElementById("clearSttBtn");
const downloadSttBtn = document.getElementById("downloadSttBtn");
const micIcon = document.getElementById("micIcon");
const micText = document.getElementById("micText");
const sttLang = document.getElementById("sttLang");
const recPill = document.getElementById("recPill");
const recTimer = document.getElementById("recTimer");
const liveWave = document.getElementById("liveWave");
const sttCard = document.getElementById("sttCard");
const sttAlert = document.getElementById("sttAlert");
const confidenceBadge = document.getElementById("confidenceBadge");

let timerId = null;
let startTs = 0;

function toast(msg, type="") {
  const c = document.getElementById("toastContainer");
  if (!c) return;
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.innerHTML = `<i data-lucide="${type==='success'?'check-circle':type==='error'?'alert-circle':'info'}"></i><span>${msg}</span>`;
  c.appendChild(div);
  if (window.lucide) lucide.createIcons({nodes:[div]});
  setTimeout(()=> { div.style.opacity="0"; setTimeout(()=>div.remove(),300); }, 2500);
}

function showSTTAlert(msg, type) {
  if (!sttAlert) return;
  sttAlert.innerHTML = `<div class="alert alert-${type}" role="alert"><i data-lucide="${type==='success'?'check-circle':type==='error'?'alert-triangle':'info'}"></i><span>${msg}</span></div>`;
  if (window.lucide) lucide.createIcons({nodes:[sttAlert]});
  if (type==='success') setTimeout(()=> sttAlert.innerHTML="", 3000);
}

function fmtTime(ms) {
  const s = Math.floor(ms/1000);
  const m = String(Math.floor(s/60)).padStart(2,'0');
  const sec = String(s%60).padStart(2,'0');
  return `${m}:${sec}`;
}

function startTimer() {
  startTs = Date.now();
  recTimer.textContent = "00:00";
  timerId = setInterval(()=> { recTimer.textContent = fmtTime(Date.now()-startTs); }, 500);
}
function stopTimer() { clearInterval(timerId); timerId=null; }

function setRecording(isRec) {
  if (isRec) {
    sttCard?.classList.add("recording-card");
    recPill.style.display = "inline-flex";
    liveWave.style.display = "flex";
    speechBtn.style.background = "linear-gradient(135deg, #DC2626, #B91C1C)";
    speechBtn.style.boxShadow = "0 8px 24px rgba(220,38,38,0.35)";
    micIcon.innerHTML = '<i data-lucide="mic-off"></i>';
    micText.textContent = "Listening — tap to stop";
    speechBtn.setAttribute("aria-pressed","true");
    sttOutput.placeholder = "Listening… speak now";
    startTimer();
  } else {
    sttCard?.classList.remove("recording-card");
    recPill.style.display = "none";
    liveWave.style.display = "none";
    speechBtn.style.background = "";
    speechBtn.style.boxShadow = "";
    micIcon.innerHTML = '<i data-lucide="mic"></i>';
    micText.textContent = "Start Recording";
    speechBtn.setAttribute("aria-pressed","false");
    sttOutput.placeholder = "Your transcribed text will appear here...";
    stopTimer();
  }
  if (window.lucide) lucide.createIcons();
}

let recognition = null;
let isSupported = false;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  isSupported = true;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true; // show interim for better UX
  recognition.lang = sttLang ? sttLang.value : "en-IN";

  if (sttLang) {
    sttLang.addEventListener("change", () => {
      recognition.lang = sttLang.value;
      toast(`Language set to ${sttLang.options[sttLang.selectedIndex].text}`, "success");
    });
  }

  let interim = "";

  speechBtn.addEventListener("click", () => {
    const isRec = speechBtn.getAttribute("aria-pressed") === "true";
    if (isRec) {
      try { recognition.stop(); } catch {}
      return;
    }
    try {
      recognition.start();
    } catch (e) {
      console.warn(e);
    }
  });

  recognition.onstart = () => {
    setRecording(true);
    sttOutput.value = "";
    confidenceBadge.style.display = "none";
  };

  recognition.onresult = (event) => {
    let finalTranscript = "";
    interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) finalTranscript += res[0].transcript + " ";
      else interim += res[0].transcript;
    }
    const display = (finalTranscript || interim).trim();
    sttOutput.value = display;
    sttCharCount.textContent = `${display.length} characters`;
    // confidence for final
    if (event.results[0] && event.results[0].isFinal) {
      const conf = event.results[0][0].confidence;
      if (conf) {
        confidenceBadge.style.display = "inline-flex";
        confidenceBadge.textContent = `${Math.round(conf*100)}% confidence`;
      }
    }
    if (finalTranscript) {
      showSTTAlert("Transcription updated.", "success");
    }
  };

  recognition.onerror = (event) => {
    console.error("STT error", event.error);
    let msg = "Recognition error: " + event.error;
    if (event.error === "not-allowed") msg = "Microphone permission denied. Please allow mic access.";
    if (event.error === "no-speech") msg = "No speech detected. Try again louder.";
    showSTTAlert(msg, "error");
    toast(msg, "error");
    setRecording(false);
  };

  recognition.onend = () => {
    setRecording(false);
    if (sttOutput.value.trim()) {
      toast("Transcription complete", "success");
    }
  };

  recognition.onspeechend = () => {
    // let onend handle UI
  };

} else {
  isSupported = false;
  speechBtn.disabled = true;
  micText.textContent = "Not supported in this browser";
  micIcon.innerHTML = '<i data-lucide="alert-triangle"></i>';
  showSTTAlert("SpeechRecognition not supported. Use Chrome/Edge on desktop.", "error");
  if (window.lucide) lucide.createIcons();
}

// actions
copySttBtn.addEventListener("click", async () => {
  if (!sttOutput.value.trim()) { toast("Nothing to copy", "error"); return; }
  try {
    await navigator.clipboard.writeText(sttOutput.value);
    copySttBtn.innerHTML = '<i data-lucide="check"></i> Copied!';
    if (window.lucide) lucide.createIcons({nodes:[copySttBtn]});
    toast("Copied to clipboard", "success");
    setTimeout(() => { copySttBtn.innerHTML = '<i data-lucide="copy"></i> Copy text'; if(window.lucide) lucide.createIcons({nodes:[copySttBtn]}); }, 1800);
  } catch { toast("Copy failed — select and copy manually", "error"); }
});

clearSttBtn?.addEventListener("click", () => {
  sttOutput.value = "";
  sttCharCount.textContent = "0 characters";
  confidenceBadge.style.display = "none";
  sttAlert.innerHTML = "";
  sttOutput.focus();
  toast("Cleared", "");
});

downloadSttBtn?.addEventListener("click", () => {
  const text = sttOutput.value.trim();
  if (!text) { toast("Nothing to download", "error"); return; }
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `voiceflow-transcript-${Date.now()}.txt`; a.click();
  URL.revokeObjectURL(url);
  toast("Downloaded .txt", "success");
});

// keyboard shortcut: space to start/stop when focus on button
speechBtn.addEventListener("keydown", (e)=> { if(e.code==="Space"){ e.preventDefault(); speechBtn.click(); }});

// init icons
if (window.lucide) lucide.createIcons();
