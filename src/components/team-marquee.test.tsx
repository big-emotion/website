import { render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import fr from "../../messages/fr.json";
import { TeamMarquee } from "./team-marquee";

const members = [
  {
    name: "Jean-Noe Kollo",
    role: "Geek & philosophe",
    bio: "Il demarre toujours un projet par une citation.",
    links: [{ label: "LinkedIn", context: "sur LinkedIn", href: "https://example.com/jnk" }],
  },
  {
    name: "Sylvain Seng Bandith",
    role: "Reveur & pointilleux",
    bio: "Livrer avec une vision, sans rien lacher sur la prod.",
    links: [{ label: "LinkedIn", context: "sur LinkedIn", href: "https://example.com/ssb" }],
  },
] as const;

function renderMarquee() {
  const view = render(
    <NextIntlClientProvider locale="fr" messages={fr}>
      <TeamMarquee members={members} />
    </NextIntlClientProvider>,
  );
  // The band is the one roster a reader is offered; the rest of the track is the same
  // people printed again to close the loop, and is not in the accessibility tree.
  return { ...view, roster: within(screen.getByRole("list", { name: fr.culture.teamListLabel })) };
}

describe("TeamMarquee", () => {
  // @req REQ-008
  it("draws a fresh member order on every page load without mutating the source roster", async () => {
    const random = vi
      .spyOn(Math, "random")
      // Each mount draws one order for the single visual row.
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.999999);

    const first = renderMarquee();
    await waitFor(() => {
      expect(first.roster.getAllByRole("heading").map((heading) => heading.textContent)).toEqual([
        "Sylvain Seng Bandith",
        "Jean-Noe Kollo",
      ]);
    });
    first.unmount();

    const second = renderMarquee();
    await waitFor(() => {
      expect(second.roster.getAllByRole("heading").map((heading) => heading.textContent)).toEqual([
        "Jean-Noe Kollo",
        "Sylvain Seng Bandith",
      ]);
    });
    expect(members.map((member) => member.name)).toEqual([
      "Jean-Noe Kollo",
      "Sylvain Seng Bandith",
    ]);

    random.mockRestore();
  });

  // @req REQ-008
  it("prints one complete row in one direction", () => {
    const { container } = renderMarquee();
    const rows = [...container.querySelectorAll(".team-marquee-row")];

    expect(rows).toHaveLength(1);
    expect(rows[0].querySelector(".marquee-track")).not.toHaveClass("marquee-track--reverse");

    const copies = [...rows[0].querySelectorAll(".marquee-track > ul")];
    expect(copies).toHaveLength(2);
    for (const copy of copies) expect(copy.children).toHaveLength(members.length);
  });

  it("gives every member a name, a role, a bio and their profiles", () => {
    const { roster } = renderMarquee();

    expect(roster.getByRole("heading", { name: "Sylvain Seng Bandith" })).toBeInTheDocument();
    expect(roster.getByText("Reveur & pointilleux")).toBeInTheDocument();
    expect(roster.getByText(/sans rien lacher sur la prod/)).toBeInTheDocument();
    expect(roster.getByRole("link", { name: "Sylvain Seng Bandith sur LinkedIn" })).toHaveAttribute(
      "href",
      "https://example.com/ssb",
    );
  });

  // The band prints the roster twice to keep the scroll seamless. A screen reader or a
  // Tab key must still meet each founder exactly once.
  it("introduces each member once, however many times the band prints them", () => {
    renderMarquee();

    expect(screen.getAllByRole("heading")).toHaveLength(members.length);
    expect(screen.getAllByRole("link")).toHaveLength(members.length);
  });

  it("keeps the repeated copies out of the tab order", () => {
    const { container } = renderMarquee();

    const repeats = container.querySelectorAll("[aria-hidden='true']");
    expect(repeats.length).toBeGreaterThan(0);
    for (const repeat of repeats) expect(repeat).toHaveAttribute("inert");
  });

  it("opens every profile in a new tab without leaking the opener", () => {
    renderMarquee();

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }
  });
});
