"use client";

import { useId, useRef, useState } from "react";

import { CONTACT } from "@/content/site";

import styles from "./ContactForm.module.css";

/** How long the fake send takes, so the pending state is visible. */
const SUBMIT_DELAY_MS = 650;

type FieldName = "name" | "email" | "company" | "message";
type Errors = Partial<Record<FieldName, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: Record<FieldName, string>): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = CONTACT.errors.name;
  if (!values.email.trim()) errors.email = CONTACT.errors.email;
  else if (!EMAIL_PATTERN.test(values.email.trim()))
    errors.email = CONTACT.errors.emailFormat;
  if (!values.message.trim()) errors.message = CONTACT.errors.message;
  return errors;
}

const EMPTY: Record<FieldName, string> = {
  name: "",
  email: "",
  company: "",
  message: "",
};

/**
 * The contact form.
 *
 * ⚠ THIS FORM DOES NOT SEND ANYTHING. By decision for this build it validates,
 * shows a pending state, and then shows the success state. Nothing leaves the
 * browser.
 *
 * To wire it up for real, replace the body of `submit()` below with a fetch to
 * whatever you use — a Next route handler at app/api/contact/route.ts, Resend,
 * Formspree, a CRM endpoint — and surface a failure state alongside the
 * success one. Everything else here (validation, focus management, the live
 * region, the reset) already behaves the way it will need to.
 */
export function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [checked, setChecked] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const fieldId = (name: FieldName) => `${baseId}-${name}`;
  const errorId = (name: FieldName) => `${baseId}-${name}-error`;

  const setField = (name: FieldName) => (value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Once a field has been flagged, clear the flag as soon as it is fixed.
    if (checked) {
      setErrors(validate({ ...values, [name]: value }));
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The button is aria-disabled rather than disabled, so it still submits.
    if (status === "sending") return;

    const found = validate(values);
    setErrors(found);
    setChecked(true);

    if (Object.keys(found).length > 0) {
      // Send focus to the first thing that needs fixing.
      const first = Object.keys(found)[0] as FieldName;
      formRef.current
        ?.querySelector<HTMLElement>(`#${CSS.escape(fieldId(first))}`)
        ?.focus();
      return;
    }

    setStatus("sending");
    window.setTimeout(() => {
      setStatus("sent");
      // Move focus into the confirmation so it is not lost or silent.
      window.setTimeout(() => successRef.current?.focus(), 0);
    }, SUBMIT_DELAY_MS);
  };

  const reset = () => {
    setValues(EMPTY);
    setErrors({});
    setChecked(false);
    setStatus("idle");
  };

  if (status === "sent") {
    return (
      <div className={styles.card}>
        <div
          className={styles.success}
          ref={successRef}
          tabIndex={-1}
          role="status"
        >
          <h3 className={styles.successHeading}>{CONTACT.success.heading}</h3>
          <p className={styles.successBody}>{CONTACT.success.body}</p>
          <button type="button" className={styles.again} onClick={reset}>
            {CONTACT.success.again}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className={styles.card}
      onSubmit={submit}
      noValidate
      aria-labelledby={`${baseId}-heading`}
    >
      <div>
        <p className={styles.eyebrow}>{CONTACT.eyebrow}</p>
        {/* An h2, not an h3. This is the site's only conversion; nesting it
            under the testimonials heading buried it in the outline. */}
        <h2 id={`${baseId}-heading`} className={styles.heading}>
          {CONTACT.heading}
        </h2>
      </div>

      <fieldset className={styles.fields}>
        <legend className="srOnly">{CONTACT.heading}</legend>

        <Field
          name="name"
          label={CONTACT.fields.name.label}
          placeholder={CONTACT.fields.name.placeholder}
          autoComplete="name"
          value={values.name}
          error={checked ? errors.name : undefined}
          onChange={setField("name")}
          fieldId={fieldId}
          errorId={errorId}
        />

        <Field
          name="email"
          type="email"
          label={CONTACT.fields.email.label}
          placeholder={CONTACT.fields.email.placeholder}
          autoComplete="email"
          value={values.email}
          error={checked ? errors.email : undefined}
          onChange={setField("email")}
          fieldId={fieldId}
          errorId={errorId}
        />

        <Field
          name="company"
          wide
          optional
          label={CONTACT.fields.company.label}
          placeholder={CONTACT.fields.company.placeholder}
          autoComplete="organization"
          value={values.company}
          onChange={setField("company")}
          fieldId={fieldId}
          errorId={errorId}
        />

        <Field
          name="message"
          wide
          multiline
          label={CONTACT.fields.message.label}
          placeholder={CONTACT.fields.message.placeholder}
          value={values.message}
          error={checked ? errors.message : undefined}
          onChange={setField("message")}
          fieldId={fieldId}
          errorId={errorId}
        />
      </fieldset>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submit}
          /* aria-disabled rather than disabled: a disabled button loses focus
             to <body> mid-submit, which strands keyboard and screen-reader
             users with nothing announced. The handler guards instead. */
          aria-disabled={status === "sending"}
          data-busy={status === "sending" ? "true" : undefined}
        >
          {status === "sending" ? CONTACT.sending : CONTACT.submit}
        </button>
        <p className={styles.promise}>{CONTACT.intro}</p>
      </div>

      {/* Announces the pending state; the success state has its own region. */}
      <p className="srOnly" role="status">
        {status === "sending" ? CONTACT.sending : ""}
      </p>
    </form>
  );
}

/* ── One field ────────────────────────────────────────────────────────────── */

type FieldProps = {
  name: FieldName;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  fieldId: (name: FieldName) => string;
  errorId: (name: FieldName) => string;
  type?: string;
  autoComplete?: string;
  error?: string;
  wide?: boolean;
  multiline?: boolean;
  optional?: boolean;
};

function Field({
  name,
  label,
  placeholder,
  value,
  onChange,
  fieldId,
  errorId,
  type = "text",
  autoComplete,
  error,
  wide,
  multiline,
  optional,
}: FieldProps) {
  const id = fieldId(name);
  const describedBy = error ? errorId(name) : undefined;

  const shared = {
    id,
    name,
    value,
    placeholder,
    autoComplete,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
    "data-invalid": error ? "true" : undefined,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => onChange(event.target.value),
  };

  return (
    <div className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optional && <span className={styles.optional}>optional</span>}
      </label>

      {multiline ? (
        <textarea className={styles.textarea} rows={4} {...shared} />
      ) : (
        <input className={styles.input} type={type} {...shared} />
      )}

      {error && (
        <p className={styles.error} id={errorId(name)} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
