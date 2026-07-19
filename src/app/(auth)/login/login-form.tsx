"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const GENERIC_ERROR_MESSAGE = "Réseau indisponible. Réessaie dans un instant.";

export function LoginForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    setStatus("submitting");

    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(email ?? "").trim() }),
      });
      const body = (await res.json()) as { message: string };
      setStatus("success");
      setMessage(body.message);
    } catch {
      setStatus("error");
      setMessage(GENERIC_ERROR_MESSAGE);
    }
  }

  if (status === "success") {
    return <p role="status">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required />
      </div>
      <button disabled={status === "submitting"} type="submit">
        Recevoir mon lien de connexion
      </button>
      {status === "error" && <p role="alert">{message}</p>}
    </form>
  );
}
