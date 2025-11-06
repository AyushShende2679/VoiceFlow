const translateInput = document.getElementById("translateInput");
const translateSelect = document.getElementById("translateSelect");
const translateBtn = document.getElementById("translateBtn");
const translateOutput = document.getElementById("translateOutput");
const translatedSection = document.getElementById("translatedSection");
const translateCharCount = document.getElementById("translateCharCount");
const translateOutputCount = document.getElementById("translateOutputCount");
const translateAlert = document.getElementById("translateAlert");

translateInput.addEventListener('input', () => {
  translateCharCount.textContent = `${translateInput.value.length} characters`;
});

function showAlert(message, type) {
  translateAlert.className = `alert alert-${type}`;
  translateAlert.textContent = message;
  translateAlert.style.display = "block";
  setTimeout(() => (translateAlert.style.display = "none"), 3000);
}

translateBtn.addEventListener("click", async () => {
  const text = translateInput.value.trim();
  const targetLang = translateSelect.value;
  if (!text) return showAlert("Please enter text!", "error");

  translateBtn.disabled = true;
  translateBtn.innerHTML = '<span class="spinner"></span> Translating...';

  try {
    const res = await fetch("http://localhost:3000/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang })
    });
    const data = await res.json();

    if (!data.translated) throw new Error("Translation failed");

    translateOutput.value = data.translated;
    translateOutputCount.textContent = `${data.translated.length} characters`;
    translatedSection.style.display = "block";
    showAlert("✅ Translated Successfully!", "success");
  } catch (err) {
    showAlert("❌ Translation failed!", "error");
  } finally {
    translateBtn.disabled = false;
    translateBtn.innerHTML = "🔄 Translate";
  }
});
