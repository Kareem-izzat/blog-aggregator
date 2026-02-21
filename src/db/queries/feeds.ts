import { db } from "..";
import { feeds } from "../schema";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { fetchFeed } from "../../rss";
import {createPost} from "./posts";


export async function createFeed(
  name: string,
  url: string,
  userId: string
) {
  const [result] = await db
    .insert(feeds)
    .values({ name, url, user_id: userId })
    .returning();
  return result;
}
export async function getAllFeeds() {
  return await db.select({
    feedName: feeds.name,
      feedUrl: feeds.url,
      userName: users.name,
  }).from(feeds)
  .leftJoin(users, eq(feeds.user_id, users.id));
}


export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;
export function printFeed(feed: Feed, user: User) {
  console.log(`Feed ID: ${feed.id}`);
  console.log(`Name: ${feed.name}`);
  console.log(`URL: ${feed.url}`);
  console.log(`Added by: ${user.name}`);
  console.log(`Created At: ${feed.createdAt}`);
  console.log(`Updated At: ${feed.updatedAt}`);
}

export async function markFeedFetched(feedId: string) {
  const now = new Date();
  await db.update(feeds)
    .set({
      lastFetchedAt: now,
      updatedAt: now,
    })
    .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
    const [feed] = await db.select()
    .from(feeds)
    .orderBy(sql`last_fetched_at NULLS FIRST`) // fetch feeds not fetched first
    .limit(1);

  return feed || null;
}
function parseDate(item: any): Date | null {
  const raw = item.pubDate || item.isoDate;
  if (!raw) return null;

  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return null;

  return parsed;
}
export async function scrapeFeeds(){
  const feed = await getNextFeedToFetch();
  if (!feed) {
    console.log("No feeds to fetch");
    return;
  }
  console.log(`Fetching feed: ${feed.name} (${feed.url})`);
  await markFeedFetched(feed.id);
  const rss= await fetchFeed(feed.url);
  if (!rss.channel.items || rss.channel.items.length === 0) {
    console.log("No posts found in this feed.");
    return;
  }

  for (const item of rss.channel.items) {
  try {
    if (!item.link) continue; // skip invalid entries

    await createPost({
      title: item.title ?? "No title",
      url: item.link,
      description: item.description ?? null,
      publishedAt: parseDate(item),
      feedId: feed.id,
    });

  } catch (err) {
    console.error("Failed to save post:", err);
  }
}
console.log("Posts saved.\n");

}

export function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) throw new Error("Invalid duration string");

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "ms": return value;
    case "s": return value * 1000;
    case "m": return value * 1000 * 60;
    case "h": return value * 1000 * 60 * 60;
    default: throw new Error("Unknown time unit");
  }
}