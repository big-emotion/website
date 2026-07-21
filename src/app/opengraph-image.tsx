import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Next prerenders metadata image routes (opengraph-image) to a static PNG at build
// time, even under `output: export`: the export pipeline exempts metadata routes from
// its static-generation bail-out and writes the rendered bytes straight into out/.
// So this share card ships as a real PNG with no server runtime on n0c.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "B!G EMOTION — The B!G agency that gives a wow.";

// Required under `output: export`: the route generated for a dynamic opengraph-image
// carries no dynamic config of its own, so we opt it into build-time prerendering
// explicitly. Without this the export build aborts in page-data collection.
export const dynamic = "force-static";

const LEMON = "#f2ff26";

// satori (the engine behind next/og) only parses TrueType/OTF/WOFF1 — it throws
// "Unsupported OpenType signature" on a WOFF2 file, and under `output: export` that
// throw aborts the whole build. BBH Hegarty ships both a WOFF2 (for next/font/local)
// and a WOFF1 build (for satori); read the WOFF1 file here and hand it to satori
// only when its 4-byte signature is one satori accepts, falling back to the bundled
// default face otherwise.
const SATORI_FONT_SIGNATURES = new Set([
  "\x00\x01\x00\x00", // TrueType
  "true",
  "typ1",
  "OTTO", // CFF / OpenType
  "wOFF", // WOFF1
]);

function loadDisplayFont(): Buffer | null {
  const file = readFileSync(
    join(process.cwd(), "src/app/fonts/bbh-hegarty-latin.woff"),
  );
  const signature = file.subarray(0, 4).toString("latin1");
  return SATORI_FONT_SIGNATURES.has(signature) ? file : null;
}

export default function OpengraphImage() {
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
            // BBH Hegarty ships a single static weight (400); satori only resolves
            // a custom face when the requested weight matches a registered one.
            fontWeight: 400,
            fontSize: 168,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: LEMON,
          }}
        >
          B!G EMOTION
        </div>
        <div
          style={{
            ...displayFamily,
            fontWeight: 400,
            fontSize: 52,
            marginTop: 36,
            color: "#fff",
          }}
        >
          The B!G agency that gives a wow.
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
