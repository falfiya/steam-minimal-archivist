// this program assumes that the CWD is the repository root!
import fs from "fs";
import * as API from "./steamapi.js";
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
   combinedUserIds.push(await API.getSteamIdFromUrl({key, url}));
}

const summariesRes = await API.GetPlayerSummaries({key, steamids: combinedUserIds});
const summaries = summariesRes.response.players;

if (summaries.length === 1) {
   console.log("Archiving 1 Steam User");
} else {
   console.log(`Archiving ${summaries.length} Steam Users`);
}

const S = new SnapshotDB;
const now = () => Math.floor(Date.now() / 1000);

for (let i = 0; i < summaries.length; i++) {
   const currentPlayer = summaries[i]!;
   const {steamid} = currentPlayer;

   console.log(`${currentPlayer.personaname} #${steamid}`);
   console.log(`<-> ${i + 1}/${summaries.length}`);

   const pLeveling = API.GetBadges({key, steamid});
   const pFriends = API.GetFriendList({key, steamid});
   const pRecentGames = API.GetRecentlyPlayedGames({key, steamid});
   const pOwnedGames = API.GetOwnedGames({key, steamid});

   let avatar_hash: string | null;
   try {
      const avatar = await fetch(currentPlayer.avatarfull);
      const avatarBuffer = Buffer.from(await avatar.arrayBuffer());
      if (avatarBuffer.byteLength > 2000000) {
         throw new Error("Avatar Size Cannot Exceed 2MB!");
      }
      S.addAvatar({hash: currentPlayer.avatarhash, data: avatarBuffer});
      avatar_hash = currentPlayer.avatarhash;
   } catch (e) {
      console.error(e);
      avatar_hash = null;
   }

   const epoch = now();
   const leveling = (await pLeveling).response;
   console.log(`<-> Level: ${leveling.player_level}`);
   S.addUser({
      epoch,
      id: steamid,
      user_name: currentPlayer.personaname,
      profile_url: currentPlayer.profileurl,
      avatar_hash,
      last_logoff: currentPlayer.lastlogoff,
      real_name: currentPlayer.realname,
      time_created: currentPlayer.timecreated,
      steam_xp: leveling.player_xp,
      steam_level: leveling.player_level,
      steam_xp_needed_to_level_up: leveling.player_xp_needed_to_level_up,
      steam_xp_needed_current_level: leveling.player_xp_needed_current_level,
   });

   const friends = (await pFriends).friendslist.friends;
   console.log(`<-> Friends: ${friends.length}`);

   for (const friend of friends) {
      S.addFriend({
         epoch,
         source_id: steamid,
         dest_id: friend.steamid,
         friend_since: friend.friend_since,
      });
      console.log(`<----> ${friend.steamid}`);
   }

   const recentGames = (await pRecentGames).response.games;
   console.log(`<-> Recent Games: ${recentGames.length}`);
   const recentGamesLookup:
      {[appid: string]: API.GetRecentlyPlayedGames.RecentlyPlayedGame}
         = {};
   for (const recentGame of recentGames) {
      recentGamesLookup[recentGame.appid] = recentGame;
   }

   const ownedGames = (await pOwnedGames).response.games;
   console.log(`<-> Owned Games: ${ownedGames.length}`);

   for (const game of ownedGames) {
      const recentGame = recentGamesLookup[game.appid];
      let playtime_2weeks: number | null;
      if (recentGame) {
         playtime_2weeks = recentGame.playtime_2weeks;
      } else {
         playtime_2weeks = null;
      }

      const last_played = game.rtime_last_played;

      S.addGame({
         ...game,
         epoch,
         playtime_2weeks,
         last_played,
         user_id: steamid,
         game_id: game.appid,
      });
      process.stdout.write(`<----> ${game.name} @ ${game.playtime_forever}min`);
      if (playtime_2weeks) {
         process.stdout.write(` ~ ${playtime_2weeks}min`);
      }
      process.stdout.write("\n")
   }
}

S.close();
