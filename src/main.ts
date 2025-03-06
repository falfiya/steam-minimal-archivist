// this program assumes that the CWD is the repository root!
import {SteamAPI} from "./SteamAPI";
import {gepoch, sepoch, log} from "./util";
import {loadConfig} from "./config";
import {openDatabase} from "./db";

const config = await loadConfig();

if (config.userIds.length === 0 && config.userUrls.length === 0) {
   log.panic("No users to archive! Exiting...\n");
}

const steam = new SteamAPI(config.apiKey);
const db = await openDatabase(config.dbPath);

// inputs come in two forms and so I'd just like a unified list of steamids
const combinedUserIds = [
   ...config.userIds,
   ...await Promise.all(config.userUrls.map(steam.resolveUrl)),
];

log.title(`Starting Snapshot at ${sepoch()}`);

log("BATCH", "*",
   `${combinedUserIds.length} user${combinedUserIds.length === 1 ? "" : "s"} found.`,
   "Fetching player summaries...",
);

const summaries = await steam.summaries(combinedUserIds);

for (const [i, summary] of Object.entries(summaries)) {
   const userId = summary.steamid;
   const userName = summary.personaname;

   log.title(`${userName} #${userId.slice(0, 7)}... @ ${sepoch()}`);
   log("USER", "#", `${Number(i) + 1} of ${summaries.length}`);

   const epoch = gepoch();

   // batch all requests
   const [
      leveling,
      friends,
      recentGames,
      ownedGames
   ] = await Promise.all([
      steam.leveling(userId),
      steam.friendsList(userId),
      steam.recentGames(userId),
      steam.ownedGames(userId),
      archiveAvatar(summary.avatarhash, summary.avatarfull),
   ]);

   /**
    * User Identification Bigint
    */
   const userIb = BigInt(userId);

   db.putUserAt({
      epoch,
      id: userIb,
      time_created: summary.timecreated,

      last_logoff: summary.lastlogoff,

      user_name: userName,
      profile_url: summary.profileurl,
      avatar_hash: summary.avatarhash,
      real_name: summary.realname ?? null,

      steam_xp: leveling.player_xp,
      steam_level: leveling.player_level,
      steam_xp_needed_to_level_up: leveling.player_xp_needed_to_level_up,
      steam_xp_needed_current_level: leveling.player_xp_needed_current_level,
   });

   log("GAMES", "#", `Recent: ${recentGames.length}`);

   /**
    * The metric for playtime2weeks comes in a separate API call. We will use
    * this object to unify them.
    */
   const playtime2WeeksLookup: {[appid: string]: number} =
      Object.create(null);
   for (const recentGame of recentGames) {
      playtime2WeeksLookup[recentGame.appid] = recentGame.playtime_2weeks;
   }


   log("GAMES", "#", `Owned: ${ownedGames.length}`);
   for (const game of ownedGames) {
      const playtime_2weeks = playtime2WeeksLookup[game.appid] ?? 0;
      const last_played = game.rtime_last_played;

      db.putGameAt({
         epoch,
         id: game.appid,
         name: game.name,
      });

      const {
         playtime_forever,
         playtime_windows_forever,
         playtime_mac_forever,
         playtime_linux_forever,
      } = game;

      db.putPlaytimeAt({
         epoch,
         user_id: userIb,
         game_id: game.appid,
         playtime_2weeks,
         playtime_forever,
         playtime_windows_forever,
         playtime_mac_forever,
         playtime_linux_forever,
         last_played,
      });

      let logMsg = `${game.name} @ ${game.playtime_forever}min`;
      if (playtime_2weeks) {
         logMsg += ` ~ ${playtime_2weeks}min`;
      }
      log("GAMES", "%", logMsg);
   }

   for (const friend of friends) {
      db.putFriendAt({
         epoch,
         user_a: BigInt(friend.steamid),
         user_b: userIb,
         friends_since: friend.friend_since,
      });
   }
}

db.close();

async function archiveAvatar(hash: string, url: string): Promise<void> {
   if (db.hasAvatar({hash})) {
      log("AVTR", "^", hash);
      return;
   }

   const avatar = await fetch(url);
   const data = Buffer.from(await avatar.arrayBuffer());
   if (data.byteLength > 2000000) {
      throw new Error("Avatar Size Cannot Exceed 2MB!");
   }

   db.putAvatar({hash, data});
   log("AVTR", "+", hash);
}
