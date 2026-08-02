"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MARKETING_ROUTES } from "@/modules/marketing/constants/routes";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
  locations: string;
  notes: string;
  date: string;
  time: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const TIME_SLOTS = ["09:30", "11:00", "13:30", "15:00", "16:30"] as const;

function nextBusinessDays(count: number) {
  const days: Array<{ value: string; label: string }> = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const weekday = cursor.getDay();
    if (weekday === 0 || weekday === 6) continue;
    const value = cursor.toISOString().slice(0, 10);
    const label = cursor.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    days.push({ value, label });
  }
  return days;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid work email.";
  }
  if (form.company.trim().length < 2) errors.company = "Enter your business name.";
  if (form.phone && form.phone.replace(/\D/g, "").length < 8) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!form.date) errors.date = "Select a preferred date.";
  if (!form.time) errors.time = "Select a preferred time.";
  return errors;
}

export function DemoBookingFlow() {
  const dates = useMemo(() => nextBusinessDays(8), []);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    company: "",
    phone: "",
    locations: "",
    notes: "",
    date: "",
    time: "",
  });

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const selectedLabel = dates.find((d) => d.value === form.date)?.label ?? form.date;

  if (step === 3) {
    return (
      <div
        className="border-marketing-line bg-marketing-panel rounded-3xl border px-6 py-10 sm:px-10"
        role="status"
        aria-live="polite"
      >
        <p className="text-marketing-accent text-xs font-semibold tracking-[0.16em] uppercase">
          Confirmed request
        </p>
        <h3 className="font-marketing-display text-marketing-ink mt-3 text-3xl tracking-tight">
          You&apos;re booked for a Busal demo.
        </h3>
        <p className="text-marketing-muted mt-3 max-w-xl text-sm leading-relaxed">
          Thanks {form.name.split(" ")[0]}. We&apos;ve reserved{" "}
          <strong className="text-marketing-ink">
            {selectedLabel} at {form.time} GMT
          </strong>{" "}
          for {form.company}. A specialist will email {form.email} to confirm the session link
          within one business day.
        </p>
        <dl className="border-marketing-line mt-8 grid gap-4 border-t pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-marketing-muted text-xs tracking-wide uppercase">Business</dt>
            <dd className="text-marketing-ink mt-1 text-sm font-semibold">{form.company}</dd>
          </div>
          <div>
            <dt className="text-marketing-muted text-xs tracking-wide uppercase">Session</dt>
            <dd className="text-marketing-ink mt-1 text-sm font-semibold">
              {selectedLabel} · {form.time} GMT
            </dd>
          </div>
          <div>
            <dt className="text-marketing-muted text-xs tracking-wide uppercase">Contact</dt>
            <dd className="text-marketing-ink mt-1 text-sm font-semibold">{form.email}</dd>
          </div>
          <div>
            <dt className="text-marketing-muted text-xs tracking-wide uppercase">Focus</dt>
            <dd className="text-marketing-ink mt-1 text-sm font-semibold">
              {form.notes.trim() || "Full platform walkthrough"}
            </dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            type="button"
            className="bg-marketing-ink hover:bg-marketing-ink/90"
            onClick={() => {
              setStep(1);
              setForm({
                name: "",
                email: "",
                company: "",
                phone: "",
                locations: "",
                notes: "",
                date: "",
                time: "",
              });
            }}
          >
            Book another demo
          </Button>
          <a
            href={MARKETING_ROUTES.pricing}
            className="border-marketing-line text-marketing-ink inline-flex items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:bg-white/60"
          >
            Review pricing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="border-marketing-line bg-marketing-surface rounded-3xl border p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-2" aria-label={`Step ${step} of 2`}>
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                step === n
                  ? "bg-marketing-ink text-marketing-surface"
                  : step > n
                    ? "bg-marketing-accent text-white"
                    : "bg-marketing-panel text-marketing-muted",
              )}
            >
              {n}
            </span>
            <span className="text-marketing-muted hidden text-xs sm:inline">
              {n === 1 ? "Your details" : "Choose a time"}
            </span>
            {n === 1 ? <span className="bg-marketing-line mx-1 hidden h-px w-8 sm:block" /> : null}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const nextErrors = validate({
              ...form,
              date: form.date || "x",
              time: form.time || "x",
            });
            delete nextErrors.date;
            delete nextErrors.time;
            if (Object.keys(nextErrors).length) {
              setErrors(nextErrors);
              return;
            }
            setStep(2);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="demo-name"
              label="Full name"
              error={errors.name}
              value={form.name}
              onChange={(v) => update("name", v)}
              autoComplete="name"
              required
            />
            <Field
              id="demo-email"
              label="Work email"
              type="email"
              error={errors.email}
              value={form.email}
              onChange={(v) => update("email", v)}
              autoComplete="email"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="demo-company"
              label="Business name"
              error={errors.company}
              value={form.company}
              onChange={(v) => update("company", v)}
              autoComplete="organization"
              required
            />
            <Field
              id="demo-phone"
              label="Phone"
              type="tel"
              error={errors.phone}
              value={form.phone}
              onChange={(v) => update("phone", v)}
              autoComplete="tel"
            />
          </div>
          <Field
            id="demo-locations"
            label="Locations"
            hint="Optional — e.g. 2 restaurants"
            value={form.locations}
            onChange={(v) => update("locations", v)}
          />
          <div className="space-y-2">
            <Label htmlFor="demo-notes">What should we focus on?</Label>
            <textarea
              id="demo-notes"
              name="notes"
              rows={4}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-marketing-accent flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
              placeholder="POS, kitchen, CRM, multi-branch, AI…"
            />
          </div>
          <Button type="submit" className="bg-marketing-ink hover:bg-marketing-ink/90 w-full">
            Continue to scheduling
          </Button>
        </form>
      ) : (
        <form
          className="space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const nextErrors = validate(form);
            if (Object.keys(nextErrors).length) {
              setErrors(nextErrors);
              return;
            }
            startTransition(() => {
              setStep(3);
            });
          }}
        >
          <fieldset>
            <legend className="text-marketing-ink text-sm font-semibold">Preferred date</legend>
            {errors.date ? (
              <p className="text-destructive mt-1 text-xs" role="alert">
                {errors.date}
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
              {dates.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  role="radio"
                  aria-checked={form.date === day.value}
                  onClick={() => update("date", day.value)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm transition",
                    form.date === day.value
                      ? "border-marketing-ink bg-marketing-ink text-marketing-surface"
                      : "border-marketing-line hover:border-marketing-accent/50 hover:bg-marketing-panel",
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-marketing-ink text-sm font-semibold">
              Preferred time (GMT)
            </legend>
            {errors.time ? (
              <p className="text-destructive mt-1 text-xs" role="alert">
                {errors.time}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  role="radio"
                  aria-checked={form.time === slot}
                  onClick={() => update("time", slot)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-medium transition",
                    form.time === slot
                      ? "border-marketing-accent bg-marketing-accent text-white"
                      : "border-marketing-line hover:bg-marketing-panel",
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </fieldset>

          <p className="text-marketing-muted text-xs leading-relaxed">
            Sessions run 30–45 minutes. You&apos;ll receive a calendar invite by email once a
            specialist confirms the slot.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="sm:w-auto"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-marketing-ink hover:bg-marketing-ink/90 flex-1"
            >
              {pending ? "Confirming…" : "Confirm demo request"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="sr-only"> (required)</span> : null}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-marketing-muted text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
