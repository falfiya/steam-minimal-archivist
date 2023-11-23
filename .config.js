import fs from "fs";
const rl = (await import("readline/promises")).createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

if (fs.existsSync(".config.json")) {
   console.log("It looks like you already have a .config.json!\nQuitting...")
   process.exit();
}

const config = {
   key: await rl.question("Paste your Steam API Key:\n> "),
   userIds: [],
   userUrls: [],
};
rl.close();
fs.writeFileSync(".config.json", JSON.stringify(config, null, 3));
