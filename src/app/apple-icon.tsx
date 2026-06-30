import { ImageResponse } from "next/og";

// Apple touch icon (iOS home screen). Generated as a PNG via next/og at build time —
// the same static-export-safe path as opengraph-image. iOS ignores SVG here and applies
// its own rounded-corner mask, so we ship a full-bleed black tile with the lemon B! mark.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#f2ff26",
          fontSize: 104,
          fontWeight: 800,
          letterSpacing: "-6px",
        }}
      >
        B!
      </div>
    ),
    { ...size },
  );
}
