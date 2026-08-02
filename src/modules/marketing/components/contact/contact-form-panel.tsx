"use client";

import { useState, type FormEvent } from "react";

import { cn } from "@/lib/utils";
import {
  CONTACT_INDUSTRIES,
  CONTACT_REASONS,
} from "@/modules/marketing/components/contact/contact-data";
import {
  LOCAL_CONTACT_ADAPTER,
  type ContactFormAdapter,
  type ContactFormPayload,
  type ContactReason,
} from "@/modules/marketing/components/contact/contact-types";

type FieldErrors = Partial<Record<keyof ContactFormPayload, string>>;

const EMPTY_FORM: ContactFormPayload = {
  name: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  industry: "",
  message: "",
  reason: "sales",
};

function validate(form: ContactFormPayload): FieldErrors {
  const errors: FieldErrors = {};
  if (form.name.trim().length < 2) errors.name = "Enter your name.";
  if (form.company.trim().length < 2) errors.company = "Enter your company name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid business email.";
  }
  if (form.phone && form.phone.replace(/\D/g, "").length < 8) {
    errors.phone = "Enter a valid phone number.";
  }
  if (form.country.trim().length < 2) errors.country = "Enter your country.";
  if (!form.industry) errors.industry = "Select an industry.";
  if (form.message.trim().length < 12) {
    errors.message = "Please share more detail (at least 12 characters).";
  }
  if (!form.reason) errors.reason = "Select a reason for contact.";
  return errors;
}

type ContactFormPanelProps = {
  adapter?: ContactFormAdapter;
};

export function ContactFormPanel({ adapter = LOCAL_CONTACT_ADAPTER }: ContactFormPanelProps) {
  const [form, setForm] = useState<ContactFormPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ id: string; message: string } | null>(null);

  const update = (key: keyof ContactFormPayload, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await adapter.submit(form);
      if (result.success) {
        setConfirmed({
          id: result.referenceId ?? "contact-confirmed",
          message: result.message ?? "Message received.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="ct-form ct-form--success" role="status" aria-live="polite">
        <p className="ct-form__success-badge">Message sent</p>
        <h3 className="ct-form__success-title">Thanks — we&apos;ll be in touch.</h3>
        <p className="ct-form__success-lead">
          Your {CONTACT_REASONS.find((r) => r.value === form.reason)?.label ?? form.reason} enquiry
          is with the right team. Reference: <strong>{confirmed.id}</strong>
        </p>
        <button
          type="button"
          className="home-btn home-btn--primary"
          onClick={() => {
            setConfirmed(null);
            setForm(EMPTY_FORM);
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="ct-form" id="contact-form" noValidate onSubmit={(e) => void submit(e)}>
      <div className="ct-form__grid">
        <FormField
          id="ct-name"
          label="Name"
          required
          value={form.name}
          error={errors.name}
          onChange={(v) => update("name", v)}
          autoComplete="name"
        />
        <FormField
          id="ct-company"
          label="Company"
          required
          value={form.company}
          error={errors.company}
          onChange={(v) => update("company", v)}
          autoComplete="organization"
        />
        <FormField
          id="ct-email"
          label="Business Email"
          type="email"
          required
          value={form.email}
          error={errors.email}
          onChange={(v) => update("email", v)}
          autoComplete="email"
        />
        <FormField
          id="ct-phone"
          label="Phone"
          type="tel"
          value={form.phone}
          error={errors.phone}
          onChange={(v) => update("phone", v)}
          autoComplete="tel"
        />
        <FormField
          id="ct-country"
          label="Country"
          required
          value={form.country}
          error={errors.country}
          onChange={(v) => update("country", v)}
          autoComplete="country-name"
        />
        <div className="ct-form__field">
          <label htmlFor="ct-industry">
            Industry <span className="sr-only">(required)</span>
          </label>
          <select
            id="ct-industry"
            className="ct-form__select"
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
          >
            <option value="">Select industry</option>
            {CONTACT_INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
          {errors.industry ? (
            <p className="ct-form__error" role="alert">
              {errors.industry}
            </p>
          ) : null}
        </div>
      </div>

      <fieldset className="ct-form__reasons">
        <legend>Reason for Contact</legend>
        {errors.reason ? (
          <p className="ct-form__error" role="alert">
            {errors.reason}
          </p>
        ) : null}
        <div className="ct-form__reason-grid">
          {CONTACT_REASONS.map((reason) => (
            <label
              key={reason.value}
              className={cn("ct-form__reason", form.reason === reason.value && "is-selected")}
            >
              <input
                type="radio"
                name="reason"
                value={reason.value}
                checked={form.reason === reason.value}
                onChange={() => update("reason", reason.value as ContactReason)}
              />
              <span>{reason.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="ct-form__field ct-form__field--full">
        <label htmlFor="ct-message">
          Message <span className="sr-only">(required)</span>
        </label>
        <textarea
          id="ct-message"
          className="ct-form__textarea"
          rows={5}
          value={form.message}
          placeholder="Tell us about your business, current tools, and what you're looking to achieve…"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "ct-message-error" : undefined}
          onChange={(e) => update("message", e.target.value)}
        />
        {errors.message ? (
          <p id="ct-message-error" className="ct-form__error" role="alert">
            {errors.message}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        className="home-btn home-btn--primary ct-form__submit"
        disabled={submitting}
      >
        {submitting ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="ct-form__field">
      <label htmlFor={id}>
        {label}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        className="ct-form__input"
        value={value}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} className="ct-form__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
