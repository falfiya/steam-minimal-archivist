import fs from "fs";
import {sepoch} from "./util";

////////////////////////////////////////////////////////////////////////////////
// Logging 🪵

fs.mkdirSync("logs");

// sweep logs
for (const log of fs.readdirSync("logs").sort().slice(30)) {
   fs.unlinkSync(`logs/${log}`);
}

const logFile = fs.createWriteStream(`logs/${sepoch()}.txt`);
