# steam-minimal-archivist

*Unfancy Steam Archivist*

## Requirements

- Node.js
   - I have `v20.7.0` and it works fine
- npm
   - I'm using version `10.1.0`
- GNU Make
- a valid steam API key
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

On your first run, you will be prompted for your Steam API Key and a `.config.json` file will be created.
**Do not share this file!** it has your API key inside!
Next, add some people to archive either using a full URL or a Steam User ID.

```json
{
   "key": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
   "userIds": ["XXXXXXXXXXXXXXXXX"],
   "userUrls": ["https://steamcommunity.com/id/xxxxxx/"]
}
```

## What is Archived

`steam-minimal-archivist` is a snapshot based system. A single snapshot contains:

- a user's
   - id
   - username
   - profile url
   - avatar
   - last logoff time
   - real name
   - creation time
   - steam level
   - games
      - minutes played
      - minutes played in the last 2 weeks
      - last played time

## How to View Your Data

I'm not planning on making an interface to view the generated sqlite3 database. Use another program to access the database and make your own UI. This program is simply for archiving data, not viewing it.

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
