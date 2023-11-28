// CWD assumed to be repo root
import fs from "fs";
const rl = (await import("readline/promises")).createInterface({
   input: process.stdin,
   output: process.stdout,
   terminal: false,
});

if (fs.existsSync(".config.json")) {
   process.stdout.write("It looks like you already have a .config.json!\nQuitting...\n");
   process.exit();
}

const defaultConfig = {
   key: await rl.question("Paste your Steam API Key:\n> "),
   userIds: [],
   userUrls: [],
};
rl.close();
fs.writeFileSync(".config.json", JSON.stringify(defaultConfig, null, 3));
