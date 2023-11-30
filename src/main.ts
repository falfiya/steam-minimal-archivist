// this program assumes that the CWD is the repository root!
import {Config} from "./Config";
import {ArchiveDatabase} from "./ArchiveDatabase";
import {SteamApi, RecentlyPlayedGame} from "./SteamApi";

const config = await Config.new();
const steam = new SteamApi(config.apiKey);
const db = new ArchiveDatabase(config.dbPath);

// inputs come in two forms and so I'd just like a unified list of steamids
const combinedUserIds = [
   ...config.userIds,
   ...await Promise.all(config.userUrls.map(steam.resolveUrl)),
];

const summaries = await steam.summaries(combinedUserIds);
for (const [summaryNumber, summary] of Object.entries(summaries)) {
   const epoch = Math.floor(Date.now() / 1000);

   const userId = summary.steamid;
   console.log(`${summary.personaname} #${userId}`);
   console.log(`<-> ${summaryNumber + 1} of ${summaries.length}`);

   // batch all requests
   const [
      avatarHash,
      leveling,
      friends,
      recentGames,
      ownedGames
   ] = await Promise.all([
      tryArchiveAvatar(summary.avatarhash, summary.avatarfull),
      steam.leveling(userId),
      steam.friendsList(userId),
      steam.recentGames(userId),
      steam.ownedGames(userId),
   ]);

   archiveUsre();
   archiveUser2(leveling);
   archiveUserFriends(epoch, userId, friends);

   console.log(`<-> Recent Games: ${recentGames.length}`);
   const recentGamesLookup:
      {[appid: string]: API.GetRecentlyPlayedGames.RecentlyPlayedGame}
         = {};
   for (const recentGame of recentGames) {
      recentGamesLookup[recentGame.appid] = recentGame;
   }

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

      db.addGame({
         ...game,
         epoch,
         playtime_2weeks,
         last_played,
         user_id: BigInt(userId),
         game_id: game.appid,
      });
      process.stdout.write(`<----> ${game.name} @ ${game.playtime_forever}min`);
      if (playtime_2weeks) {
         process.stdout.write(` ~ ${playtime_2weeks}min`);
      }
      process.stdout.write("\n")
   }
}

db.close();

/**
 * If the function succeeds, returns the hash of the avatar downloaded and archived.
 * Otherwise it logs an error to the console and returns null.
 */
async function tryArchiveAvatar(hash: string, url: string): Promise<string | null> {
   try {
      const avatar = await fetch(url);
      const avatarBuffer = Buffer.from(await avatar.arrayBuffer());
      if (avatarBuffer.byteLength > 2000000) {
         throw new Error("Avatar Size Cannot Exceed 2MB!");
      }
      db.addAvatar({hash, data: avatarBuffer});
      return hash;
   } catch (e) {
      console.error(e);
      return null;
   }
}

function archiveUser2(
   epoch: number,
   userId: string,
   summary: SteamApi.SteamUserSummary,
   leveling: SteamApi.Leveling,
) {
   console.log(`<-> Level: ${leveling.player_level}`);
   db.addUser({
      epoch,
      id: BigInt(userId),
      user_name: summary.personaname,
      profile_url: currentPlayer.profileurl,
      avatar_hash: avatarHash,
      last_logoff: currentPlayer.lastlogoff,
      real_name: currentPlayer.realname,
      time_created: currentPlayer.timecreated,
      steam_xp: leveling.player_xp,
      steam_level: leveling.player_level,
      steam_xp_needed_to_level_up: leveling.player_xp_needed_to_level_up,
      steam_xp_needed_current_level: leveling.player_xp_needed_current_level,
   });
}

function archiveUserFriends(epoch: number, userId: string, friends: SteamApi.FriendsList) {
   console.log(`<-> Friends: ${friends.length}`);

   for (const friend of friends) {
      db.addFriend({
         epoch,
         source_id: userId,
         dest_id: friend.steamid,
         friend_since: friend.friend_since,
      });
      console.log(`<----> ${friend.steamid}`);
   }
}
