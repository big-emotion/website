import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import { ContactForm } from "./contact-form";

const messages = { fr, en };

function renderForm(locale: "fr" | "en" = "fr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <ContactForm />
    </NextIntlClientProvider>,
  );
}

function fillAndSubmit(labels: { name: string; email: string; message: string; submit: string }) {
  fireEvent.change(screen.getByLabelText(labels.name), { target: { value: "Ada" } });
  fireEvent.change(screen.getByLabelText(labels.email), {
    target: { value: "ada@example.com" },
  });
  fireEvent.change(screen.getByLabelText(labels.message), { target: { value: "Hello" } });
  fireEvent.submit(screen.getByRole("button", { name: labels.submit }).closest("form")!);
}

const submitInFrench = () =>
  fillAndSubmit({
    name: "Ton nom",
    email: "Ton e-mail",
    message: "Ton message",
    submit: "Envoyer",
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContactForm", () => {
  it("confirms the send in the visitor's language, not the API's", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200 } as Response);

    renderForm("en");
    fillAndSubmit({
      name: "Your name",
      email: "Your email",
      message: "Your message",
      submit: "Send",
    });

    expect(await screen.findByRole("status")).toHaveTextContent("Message sent.");
  });

  it("tells a throttled visitor to come back later rather than blaming the form", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 429 } as Response);

    renderForm("fr");
    submitInFrench();

    expect(await screen.findByRole("alert")).toHaveTextContent(/Trop de messages/);
  });

  it("surfaces any other server-side rejection as a generic failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 422 } as Response);

    renderForm("fr");
    submitInFrench();

    expect(await screen.findByRole("alert")).toHaveTextContent("Une erreur est survenue. Réessaie.");
  });

  it("hands out the inbox address when the request never reaches the server", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    renderForm("fr");
    submitInFrench();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Réseau indisponible. Écris-nous à hello@big-emotion.com.",
    );
  });

  it("posts to the same-origin /api/contact route even without JavaScript", () => {
    const { container } = renderForm();
    const form = container.querySelector("form");

    expect(form).toHaveAttribute("action", "/api/contact");
    expect(form).toHaveAttribute("method", "post");
  });

  it("keeps a honeypot field out of the tab order and hidden from AT", () => {
    const { container } = renderForm();
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot).toHaveAttribute("aria-hidden", "true");
  });
});
