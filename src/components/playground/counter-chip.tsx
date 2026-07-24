"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locales";
import { COUNTER_UPDATED_EVENT } from "./counter-client";

const ENDPOINT = "/api/playground/counter";

type CounterCopy = { one: string; other: string };

/**
 * The Playground's collective counter (SWBE-216/REQ-042): the global total across every
 * visitor, e.g. "12 431 parties jouees". Renders nothing until the first fetch settles
 * — a failed or slow request never blocks or errors the page, it just leaves the chip
 * absent. Updates live when `counter-client.ts` reports a fresh total after this
 * visitor's own increment, without polling.
 */
export function CounterChip({ locale, copy }: { locale: Locale; copy: CounterCopy }) {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(ENDPOINT)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (cancelled) return;
        const value = (data as { total?: unknown } | null)?.total;
        if (typeof value === "number") setTotal(value);
      })
      .catch(() => {
        // Stays absent rather than erroring the page — this chip is a nice-to-have.
      });

    function onUpdated(event: Event) {
      const detail = (event as CustomEvent<{ total: number }>).detail;
      if (!cancelled && typeof detail?.total === "number") setTotal(detail.total);
    }
    window.addEventListener(COUNTER_UPDATED_EVENT, onUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(COUNTER_UPDATED_EVENT, onUpdated);
    };
  }, []);

  if (total === null) return null;

  const noun = total === 1 ? copy.one : copy.other;
  const formatted = new Intl.NumberFormat(locale).format(total);

  // The thesis-sticker vocabulary from Direction B (PG-09): lemon on ink, hard shadow,
  // knocked off-axis. It reads the same whether it sits on the grey gallery hero or on
  // the ink bar of an effect page, which is why it carries its own surface pair.
  return (
    <p className="inline-block -rotate-[1.2deg] border-2 border-ink bg-lemon px-3 py-1 text-sm font-bold uppercase tracking-wide text-ink shadow-[3px_3px_0_var(--color-ink)]">
      {formatted} {noun}
    </p>
  );
}
