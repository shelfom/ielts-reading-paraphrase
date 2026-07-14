/**
 * Data loader utility for IELTS reading passages.
 *
 * Content JSON files are expected at /data/<filename>.json under the public directory.
 * This module fetches and parses them at runtime.
 */

import type { ReadingPassage } from '../types';

const DATA_BASE = '/data';

/**
 * Fetch a single passage by its filename (without extension).
 * e.g. loadPassage("passage-01") → fetches /data/passage-01.json
 */
export async function loadPassage(filename: string): Promise<ReadingPassage> {
  const res = await fetch(`${DATA_BASE}/${filename}.json`);
  if (!res.ok) {
    throw new Error(`Failed to load passage "${filename}": ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ReadingPassage;
}

/**
 * Fetch the passage manifest (index) that lists all available passages.
 * Expected at /data/manifest.json — an array of { id, title, filename, ... }.
 */
export async function loadManifest(): Promise<
  Array<{ id: string; title: string; filename: string; difficulty?: string; topic?: string }>
> {
  const res = await fetch(`${DATA_BASE}/manifest.json`);
  if (!res.ok) {
    throw new Error(`Failed to load manifest: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as Array<{
    id: string;
    title: string;
    filename: string;
    difficulty?: string;
    topic?: string;
  }>;
}
