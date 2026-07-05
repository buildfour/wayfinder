import { promises as fs } from "fs";
import path from "path";
import type { Tour } from "@/lib/types";

const PUBLISH_DIR = path.join(process.cwd(), ".data", "published");

async function ensureDir() {
  await fs.mkdir(PUBLISH_DIR, { recursive: true });
}

function tourPath(id: string) {
  // Sanitize id to prevent path traversal
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(PUBLISH_DIR, `${safe}.json`);
}

export interface PublishedTour extends Tour {
  publishedAt: string;
  shareSlug: string;
}

export async function savePublishedTour(tour: Tour): Promise<PublishedTour> {
  await ensureDir();
  const published: PublishedTour = {
    ...tour,
    publishedAt: new Date().toISOString(),
    shareSlug: tour.id,
    lastSynced: tour.lastSynced ?? new Date().toISOString(),
  };
  await fs.writeFile(tourPath(tour.id), JSON.stringify(published, null, 2), "utf-8");
  return published;
}

export async function getPublishedTour(id: string): Promise<PublishedTour | null> {
  try {
    const raw = await fs.readFile(tourPath(id), "utf-8");
    return JSON.parse(raw) as PublishedTour;
  } catch {
    return null;
  }
}

export async function listPublishedTourIds(): Promise<string[]> {
  try {
    await ensureDir();
    const files = await fs.readdir(PUBLISH_DIR);
    return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

export async function refreshTourSync(id: string): Promise<PublishedTour | null> {
  const tour = await getPublishedTour(id);
  if (!tour) return null;

  // Manual refresh v1: update timestamp; Phase 6 will re-fetch source
  const updated: PublishedTour = {
    ...tour,
    lastSynced: formatRelativeSync(new Date()),
    publishedAt: tour.publishedAt,
  };
  await fs.writeFile(tourPath(id), JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

function formatRelativeSync(date: Date): string {
  return `just now (${date.toISOString().slice(0, 10)})`;
}
