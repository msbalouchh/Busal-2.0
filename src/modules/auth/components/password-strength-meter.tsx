"use client";

import { useMemo } from "react";

type PasswordStrengthMeterProps = {
  password: string;
};

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function scorePassword(password: string): StrengthLevel {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return score as StrengthLevel;
}

const LABELS = ["Enter a password", "Weak", "Fair", "Good", "Strong"] as const;

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const score = useMemo(() => scorePassword(password), [password]);

  if (!password) return null;

  return (
    <div className="auth-strength" aria-live="polite">
      <div className="auth-strength__bars" aria-hidden="true">
        {[1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className={
              score >= level ? `auth-strength__bar is-active-${score}` : "auth-strength__bar"
            }
          />
        ))}
      </div>
      <p className="auth-strength__label">{LABELS[score]}</p>
    </div>
  );
}
