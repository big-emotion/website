// Persistence seam for the Playground collective counter (SWBE-216/REQ-042, DEC-033):
// a flat JSON file on the first mounted volume, atomic writes (temp file + rename),
// behind a narrow read/increment interface so SWBE-30 can later swap in Redis without
// touching callers. In-memory-only (DEC-016: no DB today).

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export interface CounterState {
  total: number;
  byEffect: Record<string, number>;
}

export interface CounterIncrement {
  effectId: string;
  amount: number;
}

const EMPTY_STATE: CounterState = { total: 0, byEffect: {} };

// A single visitor interaction (e.g. one tap) is worth 1; this caps a single batched
// entry so a malicious or buggy client can't inflate the total in one request. It is
// enforced here, not just at the API layer, since this lib is the one seam every
// future caller (Redis-backed or not) goes through.
export const MAX_INCREMENT = 50;

function defaultFilePath(): string {
  return (
    process.env.PLAYGROUND_COUNTER_FILE ??
    path.join(process.cwd(), ".data", "playground-counter.json")
  );
}

function isCounterState(value: unknown): value is CounterState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<CounterState>;
  return (
    typeof candidate.total === "number" &&
    typeof candidate.byEffect === "object" &&
    candidate.byEffect !== null
  );
}

async function readState(filePath: string): Promise<CounterState> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return isCounterState(parsed) ? parsed : EMPTY_STATE;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return EMPTY_STATE;
    throw error;
  }
}

// write temp + rename: rename is atomic on the same filesystem, so a concurrent
// reader (or another container process, once one exists) never observes a
// half-written file.
async function writeState(filePath: string, state: CounterState): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(tempPath, JSON.stringify(state), "utf8");
  await rename(tempPath, filePath);
}

function clampAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.min(Math.floor(amount), MAX_INCREMENT);
}

// Serializes read-modify-write cycles within this process: two concurrent requests
// racing a read before either writes back would otherwise lose an update even though
// the file itself stays valid. Only guards this single container instance — the same
// reason the file store is single-instance until SWBE-30 brings Redis.
let writeQueue: Promise<unknown> = Promise.resolve();

function serialized<T>(run: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(run, run);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function getTotal(filePath: string = defaultFilePath()): Promise<number> {
  const state = await readState(filePath);
  return state.total;
}

export function incrementCounter(
  increments: readonly CounterIncrement[],
  filePath: string = defaultFilePath(),
): Promise<CounterState> {
  return serialized(async () => {
    const state = await readState(filePath);
    const byEffect = { ...state.byEffect };
    let added = 0;

    for (const { effectId, amount } of increments) {
      const clamped = clampAmount(amount);
      if (clamped <= 0) continue;
      byEffect[effectId] = (byEffect[effectId] ?? 0) + clamped;
      added += clamped;
    }

    const nextState: CounterState = { total: state.total + added, byEffect };
    await writeState(filePath, nextState);
    return nextState;
  });
}
