"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormState = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!form.topic) errors.topic = "Select a topic.";
  if (form.message.trim().length < 12) {
    errors.message = "Please share a little more detail (at least 12 characters).";
  }
  return errors;
}

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    topic: "sales",
    message: "",
  });

  if (submitted) {
    return (
      <div
        className="border-marketing-line bg-marketing-panel rounded-3xl border px-6 py-10 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-marketing-accent text-xs font-semibold tracking-[0.16em] uppercase">
          Message received
        </p>
        <h3 className="font-marketing-display text-marketing-ink mt-3 text-2xl tracking-tight">
          Thanks — we&apos;ll reply shortly.
        </h3>
        <p className="text-marketing-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
          Your {form.topic} enquiry is with the right team. Typical response is within one business
          day. Sales: sales@getbusal.com · Support: support@getbusal.com
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", email: "", topic: "sales", message: "" });
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      className="border-marketing-line space-y-4 rounded-3xl border p-6 sm:p-8"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors = validate(form);
        if (Object.keys(nextErrors).length) {
          setErrors(nextErrors);
          return;
        }
        startTransition(() => setSubmitted(true));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            name="name"
            value={form.name}
            onChange={(e) => {
              setForm((p) => ({ ...p, name: e.target.value }));
              setErrors((p) => ({ ...p, name: undefined }));
            }}
            autoComplete="name"
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
          />
          {errors.name ? (
            <p id="contact-name-error" className="text-destructive text-xs" role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm((p) => ({ ...p, email: e.target.value }));
              setErrors((p) => ({ ...p, email: undefined }));
            }}
            autoComplete="email"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
          />
          {errors.email ? (
            <p id="contact-email-error" className="text-destructive text-xs" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-topic">Topic</Label>
        <select
          id="contact-topic"
          name="topic"
          value={form.topic}
          onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
          className="border-input bg-background focus-visible:ring-marketing-accent flex h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          aria-invalid={Boolean(errors.topic)}
        >
          <option value="sales">Sales</option>
          <option value="support">Support</option>
          <option value="partners">Partnerships</option>
          <option value="press">Press</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => {
            setForm((p) => ({ ...p, message: e.target.value }));
            setErrors((p) => ({ ...p, message: undefined }));
          }}
          className="border-input bg-background focus-visible:ring-marketing-accent flex w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        {errors.message ? (
          <p id="contact-message-error" className="text-destructive text-xs" role="alert">
            {errors.message}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-marketing-ink hover:bg-marketing-ink/90"
      >
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
