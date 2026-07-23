import { hasLocale } from "next-intl";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { playgroundEffects } from "@/components/playground/effects";
import { site } from "@/content/site";
import { locales } from "@/i18n/locales";
import { routing } from "@/i18n/routing";

// One card per registered effect (DEC-034): colocated opengraph-image.tsx, no
// `openGraph.images` in generateMetadata (page.tsx doesn't set it), no force-static —
// Next statically optimizes this route on its own once generateStaticParams below
// gives it a build-time-known set of params to render.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — Playground`;

const LEMON = "#f2ff26";

// satori (the engine behind next/og) only parses TrueType/OTF/WOFF1 — it throws
// "Unsupported OpenType signature" on a WOFF2 file. BBH Hegarty ships both a WOFF2
// (for next/font/local) and a WOFF1 build (for satori); read the WOFF1 file here and
// hand it to satori only when its 4-byte signature is one satori accepts, falling
// back to the bundled default face otherwise.
const SATORI_FONT_SIGNATURES = new Set([
  "\x00\x01\x00\x00", // TrueType
  "true",
  "typ1",
  "OTTO", // CFF / OpenType
  "wOFF", // WOFF1
]);

function loadDisplayFont(): Buffer | null {
  const file = readFileSync(join(process.cwd(), "src/app/fonts/bbh-hegarty-latin.woff"));
  const signature = file.subarray(0, 4).toString("latin1");
  return SATORI_FONT_SIGNATURES.has(signature) ? file : null;
}

type Props = { params: Promise<{ locale: string; effect: string }> };

export function generateStaticParams() {
  return playgroundEffects.flatMap((effect) =>
    locales.map((locale) => ({ locale, effect: effect.slug })),
  );
}

export default async function OpengraphImage({ params }: Props) {
  const { locale, effect: slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const effect = playgroundEffects.find((candidate) => candidate.slug === slug);
  if (!effect) notFound();

  const bbhHegarty = loadDisplayFont();
  // satori throws on `fontFamily: undefined` (it splits the value unconditionally),
  // so the key must be absent — not undefined — when no custom font is registered.
  const displayFamily = bbhHegarty ? { fontFamily: "BBH Hegarty" } : {};

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#000",
          padding: "0 90px",
        }}
      >
        <div
          style={{
            ...displayFamily,
            display: "flex",
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: "-0.02em",
            color: "#fff",
            opacity: 0.7,
          }}
        >
          {site.name} — Playground
        </div>
        <div
          style={{
            ...displayFamily,
            // BBH Hegarty ships a single static weight (400); satori only resolves
            // a custom face when the requested weight matches a registered one.
            fontWeight: 400,
            fontSize: 128,
            lineHeight: 1,
            marginTop: 28,
            letterSpacing: "-0.04em",
            color: LEMON,
          }}
        >
          {effect.title[locale]}
        </div>
      </div>
    ),
    {
      ...size,
      ...(bbhHegarty
        ? {
            fonts: [
              {
                name: "BBH Hegarty",
                data: bbhHegarty,
                weight: 400 as const,
                style: "normal" as const,
              },
            ],
          }
        : {}),
    },
  );
}
