const speechBtn = document.getElementById("speechToTextBtn");
const sttOutput = document.getElementById("sttOutput");
const sttCharCount = document.getElementById("sttCharCount");
const copySttBtn = document.getElementById("copySttBtn");
const micIcon = document.getElementById("micIcon");
const micText = document.getElementById("micText");

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-IN";

  speechBtn.addEventListener("click", () => {
    recognition.start();
    micIcon.textContent = "🔴";
    micText.textContent = "Listening...";
    speechBtn.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
  });

  recognition.onresult = (event) => {
    const speechResult = event.results[0][0].transcript;
    sttOutput.value = speechResult;
    sttCharCount.textContent = `${speechResult.length} characters`;
    resetMic();
  };

  recognition.onerror = resetMic;
  recognition.onend = resetMic;

  function resetMic() {
    micIcon.textContent = "🎤";
    micText.textContent = "Start Recording";
    speechBtn.style.background = "linear-gradient(135deg, #10b981, #059669)";
  }
} else {
  speechBtn.disabled = true;
  micText.textContent = "🚫 Speech API not supported";
}

copySttBtn.addEventListener("click", () => {
  if (sttOutput.value) {
    navigator.clipboard.writeText(sttOutput.value);
    copySttBtn.textContent = "✅ Copied!";
    setTimeout(() => (copySttBtn.textContent = "📋 Copy Text"), 2000);
  }
});
