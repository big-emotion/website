import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COUNTER_UPDATED_EVENT } from "./counter-client";
import { CounterChip } from "./counter-chip";

const copy = { one: "logo maltraité", other: "logos maltraités" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CounterChip", () => {
  it("fetches and renders the current total with locale-aware thousands separators", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ total: 12431 }) }),
    );

    render(<CounterChip locale="fr" copy={copy} />);

    await waitFor(() => {
      expect(screen.getByText(/12(\s| )431 logos maltraités/)).toBeInTheDocument();
    });
  });

  it("renders nothing while the total hasn't loaded yet", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    const { container } = render(<CounterChip locale="fr" copy={copy} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the fetch fails, rather than erroring the page", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { container } = render(<CounterChip locale="fr" copy={copy} />);

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it("uses the singular noun for a total of exactly one", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ total: 1 }) }));

    render(<CounterChip locale="fr" copy={copy} />);

    await waitFor(() => {
      expect(screen.getByText(/1 logo maltraité$/)).toBeInTheDocument();
    });
  });

  it("updates the displayed total when a counter-updated event fires", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ total: 100 }) }),
    );

    render(<CounterChip locale="fr" copy={copy} />);
    await waitFor(() => {
      expect(screen.getByText(/100 logos maltraités/)).toBeInTheDocument();
    });

    act(() => {
      window.dispatchEvent(new CustomEvent(COUNTER_UPDATED_EVENT, { detail: { total: 103 } }));
    });

    await waitFor(() => {
      expect(screen.getByText(/103 logos maltraités/)).toBeInTheDocument();
    });
  });
});
