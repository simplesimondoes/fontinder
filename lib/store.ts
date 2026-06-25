import { Redis } from "@upstash/redis";
import fonts from "./fonts.json";
import fs from "node:fs";
import path from "node:path";

export type FontMeta = {
  slug: string;
  name: string;
  image: string;
  w: number;
  h: number;
};

export const FONTS = fonts as FontMeta[];
export const FONT_BY_SLUG = new Map(FONTS.map((f) => [f.slug, f]));

export type Tally = { slug: string; likes: number; nopes: number };

const KEY = "fontinder:votes"; // hash: field `${slug}:like` / `${slug}:nope` -> count

// Support both naming schemes: Upstash's own integration injects
// UPSTASH_REDIS_REST_*, while the older Vercel KV integration uses KV_REST_API_*.
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const hasRedis = !!REDIS_URL && !!REDIS_TOKEN;

// ---- Upstash Redis backend (production) ----
const redis = hasRedis
  ? new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! })
  : null;

// ---- Local file backend (dev only; Vercel fs is read-only) ----
const DATA_FILE = path.join(process.cwd(), ".data", "votes.json");

function readFile(): Record<string, number> {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeFile(data: Record<string, number>) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

export async function recordVote(slug: string, kind: "like" | "nope") {
  if (!FONT_BY_SLUG.has(slug)) throw new Error("unknown font");
  const field = `${slug}:${kind}`;
  if (redis) {
    await redis.hincrby(KEY, field, 1);
  } else {
    const data = readFile();
    data[field] = (data[field] ?? 0) + 1;
    writeFile(data);
  }
}

export async function getAllTallies(): Promise<Record<string, number>> {
  if (redis) {
    const all = (await redis.hgetall<Record<string, number>>(KEY)) ?? {};
    return all;
  }
  return readFile();
}

export function buildLeaderboard(raw: Record<string, number>): Tally[] {
  const map = new Map<string, Tally>();
  for (const f of FONTS) map.set(f.slug, { slug: f.slug, likes: 0, nopes: 0 });
  for (const [field, count] of Object.entries(raw)) {
    const [slug, kind] = field.split(":");
    const t = map.get(slug);
    if (!t) continue;
    if (kind === "like") t.likes = Number(count) || 0;
    if (kind === "nope") t.nopes = Number(count) || 0;
  }
  return [...map.values()];
}

// Wilson lower-bound score: rewards high like-rate with enough votes,
// so a 1-vote 100% font doesn't beat a 200-vote 95% one.
export function score(t: Tally): number {
  const n = t.likes + t.nopes;
  if (n === 0) return 0;
  const z = 1.96;
  const phat = t.likes / n;
  return (
    (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n)
  );
}

export const HAS_REDIS = hasRedis;
