import { render, screen, waitFor } from "@testing-library/react";
import { lazy } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PlaygroundEffect } from "@/components/playground/effects";

vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));

const notFoundError = new Error("NEXT_NOT_FOUND");
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  notFound: () => {
    throw notFoundError;
  },
}));

const mockEffect: PlaygroundEffect = {
  id: "mock-ripple",
  slug: "mock-ripple",
  title: { fr: "Ondulation", en: "Ripple" },
  description: { fr: "Un effet d'onde.", en: "A ripple effect." },
  component: lazy(() => Promise.resolve({ default: () => <div data-testid="mock-effect" /> })),
};

vi.mock("@/components/playground/effects", () => ({
  playgroundEffects: [mockEffect],
}));

const {
  default: PlaygroundEffectPage,
  generateStaticParams,
  generateMetadata,
} = await import("./page");

const renderPage = (locale: string, effect: string) =>
  PlaygroundEffectPage({ params: Promise.resolve({ locale, effect }) }).then(render);

describe("/playground/[effect]", () => {
  it("gives the effect the page's only h1, in the locale of the route", async () => {
    await renderPage("en", "mock-ripple");

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Ripple");
  });

  it("titles the page in French when routed in French", async () => {
    await renderPage("fr", "mock-ripple");

    expect(screen.getByRole("heading", { level: 1 })).toHaveAccessibleName("Ondulation");
  });

  it("mounts the registered effect via the EffectStage lazy boundary", async () => {
    await renderPage("en", "mock-ripple");

    await waitFor(() => {
      expect(screen.getByTestId("mock-effect")).toBeInTheDocument();
    });
  });

  it("404s for a slug with no registry entry", async () => {
    await expect(renderPage("en", "unknown-slug")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("pre-renders every registered effect in every locale", async () => {
    const params = await generateStaticParams();

    expect(params).toEqual([
      { locale: "fr", effect: "mock-ripple" },
      { locale: "en", effect: "mock-ripple" },
    ]);
  });
});

describe("/playground/[effect] metadata", () => {
  it("titles and describes the page with the effect's own copy", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", effect: "mock-ripple" }),
    });

    expect(metadata.title).toBe("Ripple");
    expect(metadata.description).toBe("A ripple effect.");
  });

  it("declares the effect's own canonical URL", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "fr", effect: "mock-ripple" }),
    });

    expect(metadata.alternates?.canonical).toBe("/playground/mock-ripple/");
    expect(metadata.alternates?.languages).toEqual({
      fr: "/playground/mock-ripple/",
      en: "/en/playground/mock-ripple/",
      "x-default": "/playground/mock-ripple/",
    });
  });

  it("does not set openGraph.images — the colocated opengraph-image.tsx covers it (DEC-034)", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en", effect: "mock-ripple" }),
    });

    expect(metadata.openGraph?.images).toBeUndefined();
  });

  it("404s metadata for a slug with no registry entry", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ locale: "en", effect: "unknown-slug" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
