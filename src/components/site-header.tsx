"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { content, espaceB2bHref } from "@/content/site";
import type { Locale } from "@/i18n/locales";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { SUBPAGE_ACCENTS, subpageFromPathname } from "./subpage-accents";
import { Wordmark } from "./wordmark";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = useTranslations("header");
  const { nav, espaceB2bLabel } = content[locale];
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
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
      Array.from(header.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")).filter(
        (el) => el.getClientRects().length > 0,
      );

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

  const close = () => setOpen(false);
  // Over a sub-page hero the bar has to take that page's ink, not the default: the
  // header is rendered by the layout, so it cannot inherit the accent, and `/contact/`'s
  // ink hero would otherwise render a black header on black.
  const subpage = subpageFromPathname(pathname);
  const restingInk = subpage ? SUBPAGE_ACCENTS[subpage].headerInk : "text-ink";
  const textColor = scrolled || open ? "text-paper" : restingInk;
  const background = scrolled && !open ? "bg-ink" : "";

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${textColor} ${background}`}
    >
      <div className="relative z-50 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link href="/" aria-label={t("home")} onClick={close}>
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
          <LocaleSwitcher locale={locale} />
          {/* External app (opens in a new tab); border-current keeps it legible on
              both the transparent and the scrolled solid bar. */}
          <a
            href={espaceB2bHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display border-2 border-current px-4 py-2 text-sm uppercase tracking-wide hover:opacity-60"
          >
            {espaceB2bLabel}
          </a>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="font-display -m-2 inline-flex min-h-11 min-w-11 items-center justify-end p-2 text-sm uppercase tracking-wide md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t("closeMenu") : t("openMenu")}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label={t("mainMenu")}
          className="fixed inset-0 z-40 flex flex-col justify-center gap-2 bg-ink px-6 text-paper md:hidden"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="font-display text-5xl uppercase leading-none hover:text-lemon"
            >
              {item.label}
            </Link>
          ))}
          {/* -ml-3 cancels the first option's tap-target padding so "FR" lines up with
              the left edge of the nav links above it. */}
          <LocaleSwitcher locale={locale} className="mt-6 -ml-3" onNavigate={close} />
          <a
            href={espaceB2bHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="font-display mt-6 w-fit border-2 border-current px-6 py-3 text-3xl uppercase leading-none hover:text-lemon"
          >
            {espaceB2bLabel}
          </a>
        </nav>
      )}
    </header>
  );
}
