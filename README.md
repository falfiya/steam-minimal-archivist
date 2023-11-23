# steam-archivist-basic

## requirements

- Node.js
   - I have `v20.7.0` and it works fine
- npm
   - I'm using `10.1.0`
- a valid steam API key
   - Visit https://steamcommunity.com/dev/apikey to obtain one

## how to use it

1. Install the required node modules
   - In the repository root, run `npm i`
2. put your Steam API key on the first line of `steam_api_key.txt`

## how to view your data

I'm not planning on making an interface to view the generated sqlite3 database. Use another program to access the database and make your own UI. This program is simply for archiving data, not viewing it.

## directory structure

- typescript and sql source files in `src/`
- javascript executable files in `js/`
- archives in `data/`
