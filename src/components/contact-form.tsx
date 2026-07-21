"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { site } from "@/content/site";

type Status = "idle" | "submitting" | "success" | "error";

// Posts to the same-origin /api/contact route handler. Works without JS via the form
// action; JS upgrades it to an async submit with inline feedback.
//
// The route answers in French only (its copy is ported from the retired contact.php), so
// the outcome is read from the HTTP status and phrased here in the visitor's language
// rather than echoed from the response body.
export function ContactForm() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "X-Requested-With": "fetch", Accept: "application/json" },
      });

      if (res.ok) {
        setStatus("success");
        form.reset();
        return;
      }

      setStatus("error");
      setError(res.status === 429 ? t("errorRateLimit") : t("errorGeneric"));
    } catch {
      // Only a request that never got an answer lands here — anything the server did
      // reply, however badly, is handled above and must not read as "you are offline".
      setStatus("error");
      setError(t("errorNetwork", { email: site.contact.email }));
    }
  }

  if (status === "success") {
    return (
      <p role="status" className="font-display text-2xl md:text-3xl">
        {t("success")} ✶
      </p>
    );
  }

  return (
    <form
      action="/api/contact"
      method="post"
      onSubmit={handleSubmit}
      className="grid gap-4"
      noValidate
    >
      {/* Honeypot — visually hidden, off the tab order. Bots fill it; humans don't. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <Field name="name" label={t("nameLabel")} type="text" autoComplete="name" />
      <Field name="email" label={t("emailLabel")} type="email" autoComplete="email" />

      <label className="grid gap-2">
        <span className="font-display text-sm uppercase tracking-wide">{t("messageLabel")}</span>
        <textarea
          name="message"
          required
          rows={4}
          className="border-2 border-ink bg-transparent px-4 py-3 text-lg focus:bg-ink/5"
        />
      </label>

      {status === "error" && (
        <p role="alert" className="font-display text-sm text-tangerine">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="font-display mt-2 w-full bg-ink px-6 py-4 text-lg uppercase tracking-wide text-lemon transition-opacity hover:opacity-80 disabled:opacity-50 sm:w-auto"
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type,
  autoComplete,
}: {
  name: string;
  label: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-display text-sm uppercase tracking-wide">{label}</span>
      <input
        type={type}
        name={name}
        required
        autoComplete={autoComplete}
        className="border-2 border-ink bg-transparent px-4 py-3 text-lg focus:bg-ink/5"
      />
    </label>
  );
}
