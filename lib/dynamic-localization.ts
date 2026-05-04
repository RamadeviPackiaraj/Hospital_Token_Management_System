"use client";

import { DEFAULT_LANGUAGE, getStoredLanguage, type AppLanguage } from "@/lib/i18n";

const CATEGORY_TRANSLATIONS: Record<string, Record<string, Partial<Record<AppLanguage, string>>>> = {
  gender: {
    male: { ta: "ஆண்", hi: "पुरुष", ml: "പുരുഷൻ" },
    female: { ta: "பெண்", hi: "महिला", ml: "സ്ത്രീ" },
    other: { ta: "மற்றவை", hi: "अन्य", ml: "മറ്റ്" },
  },
  department: {
    cardiology: { ta: "இதய நோய் பிரிவு", hi: "हृदय रोग विभाग", ml: "ഹൃദയ വിഭാഗം" },
    orthopedics: { ta: "எலும்பியல்", hi: "हड्डी रोग विभाग", ml: "ഓർത്തോപീഡിക്സ്" },
    neurology: { ta: "நரம்பியல்", hi: "तंत्रिका विभाग", ml: "ന്യൂറോളജി" },
    gynecology: { ta: "மகப்பேறு பிரிவு", hi: "स्त्री रोग विभाग", ml: "ഗൈനക്കോളജി" },
    ent: { ta: "காது மூக்கு தொண்டை", hi: "कान नाक गला विभाग", ml: "കാത് മൂക്ക് തൊണ്ട" },
    pediatrics: { ta: "குழந்தைகள் பிரிவு", hi: "बाल रोग विभाग", ml: "ശിശു വിഭാഗം" },
    dermatology: { ta: "தோல் பிரிவு", hi: "त्वचा विभाग", ml: "ചർമ്മ വിഭാഗം" },
    ophthalmology: { ta: "கண் பிரிவு", hi: "नेत्र विभाग", ml: "നെത്ര വിഭാഗം" },
    generalmedicine: { ta: "பொது மருத்துவம்", hi: "सामान्य चिकित्सा", ml: "ജനറൽ മെഡിസിൻ" },
    general_medicine: { ta: "பொது மருத்துவம்", hi: "सामान्य चिकित्सा", ml: "ജനറൽ മെഡിസിൻ" },
    oncology: { ta: "புற்றுநோய் பிரிவு", hi: "कैंसर विभाग", ml: "ഓങ്കോളജി" },
    radiology: { ta: "கதிரியக்கம்", hi: "रेडियोलॉजी", ml: "റേഡിയോളജി" },
    urology: { ta: "மூத்திரவியல்", hi: "मूत्र रोग विभाग", ml: "യൂറോളജി" },
    pathology: { ta: "நோயியல்", hi: "पैथोलॉजी", ml: "പാത്തോളജി" },
    surgery: { ta: "அறுவை சிகிச்சை", hi: "शल्य चिकित्सा", ml: "ശസ്ത്രക്രിയ" },
  },
};

function normalizeKey(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

export function getCurrentAppLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  return getStoredLanguage();
}

export function localizeDynamicText(
  rawValue: string | null | undefined,
  explicitDisplay?: string | null,
  category?: "gender" | "department"
) {
  const raw = String(rawValue || "").trim();
  const display = String(explicitDisplay || "").trim();
  const language = getCurrentAppLanguage();

  if (!raw && !display) return "";
  if (language === DEFAULT_LANGUAGE) return raw || display;
  if (display) return display;

  if (category) {
    return CATEGORY_TRANSLATIONS[category]?.[normalizeKey(raw)]?.[language] || raw;
  }

  return raw;
}
