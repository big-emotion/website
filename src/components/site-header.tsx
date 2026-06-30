"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { nav } from "@/content/site";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Solid bar once scrolled off the hero. We drive legibility with a real background
  // and a fixed text colour instead of mix-blend-difference, which was unreadable over
  // the tangerine section and forced a per-frame repaint on scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Treat the open mobile menu as a modal: Escape closes it, focus moves in on open and
  // back to the toggle on close, and Tab is trapped within the header (the overlay
  // covers the page, so focus must not wander into the hidden content behind it).
  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    if (!header) return;
    const toggle = toggleRef.current; // capture for the cleanup (ref may change later)

    // Visible only: the desktop nav links are display:none on mobile, so getClientRects
    // excludes them (offsetParent can't be used — the overlay is position:fixed).
    const focusables = () =>
      Array.from(
        header.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      ).filter((el) => el.getClientRects().length > 0);

    header.querySelector<HTMLElement>("#mobile-nav a")?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      toggle?.focus();
    };
  }, [open]);

  const textColor = scrolled || open ? "text-paper" : "text-ink";
  const background = scrolled && !open ? "bg-ink" : "";

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${textColor} ${background}`}
    >
      <div className="relative z-50 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link
          href="/"
          aria-label="BIG EMOTION — accueil"
          onClick={() => setOpen(false)}
        >
          <Wordmark className="text-[1.45rem] md:text-2xl" />
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-8">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-display text-sm uppercase tracking-wide hover:opacity-60"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="font-display -m-2 inline-flex min-h-11 min-w-11 items-center justify-end p-2 text-sm uppercase tracking-wide md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Menu principal"
          className="fixed inset-0 z-40 flex flex-col justify-center gap-2 bg-ink px-6 text-paper md:hidden"
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
