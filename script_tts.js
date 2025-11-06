const textInput = document.getElementById("textInput");
const voiceSelect = document.getElementById("voiceSelect");
const listenBtn = document.getElementById("listenBtn");
const downloadBtn = document.getElementById("downloadBtn");
const voicePreview = document.getElementById("voicePreview");
const audioSection = document.getElementById("audioSection");
const charCount = document.getElementById("charCount");
const btnIcon = document.getElementById("btnIcon");
const btnText = document.getElementById("btnText");

textInput.addEventListener('input', () => {
  charCount.textContent = `${textInput.value.length} characters`;
});

async function loadVoices() {
  try {
    const res = await fetch("https://voiceflow-30h7.onrender.com/api/voices");
    if (!res.ok) throw new Error("Failed to load voices");
    const data = await res.json();
    voiceSelect.innerHTML = '<option value="">Choose a voice...</option>';
    data.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = v.name;
      voiceSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Voice load error:", err);
    voiceSelect.innerHTML = '<option>Error loading voices</option>';
  }
}

async function generateSpeech() {
  const text = textInput.value.trim();
  const voiceId = voiceSelect.value;

  if (!text || !voiceId) {
    alert("Please enter text and select a voice!");
    return;
  }

  if (text.length > 200) {
    alert("⚠️ Text too long! Please use less than 200 characters.");
    return;
  }

  listenBtn.disabled = true;
  btnIcon.innerHTML = '<span class="spinner"></span>';
  btnText.textContent = 'Generating...';
  audioSection.classList.remove('show');

  try {
    const res = await fetch("https://voiceflow-30h7.onrender.com/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id: voiceId })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("TTS error:", errText);
      throw new Error("Failed to fetch TTS audio");
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    voicePreview.src = audioUrl;
    voicePreview.load();

    audioSection.classList.add('show');
    try {
      await voicePreview.play();
    } catch (err) {
      console.warn("Autoplay blocked, user must press play:", err);
    }

    downloadBtn.onclick = () => {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = "speech.mp3";
      link.click();
    };

  } catch (err) {
    console.error(err);
    alert("Error generating speech: " + err.message);
  } finally {
    listenBtn.disabled = false;
    btnIcon.textContent = '🔊';
    btnText.textContent = 'Generate Speech';
  }
}

listenBtn.addEventListener("click", generateSpeech);
window.addEventListener("load", loadVoices);
