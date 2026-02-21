import { readConfig, setUser } from "./config";
import { createUser, findUserByName, deleteAllUsers, getUsers } from "./db/queries/users";
import { getAllFeeds, User, createFeed, printFeed, parseDuration, scrapeFeeds } from "./db/queries/feeds";
import { getPostsForUser } from "./db/queries/posts";
import { fetchFeed } from "./rss";
import { createFeedFollow, deleteFeedFollowByUrl, findFeedByUrl, getFeedFollowsForUser } from "./db/queries/feedFollows";

export type UserCommandHandler = (
  user: User,
  ...args: string[]
) => Promise<void>;
type commandHandler = (...args: string[]) => Promise<void>;

export type commandsRegistry={
    [cmdName:string]:commandHandler
}

export type middlewareLoggedIn = (handler: UserCommandHandler) => commandHandler;

export const middlewareLoggedIn: middlewareLoggedIn = (handler) => {
  return async (...args: string[]) => {
    const config = readConfig();

    if (!config.currentUserName) {
      throw new Error("No user logged in");
    }

    const user = await findUserByName(config.currentUserName);

    if (!user) {
      throw new Error(`User ${config.currentUserName} not found`);
    }

 
    return handler(user, ...args);
  };
};

export const handlerLogin:commandHandler=async(...args:string[])=>{
    if(args.length<1){
        throw new Error("Username is required");
    }
    const userName=args[0];
    const user = await findUserByName(userName);
    if(!user){
        throw new Error("User does not exist");
    }
    setUser(userName);
    console.log("user set to",userName);
}

export function registerCommand(
    registry:commandsRegistry,
    cmdName:string,
    handler:commandHandler
):void{
    registry[cmdName]=handler;
}

export async function runCommand(
    registry:commandsRegistry,
    cmdName:string,
    ...args:string[]
):Promise<void>{
    const handler= registry[cmdName];
    if(!handler){
        throw new Error(`Unknown command: ${cmdName}`);
    }
    await handler(...args);
}
export const handlerReset: commandHandler = async (...args: string[]) => {
    await deleteAllUsers();
    console.log("database reset");
};

export const handlerRegister: commandHandler=async(...args:string[])=>{
    if(args.length<1){
        throw new Error("Username is required");
    }
    const userName=args[0];
     const existing = await findUserByName(userName);
    if (existing) {
    throw new Error("User already exists");
     }

    const user = await createUser(userName);
    setUser(userName);
    
    console.log("user created:");
    console.log(user);
};
export const handleUsers: commandHandler=async(...args:string[])=>{
    const users = await getUsers();
    const config = readConfig();
    for (const user of users) {
    if (user.name === config.currentUserName) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}
    
export const handlerAgg: commandHandler=async(...args:string[])=>{
    if(args.length < 1) throw new Error("Duration argument is required (e.g., 1s, 1m)");
    const durationStr = args[0];
    const timeBetweenRequests = parseDuration(durationStr);
    console.log(`Starting feed scraping every ${durationStr}...`);
    scrapeFeeds().catch((err) => {
      console.error("Error during scraping:", err);
    });
    const interval = setInterval(() => {
    scrapeFeeds().catch(err => console.error("Error scraping feeds:", err));
  }, timeBetweenRequests);

  // Stop loop gracefully on Ctrl C
  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}



export const handlerAddFeed: UserCommandHandler = async (user, ...args) => {
  if (args.length < 2) throw new Error("Both feed name and URL are required");

  const name = args[0];
  const url = args[1];

  // Create the feed
  const feed = await createFeed(name, url, user.id);

  // Auto-follow the feed
  await createFeedFollow(user.id, feed.id).catch(() => {});

  // Print the feed info
  printFeed(feed, user);


  console.log(`${user.name} is now following feed: ${feed.name}`);
};
export const handlerUnfollow: UserCommandHandler = async ( user, ...args) => {
  if (args.length < 1) throw new Error("Feed URL is required");
  const url = args[0];

  const feed = await deleteFeedFollowByUrl(user.id, url);

  console.log(`${user.name} has unfollowed feed: ${feed.name}`);
};

export const handlerFeeds: commandHandler = async (...args: string[]) => {
    const allFeeds = await getAllFeeds();
    if (allFeeds.length === 0) {
      console.log("No feeds found.");
      return;
    }
    for (const feed of allFeeds) {
    console.log(`* ${feed.feedName}`);
    console.log(`  URL: ${feed.feedUrl}`);
    console.log(`  Added by: ${feed.userName}`);
    console.log("");
  }

}
export const handlerFollow: UserCommandHandler = async (user, ...args) => {
  if (args.length < 1) throw new Error("Feed URL is required");
  const url = args[0];

  const feed = await findFeedByUrl(url);
  if (!feed) throw new Error("Feed not found");

  try {
    await createFeedFollow(user.id, feed.id);
    console.log(`${user.name} is now following feed: ${feed.name}`);
  } catch (err: any) {
    if (err.code === "23505") {
      console.log(`You are already following this feed: ${feed.name}`);
    } else {
      throw err;
    }
  }
};

export const handlerBrowse: UserCommandHandler = async (user, ...args) => {
  const limit = args[0] ? parseInt(args[0], 10) : 2;
  const results = await getPostsForUser(user.id, limit);

  if (results.length === 0) {
    console.log("No posts found.");
    return;
  }

  for (const result of results) {
    const post = result.posts;
    console.log(`Title: ${post.title}`);
    console.log(`URL:   ${post.url}`);
    if (post.description) console.log(`Desc:  ${post.description.slice(0, 100)}`);
    if (post.publishedAt) console.log(`Date:  ${post.publishedAt}`);
    console.log("");
  }
};

// following
export const handlerFollowing: UserCommandHandler = async (user) => {
  const follows = await getFeedFollowsForUser(user.id);

  if (follows.length === 0) {
    console.log("You are not following any feeds.");
    return;
  }

  for (const follow of follows) {
    console.log(`* ${follow.feedName}`);
  }
};

