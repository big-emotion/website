"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { content, espaceB2bHref } from "@/content/site";
import type { Locale } from "@/i18n/locales";
import { Link, usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";
import { SUBPAGE_ACCENTS, subpageFromPathname } from "./subpage-accents";

const SURFACE_INKS = new Set(["text-ink", "text-paper", "text-lemon", "text-[var(--blog-ink)]"]);
const SURFACE_BACKGROUNDS = new Set([
  "bg-lemon",
  "bg-tangerine",
  "bg-lyon",
  "bg-brutal",
  "bg-ink",
  "bg-paper",
  "bg-[var(--blog-surface)]",
]);

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = useTranslations("header");
  const { nav, espaceB2bLabel } = content[locale];
  const [open, setOpen] = useState(false);
  const [activePairing, setActivePairing] = useState<{
    ink: string | null;
    surface: string | null;
  }>({ ink: null, surface: null });
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // The fixed header reads the pairing of the surface crossing beneath its midpoint.
  // Sub-pages paint that complete pairing on the bar so their copy cannot show through.
  // Home is the exception: its closing wordmark must remain visible behind the
  // navigation, so only the B2B CTA carries the scene surface there.
  useEffect(() => {
    const updateSurfacePairing = () => {
      const sampleY = (headerRef.current?.getBoundingClientRect().height ?? 64) / 2;
      const surfaces = Array.from(
        document.querySelectorAll<HTMLElement>("[data-header-ink]"),
      ).filter((surface) => {
        const rect = surface.getBoundingClientRect();
        return rect.top <= sampleY && rect.bottom > sampleY;
      });
      const activeSurface = surfaces[surfaces.length - 1];
      const declaredInk = activeSurface?.dataset.headerInk;
      const declaredBackground = activeSurface?.dataset.headerSurface;
      setActivePairing({
        ink: declaredInk && SURFACE_INKS.has(declaredInk) ? declaredInk : null,
        surface:
          declaredBackground && SURFACE_BACKGROUNDS.has(declaredBackground)
            ? declaredBackground
            : null,
      });
    };

    updateSurfacePairing();
    window.addEventListener("scroll", updateSurfacePairing, { passive: true });
    window.addEventListener("resize", updateSurfacePairing);
    return () => {
      window.removeEventListener("scroll", updateSurfacePairing);
      window.removeEventListener("resize", updateSurfacePairing);
    };
  }, [pathname]);

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
  const restingSurface = subpage
    ? SUBPAGE_ACCENTS[subpage].headerSurface
    : pathname === "/"
      ? "bg-lemon"
      : "bg-paper";
  // Dim the link of the section you're already in ("you are here"). `subpage` is that
  // section, resolved from the path, so any route under it (`/cases/[uid]`) still marks
  // its parent. Home resolves to null, so nothing is marked there.
  const isCurrent = (href: string) => subpage !== null && href === `/${subpage}`;
  const isHome = pathname === "/";
  const surfaceInk = activePairing.ink ?? restingInk;
  const surfaceBackground = activePairing.surface ?? restingSurface;
  const textColor = open ? "text-paper" : surfaceInk;
  const backgroundColor = open ? "bg-ink" : isHome ? "bg-transparent" : surfaceBackground;
  const homeCtaBackground = !open && isHome ? surfaceBackground : "";

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${textColor} ${backgroundColor}`}
    >
      <div className="relative z-50 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link href="/" aria-label={t("home")} onClick={close}>
          <Logo className="h-10 w-auto md:h-12" />
        </Link>

        <nav className="hidden min-[1200px]:flex min-[1200px]:items-center min-[1200px]:gap-4 min-[1440px]:gap-8">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className="font-body text-[15px] font-medium uppercase tracking-[0.08em] hover:opacity-60 aria-[current=page]:opacity-40"
            >
              {item.label}
            </Link>
          ))}
          <LocaleSwitcher locale={locale} />
          {/* External app (opens in a new tab), kept typographically equal to the
              destinations so it does not turn the transparent menu into a toolbar. */}
          <a
            href={espaceB2bHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-body text-[15px] font-medium uppercase tracking-[0.08em] transition-colors duration-300 hover:opacity-60 ${homeCtaBackground}`}
          >
            {espaceB2bLabel}
          </a>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="font-body -m-2 inline-flex min-h-11 min-w-11 items-center justify-end p-2 text-[15px] font-medium uppercase tracking-[0.08em] min-[1200px]:hidden"
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
          className="fixed inset-0 z-40 flex flex-col justify-center gap-2 bg-ink px-6 text-paper min-[1200px]:hidden"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className="font-body text-3xl font-medium uppercase leading-tight tracking-[0.04em] hover:text-lemon aria-[current=page]:opacity-40"
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
            className="font-body mt-6 w-fit text-xl font-medium uppercase leading-none tracking-[0.04em] hover:text-lemon"
          >
            {espaceB2bLabel}
          </a>
        </nav>
      )}
    </header>
  );
}
