"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

type Reply = { ok: boolean; message: string };

function isReply(value: unknown): value is Reply {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Reply).ok === "boolean" &&
    typeof (value as Reply).message === "string"
  );
}

// Posts to the same-origin /api/contact route handler. Works without JS via the
// form action (303 back to #contact); JS upgrades it to an async submit with
// inline feedback (the {ok, message} JSON contract).
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

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
      // A 200 with a non-JSON/garbled body is a server problem, not a network one —
      // narrow it here so the user doesn't get a misleading "offline" message.
      let reply: Reply | null = null;
      try {
        const raw: unknown = await res.json();
        if (isReply(raw)) reply = raw;
      } catch {
        reply = null;
      }

      if (res.ok && reply?.ok) {
        setStatus("success");
        setMessage(reply.message);
        form.reset();
      } else {
        setStatus("error");
        setMessage(reply?.message ?? "Une erreur est survenue. Réessaie.");
      }
    } catch {
      setStatus("error");
      setMessage("Réseau indisponible. Écris-nous à contact@big-emotion.com.");
    }
  }

  if (status === "success") {
    return (
      <p role="status" className="font-display text-2xl md:text-3xl">
        {message} ✶
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

      <Field name="name" label="Ton nom" type="text" autoComplete="name" />
      <Field name="email" label="Ton e-mail" type="email" autoComplete="email" />

      <label className="grid gap-2">
        <span className="font-display text-sm uppercase tracking-wide">Ton message</span>
        <textarea
          name="message"
          required
          rows={4}
          className="border-2 border-ink bg-transparent px-4 py-3 text-lg focus:bg-ink/5"
        />
      </label>

      {status === "error" && (
        <p role="alert" className="font-display text-sm text-tangerine">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="font-display mt-2 w-full bg-ink px-6 py-4 text-lg uppercase tracking-wide text-lemon transition-opacity hover:opacity-80 disabled:opacity-50 sm:w-auto"
      >
        {status === "submitting" ? "Envoi…" : "Envoyer"}
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
