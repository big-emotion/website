import { ImageResponse } from "next/og";

// Apple touch icon (iOS home screen). Generated as a PNG via next/og at build time —
// the same static-export-safe path as opengraph-image. iOS ignores SVG here and applies
// its own rounded-corner mask, so we ship a full-bleed black tile with the lemon "B!"
// mark. The mark is the real logo vectors (kept in sync with icon.svg), passed as a data
// URI because next/og rasterises through Satori rather than rendering an SVG element.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87 57">' +
  '<g fill="#f2ff26">' +
  '<path d="M1.34,54.88V1.23h40.54c5.62,0,9.85,1.23,12.68,3.68,2.84,2.45,4.25,5.67,4.25,9.66,0,1.99-.43,3.9-1.3,5.71-.87,1.81-2.31,3.33-4.33,4.56-2.02,1.23-4.76,1.97-8.24,2.22v1.53c5.42.31,9.36,1.6,11.84,3.87,2.48,2.27,3.72,5.15,3.72,8.62,0,4.04-1.44,7.35-4.33,9.93-2.89,2.58-6.83,3.87-11.84,3.87H1.34ZM22.5,22.15h11.11c.97,0,1.74-.28,2.3-.84.56-.56.84-1.3.84-2.22s-.28-1.66-.84-2.22c-.56-.56-1.33-.84-2.3-.84h-11.11v6.13ZM22.5,40.09h12.34c.97,0,1.74-.28,2.3-.84.56-.56.84-1.3.84-2.22s-.28-1.66-.84-2.22c-.56-.56-1.33-.84-2.3-.84h-12.34v6.13Z"/>' +
  '<rect x="63.98" y="1.23" width="19.93" height="29.06"/>' +
  '<circle cx="74" cy="44.71" r="11.39"/>' +
  "</g></svg>";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
      }}
    >
      <img
        width={120}
        height={79}
        src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`}
        alt="B!G EMOTION"
      />
    </div>,
    { ...size },
  );
}
