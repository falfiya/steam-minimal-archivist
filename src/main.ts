// this program assumes that the CWD is the repository root!
import {Config} from "./Config";
import {SteamApi} from "./SteamApi";
import {ArchiveDatabase} from "./ArchiveDatabase";

const config = await Config.new();
if (config.userIds.length === 0 && config.userUrls.length === 0) {
   console.log("Nothing to archive! Quitting...\n");
}

const steam = SteamApi.new(config.apiKey);
const db = ArchiveDatabase.new(config.dbPath);

// inputs come in two forms and so I'd just like a unified list of steamids
const combinedUserIds = [
   ...config.userIds,
   ...await Promise.all(config.userUrls.map(steam.resolveUrl)),
];

const summaries = await steam.summaries(combinedUserIds);
for (const [i, summary] of Object.entries(summaries)) {
   const batchNumber = Number(i) + 1;
   const userId = BigInt(summary.steamid);
   const userName = summary.personaname;

   // batch all requests
   const [
      avatarHash,
      leveling,
      freshFriends,
      recentGames,
      ownedGames
   ] = await Promise.all([
      tryArchiveAvatar(summary.avatarhash, summary.avatarfull),
      steam.leveling(userId),
      steam.friendsList(userId),
      steam.recentGames(userId),
      steam.ownedGames(userId),
   ]);

   const epoch = Math.floor(Date.now() / 1000);
   console.log(`${userName} #${userId}`);
   console.log(`<-> ${batchNumber} of ${summaries.length}`);
   console.log(`<-> Time is ${epoch}`);
   console.log(`<-> Level: ${leveling.player_level}`);

   db.addUser({
      last_updated: epoch,
      id: userId,
      last_logoff: summary.lastlogoff,
   });

   db.addUser2({
      last_updated: epoch,
      id: userId,
      user_name: userName,
      profile_url: summary.profileurl,
      avatar_hash: avatarHash,
      real_name: summary.realname ?? null,
      time_created: summary.timecreated,
      steam_xp: leveling.player_xp,
      steam_level: leveling.player_level,
      steam_xp_needed_to_level_up: leveling.player_xp_needed_to_level_up,
      steam_xp_needed_current_level: leveling.player_xp_needed_current_level,
   });

   console.log(`<-> Recent Games: ${recentGames.length}`);
   const playtime2WeeksLookup: {[appid: string]: number} = Object.create(null);
   for (const recentGame of recentGames) {
      playtime2WeeksLookup[recentGame.appid] = recentGame.playtime_2weeks;
   }

   console.log(`<-> Owned Games: ${ownedGames.length}`);
   for (const game of ownedGames) {
      const playtime_2weeks = playtime2WeeksLookup[game.appid] ?? null;
      const last_played = game.rtime_last_played;

      db.addGame({
         last_updated: epoch,
         id: game.appid,
         name: game.name,
      });

      const {
         playtime_forever,
         playtime_windows_forever,
         playtime_mac_forever,
         playtime_linux_forever,
      } = game;

      db.addPlaytime({
         last_updated: epoch,
         user_id: userId,
         game_id: game.appid,
         playtime_2weeks,
         playtime_forever,
         playtime_windows_forever,
         playtime_mac_forever,
         playtime_linux_forever,
         last_played,
      });

      let gameString = `<----> ${game.name} @ ${game.playtime_forever}min`;
      if (playtime_2weeks) {
         gameString += ` ~ ${playtime_2weeks}min`;
      }
      console.log(gameString);
   }

   const staleFriends = db.getFriends({user_id: userId});
   const friendCountDiff = freshFriends.length - staleFriends.length;
   console.log(`<-> Friends: ${freshFriends.length}`);
   if (friendCountDiff < 0) {
      console.log(`<-> Previously: ${staleFriends.length} (${friendCountDiff})`);
   } else if (friendCountDiff > 0) {
      console.log(`<-> Previously: ${staleFriends.length} (+${friendCountDiff})`);
   } else {
      console.log(`<-> Previously: ${staleFriends.length}`);
   }

   const friendsNotAccountedFor = new Set(staleFriends);
   for (const freshFriend of freshFriends) {
      const {friend_since} = freshFriend;
      const friendId = BigInt(freshFriend.steamid);
      const wasStale = friendsNotAccountedFor.delete(friendId);
      if (!wasStale) {
         console.log(`<---> + #${friendId}`);
      }

      if (userId === friendId) {
         throw new Error(`SANITY: #${userId} is friends with themselves??????`);
      }

      // love it when Math.min doesn't work on bigints!
      if (userId < friendId) {
         var user_a = userId;
         var user_b = friendId;
      } else {
         var user_a = friendId;
         var user_b = userId;
      }

      db.addFriend({
         last_updated: epoch,
         user_a,
         user_b,
         friend_since,
      });
   }
   // and now friendsNotAccountedFor contains only friends that were removed
   for (const removedFriendId of friendsNotAccountedFor) {
      console.log(`<---> - #${removedFriendId}`);

      if (userId < removedFriendId) {
         var user_a = userId;
         var user_b = removedFriendId;
      } else {
         var user_a = removedFriendId;
         var user_b = userId;
      }

      const notFriends = null;
      db.addFriend({
         last_updated: epoch,
         user_a,
         user_b,
         friend_since: notFriends,
      });
   }
}

db.close();

/**
 * If the function succeeds, returns the hash of the avatar downloaded and archived.
 * Otherwise it logs an error to the console and returns null.
 */
async function tryArchiveAvatar(hash: string, url: string): Promise<string | null> {
   if (db.haveAvatar({hash})) {
      console.log(`had ${hash}`);
      return hash;
   }
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
