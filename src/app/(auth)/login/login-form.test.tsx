import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const NEUTRAL_MESSAGE =
  "Si cette adresse est provisionnée, un lien de connexion vient d'être envoyé.";

function fillAndSubmit(email: string) {
  fireEvent.change(screen.getByLabelText(/e-mail/i), {
    target: { value: email },
  });
  fireEvent.submit(screen.getByRole("button", { name: /recevoir/i }).closest("form")!);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LoginForm", () => {
  it("shows the same neutral message for a provisioned email", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ message: NEUTRAL_MESSAGE }),
    } as Response);

    render(<LoginForm />);
    fillAndSubmit("contact@big-emotion.com");

    expect(await screen.findByRole("status")).toHaveTextContent(NEUTRAL_MESSAGE);
  });

  it("shows the identical neutral message for an unknown email", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ message: NEUTRAL_MESSAGE }),
    } as Response);

    render(<LoginForm />);
    fillAndSubmit("nobody@example.com");

    expect(await screen.findByRole("status")).toHaveTextContent(NEUTRAL_MESSAGE);
  });

  it("falls back to a generic message when the request fails outright", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    render(<LoginForm />);
    fillAndSubmit("contact@big-emotion.com");

    expect(await screen.findByRole("alert")).toHaveTextContent(/réessaie/i);
  });

  it("posts the trimmed email as JSON to /api/auth/request-link", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ message: NEUTRAL_MESSAGE }),
    } as Response);

    render(<LoginForm />);
    fillAndSubmit("  contact@big-emotion.com  ");

    await screen.findByRole("status");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/request-link",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "contact@big-emotion.com" }),
      }),
    );
  });
});
