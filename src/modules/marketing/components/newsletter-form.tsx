"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="text-sm text-white/75" role="status" aria-live="polite">
        You&apos;re on the list. We&apos;ll send product updates—no spam.
      </p>
    );
  }

  return (
    <form
      className={compact ? "space-y-2" : "space-y-3"}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          setError("Enter a valid email.");
          return;
        }
        startTransition(() => setDone(true));
      }}
    >
      {!compact ? (
        <Label htmlFor="newsletter-email" className="text-xs tracking-wide text-white/55 uppercase">
          Newsletter
        </Label>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="newsletter-email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="Work email"
          autoComplete="email"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "newsletter-error" : undefined}
          className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
        />
        <Button
          type="submit"
          disabled={pending}
          className="bg-marketing-accent hover:bg-marketing-accent/90 shrink-0 text-white"
        >
          {pending ? "Joining…" : "Subscribe"}
        </Button>
      </div>
      {error ? (
        <p id="newsletter-error" className="text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-white/45">
          Product news and operator insights. Unsubscribe anytime.
        </p>
      )}
    </form>
  );
}
