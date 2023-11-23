# steam-minimal-archivist

*Unfancy Steam Archivist*

I'd like having records of my playtime on certain days and I don't think Steam keeps track of that, at least not publicly. Set this up to run periodically to keep running snapshots of your playtime! Mine runs whenever my computer is idle for more than 15 minutes using the Windows® Task Scheduler.

## Requirements

- Node.js
   - I have `v20.7.0` and it works fine
- Node Package Manager
   - I'm using version `10.1.0`
- GNU Make
- A Valid Steam API Key
   - Visit https://steamcommunity.com/dev/apikey to obtain one

## Dependencies

You'll have to build the executable JavaScript yourself though.

- runtime
   - Node.js
   - `better-sqlite3`
- buildtime
   - `typescript`
   - `@types/node`
   - `@types/better-sqlite3`
   - `esbuild`

## Usage

1. `npm i` to install all required packages
2. `make`

On your first run, you will be prompted for your Steam API Key.
A `.config.json` file will be created.
**Do not share this file since it has your API key inside!**
Inside it, add some people to archive. You can either use a full URL or a Steam User ID.

```json
{
   "key": "YOUR KEY HERE XXXXXXXXXXXXXXXXXX",
   "userIds": ["XXXXXXXXXXXXXXXXX"],
   "userUrls": [
      "https://steamcommunity.com/id/xxxxxx/",
      "https://steamcommunity.com/profiles/XXXXXXXXXXXXXXXXX",
      "https://steamcommunity.com/id/xxxxxx",
      "https://steamcommunity.com/profiles/XXXXXXXXXXXXXXXXX/",
   ]
}
```

## What's Archived

`steam-minimal-archivist` is a snapshot based system. A single snapshot contains:

- A User's
   - Steam Id
   - Username
   - Profile URL
   - Avatar
   - Last Logoff Time
   - "Real Name" <sup>it's whatever they set that to in their Steam profile</sup>
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

## How to View Your Data

I'm not planning on making an interface to view the generated sqlite3 database. Use another program to access the database and make your own UI. This program is simply for archiving data, not viewing it. The schema is located in `src/schema.sql`.

## Directory Structure

- TypeScript and SQL source files in `src/`
- executable JavaScript files in `js/`
- archives in `data/`

<h2>Online Resources Used <sup>(Thank You)</sup></h2>

- The venerable https://steamwebapi.azurewebsites.net website
- The old https://developer.valvesoftware.com/wiki/Steam_Web_API Valve API Wiki
- The new https://partner.steamgames.com/doc/webapi_overview Steamworks Web API Documentation
- [https://stackoverflow.com/questions/27862725/how-to-get-last-played-on-for-steam-game-using-steam-api](https://stackoverflow.com/a/75693044)
   - for a long time you had to just scrape the webpage which was highly unreliable and no longer works
