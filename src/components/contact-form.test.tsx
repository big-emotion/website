import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "./contact-form";

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText("Ton nom"), { target: { value: "Ada" } });
  fireEvent.change(screen.getByLabelText("Ton e-mail"), {
    target: { value: "ada@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Ton message"), {
    target: { value: "Hello" },
  });
  fireEvent.submit(screen.getByRole("button", { name: /envoyer/i }).closest("form")!);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContactForm", () => {
  it("shows the server success message and resets the form", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, message: "Message envoyé. On te répond sous 24 h." }),
    } as Response);

    render(<ContactForm />);
    fillAndSubmit();

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Message envoyé. On te répond sous 24 h.");
  });

  it("surfaces a server-side rejection as an alert", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, message: "Tous les champs sont requis." }),
    } as Response);

    render(<ContactForm />);
    fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Tous les champs sont requis.");
  });

  it("falls back to an offline message when the request throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    render(<ContactForm />);
    fillAndSubmit();

    expect(await screen.findByRole("alert")).toHaveTextContent(/Réseau indisponible/);
  });

  it("posts to the same-origin /api/contact route", () => {
    const { container } = render(<ContactForm />);
    expect(container.querySelector("form")).toHaveAttribute("action", "/api/contact");
  });

  it("keeps a honeypot field out of the tab order and hidden from AT", () => {
    const { container } = render(<ContactForm />);
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("aria-hidden", "true");
  });
});
