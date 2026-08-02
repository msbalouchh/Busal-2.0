"use client";

import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGE_CODES } from "@/modules/localization-platform/constants/routes";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  ur: "Urdu",
  fr: "French",
  es: "Spanish",
};

const STORAGE_KEY = "busal.locale";

export function LanguageSelector() {
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (
      stored &&
      SUPPORTED_LANGUAGE_CODES.includes(stored as (typeof SUPPORTED_LANGUAGE_CODES)[number])
    ) {
      setLocale(stored);
    }
  }, []);

  function handleChange(value: string) {
    setLocale(value);
    window.localStorage.setItem(STORAGE_KEY, value);
    document.documentElement.lang = value;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Select language">
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={handleChange}>
          {SUPPORTED_LANGUAGE_CODES.map((code) => (
            <DropdownMenuRadioItem key={code} value={code}>
              {LANGUAGE_LABELS[code] ?? code.toUpperCase()}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
