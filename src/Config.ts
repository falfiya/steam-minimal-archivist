import fs from "fs";
import {isStringArray, log} from "./util";

type Config = {
   apiKey: string;
   dbPath: string;
   userIds: string[];
   userUrls: string[];
};

/**
 * Loads and validates a config file or creates a new one.
 */
export async function loadConfig(path = ".config.json"): Promise<Config> {
   if (fs.existsSync(path)) {
      const config = JSON.parse(fs.readFileSync(path, "utf8"));
      validateConfig(config);
      return config;
   }

   createConfig(path);
}

function validateConfig(obj: any): asserts obj is Config {
   if (typeof obj.apiKey !== "string") {
      throw new Error("Expected config.apiKey to be a string!");
   }
   if (typeof obj.dbPath !== "string") {
      throw new Error("Expected config.dbPath to be a string!");
   }
   if (!isStringArray(obj.userIds)) {
      throw new Error("Expected config.userIds to be a string[]!");
   }
   if (!isStringArray(obj.userUrls)) {
      throw new Error("Expected config.userUrls to be a string[]!");
   }
}

/**
 * Asks the user for information and then writes out a config file.
 */
// @ts-expect-error
async function createConfig(path: string): never {
   const {createInterface} = await import("readline/promises");

   const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
   });
   const apiKey = await rl.question(""
      + "Paste your Steam API Key.\n"
      + "You can get it from https://steamcommunity.com/dev/apikey\n"
      + "> "
   );
   const config: Config = {
      apiKey,
      dbPath: "data/sma.sqlite3.zstd",
      userIds: [],
      userUrls: [],
   };
   fs.writeFileSync(path, JSON.stringify(config, null, 3));

   log.title(`Open up ${path} and add some users to archive!\n`);

   process.exit(0);
}
