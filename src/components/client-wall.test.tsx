import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { clients } from "@/content/site";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import { ClientWall } from "./client-wall";

const messages = { fr, en };

function renderWall(locale: "fr" | "en" = "fr") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      <ClientWall />
    </NextIntlClientProvider>,
  );
}

const announcedRows = () =>
  screen.getAllByRole("list").filter((list) => list.getAttribute("aria-hidden") !== "true");

describe("ClientWall", () => {
  it("credits every brand the agency has worked with", () => {
    renderWall();
    for (const brand of clients) {
      expect(screen.getAllByText(brand).length).toBeGreaterThan(0);
    }
  });

  it("states the roster once, however many times it is repeated on screen", () => {
    renderWall();
    const [row, ...extra] = announcedRows();
    expect(extra).toHaveLength(0);
    expect(within(row).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      ...clients,
    ]);
  });

  it("carries the full roster in every row, so no row is narrower than a wide viewport", () => {
    renderWall();
    for (const list of screen.getAllByRole("list", { hidden: true })) {
      expect(within(list).getAllByRole("listitem", { hidden: true })).toHaveLength(
        clients.length,
      );
    }
  });

  it("titles the wall in French for a French visitor", () => {
    renderWall("fr");
    expect(
      screen.getByRole("heading", { name: "Ils nous ont fait confiance" }),
    ).toBeInTheDocument();
  });

  it("titles the wall in English for an English visitor", () => {
    renderWall("en");
    expect(screen.getByRole("heading", { name: "They trusted us" })).toBeInTheDocument();
  });
});
