const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const OUTPUT_ROOT = path.resolve(__dirname, "public", "audio");

// 🌍 Languages
const PHRASES = {
  en: {
    token_number: "Token number",
    please_go: "Please go to doctor",
    in: "in",
    department: "department",
  },
  ta: {
    token_number: "டோக்கன் எண்",
    please_go: "தயவுசெய்து டாக்டர் செல்லவும்",
    in: "இல்",
    department: "துறை",
  },
  hi: {
    token_number: "टोकन नंबर",
    please_go: "कृपया डॉक्टर के पास जाएं",
    in: "में",
    department: "विभाग",
  },
  te: {
    token_number: "టోకెన్ నంబర్",
    please_go: "దయచేసి డాక్టర్ వద్దకు వెళ్లండి",
    in: "లో",
    department: "విభాగం",
  },
  ml: {
    token_number: "ടോക്കൺ നമ്പർ",
    please_go: "ദയവായി ഡോക്ടറെ കാണുക",
    in: "യിൽ",
    department: "വിഭാഗം",
  },
  kn: {
    token_number: "ಟೋಕನ್ ಸಂಖ್ಯೆ",
    please_go: "ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ",
    in: "ನಲ್ಲಿ",
    department: "ವಿಭಾಗ",
  },
};

// 🎤 Voices
const VOICE_MAP = {
  en: { male: "en-US-GuyNeural", female: "en-US-JennyNeural" },
  ta: { male: "ta-IN-ValluvarNeural", female: "ta-IN-PallaviNeural" },
  hi: { male: "hi-IN-MadhurNeural", female: "hi-IN-SwaraNeural" },
  te: { male: "te-IN-MohanNeural", female: "te-IN-ShrutiNeural" },
  ml: { male: "ml-IN-MidhunNeural", female: "ml-IN-SobhanaNeural" },
  kn: { male: "kn-IN-GaganNeural", female: "kn-IN-SapnaNeural" },
};

// 🏥 Departments (from your UI)
const DEPARTMENTS = [
  "ent",
  "cardiology",
  "dermatology",
  "neurology",
  "urology",
  "radiology",
  "surgery",
  "pediatrics",
  "orthopedics",
  "gynecology",
  "oncology",
  "ophthalmology",
  "pathology",
  "general_medicine",
];

// 🌍 Department translations
const DEPARTMENT_TRANSLATIONS = {
  en: {
    ent: "ENT",
    cardiology: "Cardiology",
    dermatology: "Dermatology",
    neurology: "Neurology",
    urology: "Urology",
    radiology: "Radiology",
    surgery: "Surgery",
    pediatrics: "Pediatrics",
    orthopedics: "Orthopedics",
    gynecology: "Gynecology",
    oncology: "Oncology",
    ophthalmology: "Ophthalmology",
    pathology: "Pathology",
    general_medicine: "General medicine",
  },
  te: {
    ent: "ఈఎన్టి",
    cardiology: "హృదయ వైద్యం",
  },
  ta: {
    ent: "காது மூக்கு தொண்டை",
  },
  hi: {
    ent: "ईएनटी",
  },
  ml: {
    ent: "ഇഎൻടി",
  },
  kn: {
    ent: "ಇಎನ್‌ಟಿ",
  },
};

// Create folder
function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

// Check file
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 🔥 FIXED edge-tts call
function runEdgeTts({ voice, text, outputFile }) {
  return new Promise((resolve, reject) => {
    const processHandle = spawn(
      "python",
      [
        "-m",
        "edge_tts",
        "--voice",
        voice,
        "--text",
        text, // ✅ keep plain text (no quotes)
        "--write-media",
        outputFile,
      ],
      {
        windowsHide: true, // ✅ NO shell:true
      }
    );

    let stderr = "";

    processHandle.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    processHandle.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputFile)) {
        resolve();
      } else {
        reject(new Error(stderr || `Failed: ${outputFile}`));
      }
    });
  });
}

// Generate file
async function generateFile(language, gender, key, text) {
  const dir = path.join(OUTPUT_ROOT, language, gender);
  const filePath = path.join(dir, `${key}.mp3`);

  ensureDirectory(dir);

  const voice =
    VOICE_MAP[language]?.[gender] ||
    VOICE_MAP[language]?.female ||
    VOICE_MAP.en.female;

  console.log(`Generating → ${language}/${gender}/${key}.mp3`);

  await runEdgeTts({
    voice,
    text,
    outputFile: filePath,
  });
}

// Generate all
async function generateSet(language, gender) {
  const phrases = PHRASES[language];

  // Basic phrases
  await generateFile(language, gender, "token_number", phrases.token_number);
  await generateFile(language, gender, "please_go", phrases.please_go);
  await generateFile(language, gender, "in", phrases.in);
  await generateFile(language, gender, "department", phrases.department);

  // Numbers
  for (let i = 1; i <= 100; i++) {
    await generateFile(language, gender, String(i), String(i));
  }

  // Departments
  for (const dept of DEPARTMENTS) {
    const text =
      DEPARTMENT_TRANSLATIONS[language]?.[dept] ||
      DEPARTMENT_TRANSLATIONS.en[dept] ||
      dept;

    await generateFile(language, gender, dept, text);
  }
}

// Main
async function main() {
  console.log("🚀 Starting audio generation...");

  try {
    for (const language of Object.keys(PHRASES)) {
      for (const gender of ["male", "female"]) {
        await generateSet(language, gender);
      }
    }

    console.log("✅ ALL AUDIO GENERATED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ ERROR:", err.message);
  }
}

main();