const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());


const voices = [
  { id: "en_male", name: "English (Male)" },
  { id: "en_female", name: "English (Female)" },
  { id: "hi_male", name: "Hindi (Male)" },
  { id: "hi_female", name: "Hindi (Female)" },
  { id: "mr_male", name: "Marathi (Male)" },
  { id: "mr_female", name: "Marathi (Female)" },
  { id: "ko_female", name: "Korean (Female)" },
  { id: "zh_female", name: "Chinese (Female)" },
  { id: "es_female", name: "Spanish (Female)" },
  { id: "fr_female", name: "French (Female)" },
  { id: "de_female", name: "German (Female)" },
  { id: "ru_male", name: "Russian (Male)" },
  { id: "it_female", name: "Italian (Female)" },
  { id: "ar_male", name: "Arabic (Male)" },
  { id: "ja_female", name: "Japanese (Female)" }
];


app.get("/api/voices", (req, res) => {
  res.json(voices);
});

app.post("/api/generate", async (req, res) => {
  try {
    const { text, voice_id } = req.body;
    if (!text || !voice_id)
      return res.status(400).json({ error: "Missing text or voice_id" });

    const lang = voice_id.split("_")[0];
    const baseUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      text
    )}&tl=${lang}&client=tw-ob`;

    const response = await fetch(baseUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) throw new Error("Google TTS failed");

    res.set("Content-Type", "audio/mpeg");
    response.body.pipe(res);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});


app.post("/api/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;
    const response = await fetch(url);
    const data = await response.json();
    const translated = Array.isArray(data[0]) ? data[0].map(t => t[0]).join("") : "";
    res.json({ translated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translation failed" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
