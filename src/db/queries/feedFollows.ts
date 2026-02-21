import { db } from "..";
import { feedFollows } from "../schema";
import { feeds } from "../schema";
import { users } from "../schema";
import { eq, and } from "drizzle-orm";

// Create a follow record and return info with feed name and username
export async function createFeedFollow(userId: string, feedId: string) {
  const [follow] = await db.insert(feedFollows)
    .values({ user_id: userId, feed_id: feedId })
    .returning();

  // join to get feed name and username
  const [result] = await db.select({
    id: feedFollows.id,
    feedName: feeds.name,
    userName: users.name,
    createdAt: feedFollows.createdAt
  })
  .from(feedFollows)
  .innerJoin(feeds, eq(feedFollows.feed_id, feeds.id))
  .innerJoin(users, eq(feedFollows.user_id, users.id))
  .where(eq(feedFollows.id, follow.id));

  return result;
}

// Get all follows for a user
export async function getFeedFollowsForUser(userId: string) {
  return db.select({
    feedName: feeds.name,
    userName: users.name
  })
  .from(feedFollows)
  .innerJoin(feeds, eq(feedFollows.feed_id, feeds.id))
  .innerJoin(users, eq(feedFollows.user_id, users.id))
  .where(eq(feedFollows.user_id, userId));
}


export async function findFeedByUrl(url: string) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.url, url));
  return feed;
}

export async function deleteFeedFollowByUrl(userId: string, url: string) {
    const [feed] = await db.select()
    .from(feeds)
    .where(eq(feeds.url, url));
    if (!feed) throw new Error("Feed not found");
    
    await db.delete(feedFollows)
    .where(
        and(
            eq(feedFollows.user_id, userId),
            eq(feedFollows.feed_id, feed.id)
        )
    );
    return feed;
}