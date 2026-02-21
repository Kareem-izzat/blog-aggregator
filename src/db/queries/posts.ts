import { db } from "../index"
import { posts } from "../schema"
import { desc, eq } from "drizzle-orm"
import { feedFollows } from "../schema"

export async function createPost(data: {
  title: string
  url: string
  description: string | null
  publishedAt: Date | null
  feedId: string
}){
  try {
    const result = await db
      .insert(posts)
      .values({
        title: data.title,
        url: data.url,
        description: data.description,
        publishedAt: data.publishedAt,
        feedId: data.feedId,
      })
      .onConflictDoNothing({ target: posts.url })
      .returning()

    return result[0]
  } catch (err) {
    console.error("Error inserting post:", err)
  }
}

export async function getPostsForUser(userId: string, limit: number ) {
    return await db
    .select()
    .from(posts)
    .innerJoin(
      feedFollows,
      eq(posts.feedId, feedFollows.feed_id)
    )
    .where(eq(feedFollows.user_id, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
}