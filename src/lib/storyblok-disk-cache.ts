/**
 * Persists Storyblok CDN response cache across builds when space version matches.
 * Invalidates automatically when Storyblok space version changes.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CACHE_FILE = join(process.cwd(), '.storyblok-build-cache.json');

interface PersistedFile {
  spaceVersion: number;
  entries: Record<string, unknown>;
}

function makeKey(params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key];
        return acc;
      },
      {} as Record<string, any>
    );

  return JSON.stringify(sortedParams);
}

let spaceVersionPromise: Promise<number | null> | null = null;

async function resolveSpaceVersion(): Promise<number | null> {
  if (!spaceVersionPromise) {
    spaceVersionPromise = (async () => {
      try {
        const SB_DATA = String(import.meta.env.SB_DATA_TOKEN);
        if (!SB_DATA) return null;
        const url = `https://api-us.storyblok.com/v2/cdn/spaces/me?token=${encodeURIComponent(SB_DATA)}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = (await res.json()) as { space?: { version: number } };
        return data.space?.version ?? null;
      } catch {
        return null;
      }
    })();
  }
  return spaceVersionPromise;
}

let fileData: PersistedFile | null = null;
let fileLoaded = false;

function loadFile(): PersistedFile | null {
  if (fileLoaded) return fileData;
  fileLoaded = true;
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const raw = readFileSync(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedFile;
    if (
      !parsed ||
      typeof parsed.spaceVersion !== 'number' ||
      typeof parsed.entries !== 'object' ||
      parsed.entries === null
    ) {
      return null;
    }
    fileData = parsed;
    return fileData;
  } catch {
    return null;
  }
}

let flushScheduled = false;

function scheduleFlush(data: PersistedFile) {
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(() => {
    flushScheduled = false;
    try {
      writeFileSync(CACHE_FILE, JSON.stringify(data));
    } catch (e) {
      console.warn('[Storyblok disk cache] write failed:', e);
    }
  });
}

export const storyblokDiskCache = {
  async get<T>(params: Record<string, any>): Promise<T | null> {
    if (String(import.meta.env.STORYBLOK_IS_PREVIEW) === 'true') {
      return null;
    }
    const sv = await resolveSpaceVersion();
    if (sv === null) return null;

    const disk = loadFile();
    if (!disk || disk.spaceVersion !== sv) return null;

    const key = makeKey(params);
    const entry = disk.entries[key];
    if (entry === undefined) return null;
    return entry as T;
  },

  async set(params: Record<string, any>, data: unknown): Promise<void> {
    if (String(import.meta.env.STORYBLOK_IS_PREVIEW) === 'true') {
      return;
    }
    const sv = await resolveSpaceVersion();
    if (sv === null) return;

    let disk = loadFile();
    if (!disk || disk.spaceVersion !== sv) {
      disk = { spaceVersion: sv, entries: {} };
      fileData = disk;
      fileLoaded = true;
    }

    const key = makeKey(params);
    disk.entries[key] = data;
    scheduleFlush(disk);
  },
};
