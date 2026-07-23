// @vitest-environment node
//
// The default jsdom environment (vitest.config.ts) swaps in cross-realm
// Uint8Array/ArrayBuffer globals that break the wasm PNG encoder ImageResponse
// calls internally; forcing Node here lets the response body actually resolve
// so Satori's own layout validation (see the assertion below) can run.
import { describe, expect, it, vi } from "vitest";
import type { PlaygroundEffect } from "@/components/playground/effects";

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
  component: null as unknown as PlaygroundEffect["component"],
};

vi.mock("@/components/playground/effects", () => ({
  playgroundEffects: [mockEffect],
}));

const { default: OpengraphImage, generateStaticParams, size, contentType } = await import(
  "./opengraph-image"
);

describe("playground effect opengraph-image", () => {
  it("declares the standard OG image dimensions and content type", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
  });

  it("renders a response for a registered effect, in the locale of the route", async () => {
    const response = await OpengraphImage({
      params: Promise.resolve({ locale: "en", effect: "mock-ripple" }),
    });

    expect(response).toBeInstanceOf(Response);
    // ImageResponse defers the Satori render to the stream body, so an invalid
    // layout (e.g. a multi-child div missing `display: flex`) only throws once
    // the body is actually read — matching what happens during `pnpm build`'s
    // static prerender. Consuming it here is what makes this test catch that.
    await expect(response.arrayBuffer()).resolves.toBeInstanceOf(ArrayBuffer);
  });

  it("404s for a slug with no registry entry", async () => {
    await expect(
      OpengraphImage({ params: Promise.resolve({ locale: "en", effect: "unknown-slug" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("pre-renders every registered effect's card in every locale", async () => {
    const params = await generateStaticParams();

    expect(params).toEqual([
      { locale: "fr", effect: "mock-ripple" },
      { locale: "en", effect: "mock-ripple" },
    ]);
  });
});
