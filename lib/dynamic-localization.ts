"use client";

import { DEFAULT_LANGUAGE, getStoredLanguage, type AppLanguage } from "@/lib/i18n";

const CATEGORY_TRANSLATIONS: Record<string, Record<string, Partial<Record<AppLanguage, string>>>> = {
  gender: {
    male: { ta: "\u0b86\u0ba3\u0bcd", hi: "\u092a\u0941\u0930\u0941\u0937", ml: "\u0d2a\u0d41\u0d30\u0d41\u0d37\u0d7b" },
    female: { ta: "\u0baa\u0bc6\u0ba3\u0bcd", hi: "\u092e\u0939\u093f\u0932\u093e", ml: "\u0d38\u0d4d\u0d24\u0d4d\u0d30\u0d40" },
    other: { ta: "\u0bae\u0bb1\u0bcd\u0bb1\u0bb5\u0bc8", hi: "\u0905\u0928\u094d\u092f", ml: "\u0d2e\u0d31\u0d4d\u0d31\u0d4d" },
  },
  department: {
    anesthesiology: {
      ta: "\u0bae\u0baf\u0b95\u0bcd\u0b95\u0bb5\u0bbf\u0baf\u0bb2\u0bcd",
      hi: "\u092c\u0947\u0939\u094b\u0936\u0940 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d05\u0d28\u0d38\u0d4d\u0d25\u0d40\u0d37\u0d4d\u0d2f",
    },
    cardiology: {
      ta: "\u0b87\u0ba4\u0baf \u0ba8\u0bcb\u0baf\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
      hi: "\u0939\u0943\u0926\u092f \u0930\u094b\u0917 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d39\u0d43\u0d26\u0d2f \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    },
    dermatology: {
      ta: "\u0ba4\u0bcb\u0bb2\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
      hi: "\u0924\u094d\u0935\u091a\u093e \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d1a\u0d7c\u0d2e\u0d4d\u0d2e \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    },
    ent: {
      ta: "\u0b95\u0bbe\u0ba4\u0bc1 \u0bae\u0bc2\u0b95\u0bcd\u0b95\u0bc1 \u0ba4\u0bca\u0ba3\u0bcd\u0b9f\u0bc8",
      hi: "\u0915\u093e\u0928 \u0928\u093e\u0915 \u0917\u0932\u093e \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d15\u0d3e\u0d24\u0d4d \u0d2e\u0d42\u0d15\u0d4d\u0d15\u0d4d \u0d24\u0d4a\u0d23\u0d4d\u0d1f",
    },
    gastroenterology: {
      ta: "\u0b9a\u0bc6\u0bb0\u0bbf\u0bae\u0bbe\u0ba9 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
      hi: "\u091c\u0940\u0930\u094d\u0923\u093e\u0902\u0924\u094d\u0930 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d17\u0d3e\u0d38\u0d4d\u0d1f\u0d4d\u0d30\u0d4b\u0d0e\u0d28\u0d4d\u0d31\u0d31\u0d4b\u0d33\u0d1c\u0d3f",
    },
    generalmedicine: {
      ta: "\u0baa\u0bca\u0ba4\u0bc1 \u0bae\u0bb0\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1\u0bb5\u0bae\u0bcd",
      hi: "\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u091a\u093f\u0915\u093f\u0924\u094d\u0938\u093e",
      ml: "\u0d1c\u0d28\u0d31\u0d7d \u0d2e\u0d46\u0d21\u0d3f\u0d38\u0d3f\u0d7b",
    },
    general_medicine: {
      ta: "\u0baa\u0bca\u0ba4\u0bc1 \u0bae\u0bb0\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1\u0bb5\u0bae\u0bcd",
      hi: "\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u091a\u093f\u0915\u093f\u0924\u094d\u0938\u093e",
      ml: "\u0d1c\u0d28\u0d31\u0d7d \u0d2e\u0d46\u0d21\u0d3f\u0d38\u0d3f\u0d7b",
    },
    gynecology: {
      ta: "\u0bae\u0b95\u0baa\u0bcd\u0baa\u0bc7\u0bb1\u0bc1 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
      hi: "\u0938\u094d\u0924\u094d\u0930\u0940 \u0930\u094b\u0917 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d17\u0d48\u0d28\u0d15\u0d4d\u0d15\u0d4b\u0d33\u0d1c\u0d3f",
    },
    nephrology: {
      ta: "\u0b9a\u0bbf\u0bb1\u0bc1\u0ba8\u0bc0\u0bb0\u0b95 \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
      hi: "\u0917\u0941\u0930\u094d\u0926\u093e \u0930\u094b\u0917 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d28\u0d46\u0d2b\u0d4d\u0d30\u0d4b\u0d33\u0d1c\u0d3f",
    },
    neurology: {
      ta: "\u0ba8\u0bb0\u0bae\u0bcd\u0baa\u0bbf\u0baf\u0bb2\u0bcd",
      hi: "\u0924\u0902\u0924\u094d\u0930\u093f\u0915\u093e \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d28\u0d4d\u0d2f\u0d42\u0d31\u0d4b\u0d33\u0d1c\u0d3f",
    },
    oncology: {
      ta: "\u0baa\u0bc1\u0bb1\u0bcd\u0bb1\u0bc1\u0ba8\u0bcb\u0baf\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
      hi: "\u0915\u0948\u0902\u0938\u0930 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d13\u0d19\u0d4d\u0d15\u0d4b\u0d33\u0d1c\u0d3f",
    },
    ophthalmology: {
      ta: "\u0b95\u0ba3\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
      hi: "\u0928\u0947\u0924\u094d\u0930 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d28\u0d46\u0d24\u0d4d\u0d30 \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    },
    orthopedics: {
      ta: "\u0b8e\u0bb2\u0bc1\u0bae\u0bcd\u0baa\u0bbf\u0baf\u0bb2\u0bcd",
      hi: "\u0939\u0921\u094d\u0921\u0940 \u0930\u094b\u0917 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d13\u0d7c\u0d24\u0d4d\u0d24\u0d4b\u0d2a\u0d40\u0d21\u0d3f\u0d15\u0d4d\u0d38\u0d4d",
    },
    pathology: {
      ta: "\u0ba8\u0bcb\u0baf\u0bbf\u0baf\u0bb2\u0bcd",
      hi: "\u092a\u0948\u0925\u094b\u0932\u0949\u091c\u0940",
      ml: "\u0d2a\u0d3e\u0d24\u0d4d\u0d24\u0d4b\u0d33\u0d1c\u0d3f",
    },
    pediatrics: {
      ta: "\u0b95\u0bc1\u0bb4\u0ba8\u0bcd\u0ba4\u0bc8\u0b95\u0bb3\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
      hi: "\u092c\u093e\u0932 \u0930\u094b\u0917 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d36\u0d3f\u0d36\u0d41 \u0d35\u0d3f\u0d2d\u0d3e\u0d17\u0d02",
    },
    pulmonology: {
      ta: "\u0ba8\u0bc1\u0bb0\u0bc8\u0baf\u0bc0\u0bb0\u0bb2\u0bcd \u0baa\u0bbf\u0bb0\u0bbf\u0bb5\u0bc1",
      hi: "\u092b\u0947\u092b\u0921\u093c\u093e \u0930\u094b\u0917 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d2a\u0d4d\u0d32\u0d2e\u0d4a\u0d28\u0d4b\u0d33\u0d1c\u0d3f",
    },
    radiology: {
      ta: "\u0b95\u0ba4\u0bbf\u0bb0\u0bbf\u0baf\u0b95\u0bcd\u0b95\u0bae\u0bcd",
      hi: "\u0930\u0947\u0921\u093f\u092f\u094b\u0932\u0949\u091c\u0940",
      ml: "\u0d31\u0d47\u0d21\u0d3f\u0d2f\u0d4b\u0d33\u0d1c\u0d3f",
    },
    surgery: {
      ta: "\u0b85\u0bb1\u0bc1\u0bb5\u0bc8 \u0b9a\u0bbf\u0b95\u0bbf\u0b9a\u0bcd\u0b9a\u0bc8",
      hi: "\u0936\u0932\u094d\u092f \u091a\u093f\u0915\u093f\u0924\u094d\u0938\u093e",
      ml: "\u0d36\u0d38\u0d4d\u0d24\u0d4d\u0d30\u0d15\u0d4d\u0d30\u0d3f\u0d2f",
    },
    urology: {
      ta: "\u0bae\u0bc2\u0ba4\u0bcd\u0ba4\u0bbf\u0bb0\u0bb5\u0bbf\u0baf\u0bb2\u0bcd",
      hi: "\u092e\u0942\u0924\u094d\u0930 \u0930\u094b\u0917 \u0935\u093f\u092d\u093e\u0917",
      ml: "\u0d2f\u0d42\u0d31\u0d4b\u0d33\u0d1c\u0d3f",
    },
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

  if (category) {
    const candidates = [raw, display].filter(Boolean);

    for (const candidate of candidates) {
      const translated = CATEGORY_TRANSLATIONS[category]?.[normalizeKey(candidate)]?.[language];
      if (translated) {
        return translated;
      }
    }
  }

  return display || raw;
}

export function localizeDepartmentName(rawValue: string | null | undefined, explicitDisplay?: string | null) {
  return localizeDynamicText(rawValue, explicitDisplay, "department");
}
