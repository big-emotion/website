"use client";

import { type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Withholds the footer band from the home page.
 *
 * Home is a full-bleed scroll story that closes on its final beat — the mark docked
 * over the closing manifesto, the giant wordmark bleeding off every edge. A lemon
 * band stacked under that reads as a second ending, and the reference one-pager has
 * none. Every other route keeps its footer.
 *
 * This is a client component because a server layout cannot know which route it is
 * wrapping. The alternative — a route group — would move six directories and rewrite
 * thirteen relative imports to express the same thing. The locale-aware `usePathname`
 * matters: it reports "/" for both `/` and `/en/`.
 */
export function FooterSlot({ children }: { children: ReactNode }) {
  return usePathname() === "/" ? null : <>{children}</>;
}
