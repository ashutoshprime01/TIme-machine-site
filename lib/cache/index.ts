// Two-layer cache (plan §30): in-memory LRU-ish map + on-disk JSON files
// keyed by SHA-256 of the request. All operations fail open — a cache
// problem must never break the product.

import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const MEMORY_LIMIT = 500;

const memory = new Map<string, { value: unknown; expires: number }>();

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function memoryGet(key: string): unknown | undefined {
  const hit = memory.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    memory.delete(key);
    return undefined;
  }
  // refresh recency
  memory.delete(key);
  memory.set(key, hit);
  return hit.value;
}

function memorySet(key: string, value: unknown, ttlMs: number) {
  if (memory.size >= MEMORY_LIMIT) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(key, { value, expires: Date.now() + ttlMs });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const mem = memoryGet(key);
    if (mem !== undefined) return mem as T;
    const file = path.join(CACHE_DIR, hashKey(key) + ".json");
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { value: T; expires: number };
    if (parsed.expires < Date.now()) return null;
    memorySet(key, parsed.value, parsed.expires - Date.now());
    return parsed.value;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlMs: number): Promise<void> {
  try {
    memorySet(key, value, ttlMs);
    await mkdir(CACHE_DIR, { recursive: true });
    const file = path.join(CACHE_DIR, hashKey(key) + ".json");
    await writeFile(file, JSON.stringify({ value, expires: Date.now() + ttlMs }), "utf8");
  } catch {
    // fail open
  }
}

/** TTLs tuned per resource type. */
export const TTL = {
  /** CDX capture lists — history doesn't change fast. */
  captures: 1000 * 60 * 60 * 24,
  /** Partial capture lists (some archive windows failed) — retry sooner. */
  capturesPartial: 1000 * 60 * 30,
  /** Retrieved HTML payloads — immutable once archived. */
  html: 1000 * 60 * 60 * 24 * 30,
} as const;
