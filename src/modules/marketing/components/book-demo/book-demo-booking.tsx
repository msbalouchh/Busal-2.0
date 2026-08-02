"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DEMO_INDUSTRIES,
  DEMO_INTERESTS,
  DEMO_TIME_SLOTS,
  DEMO_TIMEZONES,
} from "@/modules/marketing/components/book-demo/book-demo-data";
import {
  LOCAL_DEMO_BOOKING_ADAPTER,
  type DemoBookingAdapter,
  type DemoBookingBusinessInfo,
  type DemoBookingPayload,
} from "@/modules/marketing/components/book-demo/book-demo-types";

type Step = 1 | 2 | 3 | 4;

type FieldErrors = Partial<
  Record<keyof DemoBookingBusinessInfo | "date" | "time" | "timezone" | "interests", string>
>;

const EMPTY_BUSINESS: DemoBookingBusinessInfo = {
  businessName: "",
  industry: "",
  country: "",
  locations: "",
  employees: "",
  currentSoftware: "",
  monthlyOrders: "",
  website: "",
  firstName: "",
  lastName: "",
  workEmail: "",
  phone: "",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function buildCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = (first.getDay() + 6) % 7;
  const days: Array<{ date: Date | null; value: string }> = [];

  for (let i = 0; i < startPad; i++) days.push({ date: null, value: "" });
  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, month, d, 12);
    days.push({ date, value: date.toISOString().slice(0, 10) });
  }
  return days;
}

function isSelectableDate(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekday = date.getDay();
  return date >= today && weekday !== 0 && weekday !== 6;
}

function validateStep(
  step: Step,
  schedule: DemoBookingPayload["schedule"],
  business: DemoBookingBusinessInfo,
  interests: string[],
): FieldErrors {
  const errors: FieldErrors = {};

  if (step >= 1) {
    if (!schedule.date) errors.date = "Select a date.";
    if (!schedule.time) errors.time = "Select a time.";
    if (!schedule.timezone) errors.timezone = "Select a timezone.";
  }

  if (step >= 2) {
    if (business.businessName.trim().length < 2) errors.businessName = "Enter your business name.";
    if (!business.industry) errors.industry = "Select an industry.";
    if (business.country.trim().length < 2) errors.country = "Enter your country.";
    if (business.firstName.trim().length < 2) errors.firstName = "Enter your first name.";
    if (business.lastName.trim().length < 2) errors.lastName = "Enter your last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(business.workEmail.trim())) {
      errors.workEmail = "Enter a valid work email.";
    }
    if (business.phone && business.phone.replace(/\D/g, "").length < 8) {
      errors.phone = "Enter a valid phone number.";
    }
  }

  if (step >= 3 && interests.length === 0) {
    errors.interests = "Select at least one area to explore.";
  }

  return errors;
}

type BookDemoBookingProps = {
  /** Swap adapter when connecting Calendly, Google Calendar, HubSpot, or Busal API. */
  adapter?: DemoBookingAdapter;
};

