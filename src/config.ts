import fs from "fs";

type ProgramConfig = {
   key: string;
   userIds: string[];
   userUrls: string[];
};
try {
   var config = JSON.parse(fs.readFileSync(".config.json", "utf8")) as unknown as ProgramConfig;
} catch (e) {
   console.error(`Could not read .config.json in ${process.cwd()}!`);
   throw e;
}

export {config};
