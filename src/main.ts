// this program assumes that the CWD is the repository root!
import fs from "fs";
import * as S from "./steamapi.js";

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
const combinedUserIds = [...config.userIds];
for (const url of config.userUrls) {
   combinedUserIds.push(await S.getSteamIdFromUrl({key, url}));
}

for (const steamid of combinedUserIds) {
   const summaryRes = await S.GetPlayerSummaries({key, steamids: [steamid]});
   const summary = summaryRes.response.players[0]!;
   const friendsRes = await S.GetFriendList({key, steamid});
   const {friends} = friendsRes.friendslist;
   const friendSteamids = friends.map(f => f.steamid);
   const friendSummaryRes = await S.GetPlayerSummaries({key, steamids: friendSteamids});
   console.log(`${summary.personaname} has ${friends.length} friends:`);
   for (const friendSummary of friendSummaryRes.response.players) {
      console.log(`- ${friendSummary.personaname} (${friendSummary.realname})`);
   }
}
