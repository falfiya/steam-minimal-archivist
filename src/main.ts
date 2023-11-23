// this program assumes that the CWD is the repository root!
import fs from "fs";
import * as S from "./steamapi.js";
import {SnapshotDB} from "./database.js";

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

const {key} = config;

// inputs come in two forms and so I'd just like a unified list of steamids
const combinedUserIds = [...config.userIds];
for (const url of config.userUrls) {
   combinedUserIds.push(await S.getSteamIdFromUrl({key, url}));
}

const summariesRes = await S.GetPlayerSummaries({key, steamids: combinedUserIds});
const summaries = summariesRes.response.players;

if (summaries.length === 1) {
   console.log("Archiving 1 Steam User");
} else {
   console.log(`Archiving ${summaries.length} Steam Users`);
}

const A = new SnapshotDB;

for (let i = 0; i < summaries.length; i++) {
   const summary = summaries[i]!;
   summary.steamid
}

// for (const steamid of combinedUserIds) {
//    const summaryRes = await S.GetPlayerSummaries({key, steamids: [steamid]});
//    const summary = summaryRes.response.players[0]!;
//    const friendsRes = await S.GetFriendList({key, steamid});
//    const {friends} = friendsRes.friendslist;
//    const friendSteamids = friends.map(f => f.steamid);
//    const friendSummaryRes = await S.GetPlayerSummaries({key, steamids: friendSteamids});
//    console.log(`${summary.personaname} has ${friends.length} friends:`);
//    for (const friendSummary of friendSummaryRes.response.players) {
//       console.log(`- ${friendSummary.personaname} (${friendSummary.realname})`);
//    }
// }

new SnapshotDB;
