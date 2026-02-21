import { XMLParser } from "fast-xml-parser";

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export type RSSFeed = {
    channel:{
        title: string;
        link: string;
        description: string;
        items: RSSItem[];   
 }};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  // Fetch
  const res = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch feed: ${res.status}`);
  }

  const xml = await res.text();

  // Parse
  const parser = new XMLParser();
  const data = parser.parse(xml);

  if (!data.rss || !data.rss.channel) {
    throw new Error("Invalid RSS feed structure");
  }

  const channel = data.rss.channel;

  const { title, link, description } = channel;

  if (!title || !link || !description) {
    throw new Error("Missing channel metadata");
  }

  // Handle items
  let itemsRaw = channel.item ?? [];
  let itemsArray = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw];

  const items: RSSItem[] = [];

  for (const item of itemsArray) {
    const { title, link, description, pubDate } = item;

    if (!title || !link || !description || !pubDate) {
      continue; // skip invalid items
    }

    items.push({
      title,
      link,
      description,
      pubDate,
    });
  }

  return {
    channel: {
      title,
      link,
      description,
      items: items,
    },
  };
}