import fs from "fs";
import {createInterface} from "readline/promises";

export class Config {
   static async new(path = ".config.json"): Promise<Config> {
      if (fs.existsSync(path)) {
         const configRaw = fs.readFileSync(path, "utf8");
         const {
            apiKey,
            dbPath,
            userIds,
            userUrls,
         } = JSON.parse(configRaw) as Record<string, unknown>;
         if (typeof apiKey !== "string") {
            throw new Error("Expected config.apiKey to be a string!");
         }
         if (typeof dbPath !== "string") {
            throw new Error("Expected config.dbPath to be a string!");
         }
         if (!Array.isArray(userIds)) {
            throw new Error("Expected config.userIds to be a string[]!");
         }
         if (!Array.isArray(userUrls)) {
            throw new Error("Expected config.userUrls to be a string[]!");
         }
         return new Config(apiKey, dbPath, userIds, userUrls);
      } else {
         const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false,
         });
         const apiKey = await rl.question("Paste your Steam API Key:\n> ");
         const config = new Config(apiKey);
         fs.writeFileSync(path, JSON.stringify(config, null, '\t'));
         return config;
      }
   }

   constructor (
      public apiKey: string,
      public dbPath: string = "data/steam-minimal-archivist.sqlite3",
      public userIds: string[] = [],
      public userUrls: string[] = [],
   ) {}
}
