# Gator

A command-line RSS feed aggregator built with Node.js, TypeScript, and PostgreSQL via Drizzle ORM.

## Requirements

- Node.js
- PostgreSQL

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a PostgreSQL database named `gator`.

3. Create `~/.gatorconfig.json` with your database connection:

```json
{
  "db_url": "postgres://user:password@localhost:5432/gator?sslmode=disable",
  "current_user_name": ""
}
```

4. Run migrations:

```bash
npx drizzle-kit migrate
```

## Usage

All commands are run via:

```bash
npm run start <command> [args]
```

### User commands

| Command | Description |
|---|---|
| `register <name>` | Register a new user and set them as current |
| `login <name>` | Switch to an existing user |
| `users` | List all users |
| `reset` | Delete all users from the database |

### Feed commands

| Command | Description |
|---|---|
| `addfeed <name> <url>` | Add a new RSS feed and follow it |
| `feeds` | List all feeds |
| `follow <url>` | Follow an existing feed by URL |
| `following` | List feeds the current user follows |
| `unfollow <url>` | Unfollow a feed |

### Aggregator commands

| Command | Description |
|---|---|
| `agg <interval>` | Start the aggregator, fetching feeds on an interval (e.g. `10s`, `1m`) |
| `browse [limit]` | Show the latest posts from feeds you follow (default limit: 2) |
