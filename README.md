# steam-minimal-archivist v2.0.0

*Unfancy Steam Archivist*

Steam doesn't keep track of play-time on specific dates so let's do it ourselves. `steam-minimal-archivist` records your Steam play-time per game, along with some other stuff.

I recommend setting it up to run periodically. Mine runs every hour using the Windows® Task Scheduler. The size on disk should not be too much of an issue. I have done my best to optimize the database schema for minimum size. Also, it's compressed using ZStandard. If you have a GB of data to spare every year, you could have snapshots as frequently as every 5 minutes!

## What's Archived

- A User's
   - Steam Id
   - Username
   - Profile URL
   - Avatar
   - Last Logoff Time
   - "Real Name" <sup>it's whatever they set in their Steam profile</sup>
   - Creation Time
   - Steam Level
   - Games
      - Minutes Played
         - Platform Specific
            - On Windows
            - On Macintosh
            - On Linux
      - Minutes Played in the Last Two Weeks
      - Last Played Time

## Requirements

- Node.js
- Node Package Manager
- GNU Make
- A Valid Steam API Key
   - Visit https://steamcommunity.com/dev/apikey to obtain one

## Dependencies

You'll have to build the executable JavaScript yourself though.

- runtime
   - Node.js
   - `better-sqlite3`
   - `date-fns`
- build time
   - `typescript`
   - `@types/node`
   - `@types/better-sqlite3`
   - `esbuild`

## Usage

1. Clone this repository and `cd` into it
   - `git clone https://github.com/falfiya/steam-minimal-archivist.git && cd steam-minimal-archivist`
2. `pnpm i` to install all required packages
3. `make` to build and run

On your first run, you will be prompted for your Steam API Key and a `.config.json` file will be created.
Open it and add some users to archive.
You can either use a full URL like `https://steamcommunity.com/profiles/12345678901234567` or a Steam User ID if you know one.
Your `.config.json` file might look something like this:

```json
{
   "key": "YOUR_KEY_HERE_XXXXXXXXXXXXXXXXXX",
   "dbPath": "data/steam-minimal-archivist.sqlite3",
   "userIds": ["9876543210987654"],
   "userUrls": [
      "https://steamcommunity.com/id/abcdef/",
      "https://steamcommunity.com/profiles/12345678901234567",
      "https://steamcommunity.com/id/ghijkl",
      "https://steamcommunity.com/profiles/89012345678901234/",
   ]
}
```

**Do not share this file since it has your API key inside!**

After your first build, you can simply run it using `node js/main` when the CWD is the repository root.

## How to View Your Data

`steam-minimal-archivist`'s functionality is limited to archiving. If you'd like to make an application to display or export your data, please reference the schema located in `src/schema.sql`. The data is stored in a sqlite3 database.

## Directory Structure

- TypeScript and SQL source files in `src/`
- Executable JavaScript files in `js/`
- Archives in `data/`
- Logs in `logs/`

<h2>Online Resources Used <sup>(Thank You)</sup></h2>

- The venerable https://steamwebapi.azurewebsites.net website
- The old https://developer.valvesoftware.com/wiki/Steam_Web_API Valve API Wiki
- The new https://partner.steamgames.com/doc/webapi_overview Steamworks Web API Documentation
- [https://stackoverflow.com/questions/27862725/how-to-get-last-played-on-for-steam-game-using-steam-api](https://stackoverflow.com/a/75693044)
   - for a long time you had to just scrape the webpage which was highly unreliable and no longer works
