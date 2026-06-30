"use client";

import Link from "next/link";
import { useState } from "react";
import { nav } from "@/content/site";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference text-paper">
      <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link href="/" aria-label="BIG EMOTION — accueil" onClick={() => setOpen(false)}>
          <Wordmark className="text-[1.45rem] md:text-2xl" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:items-center md:gap-8">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-display text-sm tracking-wide uppercase hover:opacity-60"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="font-display text-sm uppercase tracking-wide md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {/* Mobile full-screen nav — solid so it stays legible over any section */}
      {open && (
        <nav
          id="mobile-nav"
          className="fixed inset-0 z-40 flex flex-col justify-center gap-2 bg-ink px-6 text-paper mix-blend-normal md:hidden"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="font-display text-5xl uppercase leading-none hover:text-lemon"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