export function BookDemoBooking({ adapter = LOCAL_DEMO_BOOKING_ADAPTER }: BookDemoBookingProps) {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmed, setConfirmed] = useState<{ id: string; message: string } | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [schedule, setSchedule] = useState<DemoBookingPayload["schedule"]>({
    date: "",
    time: "",
    timezone: DEMO_TIMEZONES[0].value,
  });
  const [business, setBusiness] = useState<DemoBookingBusinessInfo>(EMPTY_BUSINESS);
  const [interests, setInterests] = useState<string[]>([]);

  const calendarDays = useMemo(
    () => buildCalendarDays(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month],
  );

  const monthLabel = useMemo(
    () =>
      new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }),
    [viewMonth.year, viewMonth.month],
  );

  const selectedDateLabel = useMemo(() => {
    if (!schedule.date) return "";
    return new Date(`${schedule.date}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [schedule.date]);

  const updateBusiness = (key: keyof DemoBookingBusinessInfo, value: string) => {
    setBusiness((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
    setErrors((prev) => ({ ...prev, interests: undefined }));
  };

  const goNext = () => {
    const nextErrors = validateStep(step, schedule, business, interests);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setStep((s) => Math.min(4, s + 1) as Step);
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1) as Step);

  const submit = async () => {
    const nextErrors = validateStep(4, schedule, business, interests);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload: DemoBookingPayload = { schedule, business, interests };

    setSubmitting(true);
    try {
      const result = await adapter.submit(payload);
      if (result.success) {
        setConfirmed({
          id: result.confirmationId ?? "demo-confirmed",
          message: result.message ?? "Demo request received.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="bd-form bd-form--success" role="status" aria-live="polite">
        <p className="bd-form__success-badge">Confirmed</p>
        <h3 className="bd-form__success-title">Your demo is scheduled.</h3>
        <p className="bd-form__success-lead">
          Thanks {business.firstName}. We&apos;ve reserved{" "}
          <strong>
            {selectedDateLabel} at {schedule.time}
          </strong>{" "}
          ({DEMO_TIMEZONES.find((t) => t.value === schedule.timezone)?.label ?? schedule.timezone})
          for {business.businessName}. A Busal specialist will email {business.workEmail} with a
          calendar invite within one business day.
        </p>
        <dl className="bd-form__summary">
          <div>
            <dt>Business</dt>
            <dd>{business.businessName}</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd>
              {selectedDateLabel} · {schedule.time}
            </dd>
          </div>
          <div>
            <dt>Focus areas</dt>
            <dd>{interests.join(", ")}</dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd>{confirmed.id}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="home-btn home-btn--primary"
          onClick={() => {
            setConfirmed(null);
            setStep(1);
            setSchedule({ date: "", time: "", timezone: DEMO_TIMEZONES[0].value });
            setBusiness(EMPTY_BUSINESS);
            setInterests([]);
          }}
        >
          Book another demo
        </button>
      </div>
    );
  }

  return (
    <div className="bd-form" id="book-demo-form">
      <div className="bd-form__progress" aria-label={`Step ${step} of 4`}>
        {(["Schedule", "Business", "Interests", "Confirm"] as const).map((label, i) => {
          const n = (i + 1) as Step;
          return (
            <div
              key={label}
              className={cn("bd-form__step", step >= n && "is-active", step > n && "is-done")}
            >
              <span>{n}</span>
              <p>{label}</p>
            </div>
          );
        })}
      </div>

      {step === 1 ? (
        <div className="bd-form__panel">
          <h3 className="bd-form__heading">Select date &amp; time</h3>
          <p className="bd-form__sub">Choose a preferred slot for your 30-minute demo.</p>

          <div className="bd-cal">
            <div className="bd-cal__nav">
              <button
                type="button"
                className="bd-cal__nav-btn"
                aria-label="Previous month"
                onClick={() =>
                  setViewMonth((m) => {
                    const d = new Date(m.year, m.month - 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <strong>{monthLabel}</strong>
              <button
                type="button"
                className="bd-cal__nav-btn"
                aria-label="Next month"
                onClick={() =>
                  setViewMonth((m) => {
                    const d = new Date(m.year, m.month + 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bd-cal__weekdays">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="bd-cal__grid" role="grid">
              {calendarDays.map((day, i) => {
                if (!day.date) return <span key={`empty-${i}`} className="bd-cal__empty" />;
                const selectable = isSelectableDate(day.date);
                const selected = schedule.date === day.value;
                return (
                  <button
                    key={day.value}
                    type="button"
                    role="gridcell"
                    disabled={!selectable}
                    aria-selected={selected}
                    aria-label={day.date.toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    className={cn(
                      "bd-cal__day",
                      selected && "is-selected",
                      !selectable && "is-disabled",
                    )}
                    onClick={() => {
                      setSchedule((s) => ({ ...s, date: day.value }));
                      setErrors((e) => ({ ...e, date: undefined }));
                    }}
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>
            {errors.date ? (
              <p className="bd-form__error" role="alert">
                {errors.date}
              </p>
            ) : null}
          </div>

          <div className="bd-form__field">
            <label htmlFor="bd-timezone">Timezone</label>
            <select
              id="bd-timezone"
              className="bd-form__select"
              value={schedule.timezone}
              onChange={(e) => {
                setSchedule((s) => ({ ...s, timezone: e.target.value }));
                setErrors((err) => ({ ...err, timezone: undefined }));
              }}
            >
              {DEMO_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            {errors.timezone ? (
              <p className="bd-form__error" role="alert">
                {errors.timezone}
              </p>
            ) : null}
          </div>

          <fieldset className="bd-form__fieldset">
            <legend>Available times</legend>
            {errors.time ? (
              <p className="bd-form__error" role="alert">
                {errors.time}
              </p>
            ) : null}
            <div className="bd-times" role="radiogroup" aria-label="Select time">
              {DEMO_TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  role="radio"
                  aria-checked={schedule.time === slot}
                  className={cn("bd-times__slot", schedule.time === slot && "is-selected")}
                  onClick={() => {
                    setSchedule((s) => ({ ...s, time: slot }));
                    setErrors((e) => ({ ...e, time: undefined }));
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="bd-form__actions">
            <button type="button" className="home-btn home-btn--primary" onClick={goNext}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="bd-form__panel">
          <h3 className="bd-form__heading">Business information</h3>
          <p className="bd-form__sub">Tell us about your business so we can tailor the demo.</p>

          <div className="bd-form__grid">
            <FormField
              id="bd-business"
              label="Business Name"
              required
              value={business.businessName}
              error={errors.businessName}
              onChange={(v) => updateBusiness("businessName", v)}
              autoComplete="organization"
            />
            <div className="bd-form__field">
              <label htmlFor="bd-industry">
                Industry <span className="sr-only">(required)</span>
              </label>
              <select
                id="bd-industry"
                className="bd-form__select"
                value={business.industry}
                onChange={(e) => updateBusiness("industry", e.target.value)}
              >
                <option value="">Select industry</option>
                {DEMO_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              {errors.industry ? (
                <p className="bd-form__error" role="alert">
                  {errors.industry}
                </p>
              ) : null}
            </div>
            <FormField
              id="bd-country"
              label="Country"
              required
              value={business.country}
              error={errors.country}
              onChange={(v) => updateBusiness("country", v)}
              autoComplete="country-name"
            />
            <FormField
              id="bd-locations"
              label="Number of Locations"
              value={business.locations}
              onChange={(v) => updateBusiness("locations", v)}
              placeholder="e.g. 3"
            />
            <FormField
              id="bd-employees"
              label="Employees"
              value={business.employees}
              onChange={(v) => updateBusiness("employees", v)}
              placeholder="e.g. 25"
            />
            <FormField
              id="bd-software"
              label="Current Software"
              value={business.currentSoftware}
              onChange={(v) => updateBusiness("currentSoftware", v)}
              placeholder="e.g. Square, Toast, Excel"
            />
            <FormField
              id="bd-orders"
              label="Monthly Orders"
              value={business.monthlyOrders}
              onChange={(v) => updateBusiness("monthlyOrders", v)}
              placeholder="e.g. 5,000"
            />
            <FormField
              id="bd-website"
              label="Business Website"
              type="url"
              value={business.website}
              onChange={(v) => updateBusiness("website", v)}
              placeholder="https://"
              autoComplete="url"
            />
            <FormField
              id="bd-first"
              label="First Name"
              required
              value={business.firstName}
              error={errors.firstName}
              onChange={(v) => updateBusiness("firstName", v)}
              autoComplete="given-name"
            />
            <FormField
              id="bd-last"
              label="Last Name"
              required
              value={business.lastName}
              error={errors.lastName}
              onChange={(v) => updateBusiness("lastName", v)}
              autoComplete="family-name"
            />
            <FormField
              id="bd-email"
              label="Work Email"
              type="email"
              required
              value={business.workEmail}
              error={errors.workEmail}
              onChange={(v) => updateBusiness("workEmail", v)}
              autoComplete="email"
            />
            <FormField
              id="bd-phone"
              label="Phone Number"
              type="tel"
              value={business.phone}
              error={errors.phone}
              onChange={(v) => updateBusiness("phone", v)}
              autoComplete="tel"
            />
          </div>

          <div className="bd-form__actions">
            <button type="button" className="home-btn home-btn--secondary" onClick={goBack}>
              Back
            </button>
            <button type="button" className="home-btn home-btn--primary" onClick={goNext}>
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="bd-form__panel">
          <h3 className="bd-form__heading">What would you like to see?</h3>
          <p className="bd-form__sub">
            Select the areas you&apos;d like us to focus on during your demo.
          </p>

          {errors.interests ? (
            <p className="bd-form__error" role="alert">
              {errors.interests}
            </p>
          ) : null}

          <div className="bd-interests">
            {DEMO_INTERESTS.map((item) => {
              const checked = interests.includes(item);
              return (
                <label key={item} className={cn("bd-interests__item", checked && "is-checked")}>
                  <input type="checkbox" checked={checked} onChange={() => toggleInterest(item)} />
                  <span>{item}</span>
                </label>
              );
            })}
          </div>

          <div className="bd-form__actions">
            <button type="button" className="home-btn home-btn--secondary" onClick={goBack}>
              Back
            </button>
            <button type="button" className="home-btn home-btn--primary" onClick={goNext}>
              Review booking
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="bd-form__panel">
          <h3 className="bd-form__heading">Confirm your demo</h3>
          <p className="bd-form__sub">Review your details before submitting.</p>

          <dl className="bd-form__review">
            <div>
              <dt>Date &amp; time</dt>
              <dd>
                {selectedDateLabel} at {schedule.time} (
                {DEMO_TIMEZONES.find((t) => t.value === schedule.timezone)?.label})
              </dd>
            </div>
            <div>
              <dt>Business</dt>
              <dd>
                {business.businessName} · {business.industry} · {business.country}
              </dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>
                {business.firstName} {business.lastName} · {business.workEmail}
                {business.phone ? ` · ${business.phone}` : ""}
              </dd>
            </div>
            <div>
              <dt>Focus areas</dt>
              <dd>{interests.join(", ")}</dd>
            </div>
          </dl>

          <p className="bd-form__note">
            By submitting, you agree to be contacted about your demo. A Busal specialist will
            confirm your session by email within one business day.
          </p>

          <div className="bd-form__actions">
            <button type="button" className="home-btn home-btn--secondary" onClick={goBack}>
              Back
            </button>
            <button
              type="button"
              className="home-btn home-btn--primary"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? "Booking…" : "Book Your Demo"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
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
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="bd-form__field">
      <label htmlFor={id}>
        {label}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        className="bd-form__input"
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} className="bd-form__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
