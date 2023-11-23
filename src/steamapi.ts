// Incomplete implementation of the Steam API
// Please don't use this as some kind of complete reference since I've only
// included the parts I care about!

async function fetchJSON(url: string): Promise<any> {
   const res = await fetch(url);
   try {
      return res.json();
   } catch (e) {
      console.error(await res.text());
      throw e;
   }
}

export type InputSteamId = string | number;

// IPlayerService
function GetRecentlyPlayedGames(opts: GetRecentlyPlayedGames.Opts): Promise<GetRecentlyPlayedGames.Res> {
   return fetchJSON(`${GetRecentlyPlayedGames.endpoint}?key=${opts.key}&steamid=${opts.steamid}`);
}
namespace GetRecentlyPlayedGames {
   export const endpoint = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1"
   export type Opts = {
      key: string;
      steamid: InputSteamId;
   };
   export type RecentlyPlayedGame = {
      appid: number;
      name: string;
      playtime2_weeks: number;
      playtime_forever: number;
      img_icon_url: string;
      playtime_windows_forever: number;
      playtime_mac_forever: number;
      playtime_linux_forever: number;
   };
   export type Res = {
      response: {
         /** uint */
         total_count: number;
         /** typically this is no more than three long */
         games: RecentlyPlayedGame[];
      };
   };
}

function GetOwnedGames(opts: GetOwnedGames.Opts): Promise<GetOwnedGames.Res> {
   return fetchJSON(`${GetOwnedGames.endpoint}?key=${opts.key}&steamid=${opts.steamid}&include_appinfo=true&include_played_free_games=true`);
}
namespace GetOwnedGames {
   export const endpoint = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1"
   export type Opts = {
      key: string;
      steamid: InputSteamId;
   };
   export type OwnedGame = {
      appid: number;
      name: string;
      playtime2_weeks: number;
      playtime_forever: number;
      img_icon_url: string;
      playtime_windows_forever: number;
      playtime_mac_forever: number;
      playtime_linux_forever: number;
      rtime_last_played: number;
      playtime_disconnected: number;
   };
   export type Res = {
      response: {
         /** uint */
         total_count: number;
         /** typically this is no more than three long */
         games: OwnedGame[];
      };
   };
}
function GetBadges(opts: GetBadges.Opts): Promise<GetBadges.Res> {
   return fetchJSON(`${GetBadges.endpoint}?key=${opts.key}&steamid=${opts.steamid}`);
}
namespace GetBadges {
   export const endpoint = "https://api.steampowered.com/ISteamUser/GetBadges/v1"
   export type Opts = {
      key: string;
      steamid: InputSteamId;
   };
   export type Res = {
      response: {
         badges: any[];
         player_xp: number;
         player_level: number;
         player_xp_needed_to_level_up: number;
         player_xp_needed_current_level: number;
      };
   };
}

// ISteamUser
function GetFriendList(opts: GetFriendList.Opts): Promise<GetFriendList.Res> {
   return fetchJSON(`${GetFriendList.endpoint}?key=${opts.key}&steamid=${opts.steamid}`);
}
namespace GetFriendList {
   export const endpoint = "https://api.steampowered.com/ISteamUser/GetFriendList/v1"
   export type Opts = {
      key: string;
      steamid: InputSteamId;
   };
   export type Friend = {
      steamid: string;
      /** usually "friend" it seems */
      relationship: string;
      friend_since: number;
   };
   export type Res = {
      friendslist: {
         friends: Friend[];
      };
   };
}

function GetPlayerSummaries(opts: GetPlayerSummaries.Opts): Promise<GetPlayerSummaries.Res> {
   return fetchJSON(`${GetPlayerSummaries.endpoint}?key=${opts.key}&steamids=${opts.steamids.join(',')}`);
}
namespace GetPlayerSummaries {
   export const endpoint = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2"
   export type Opts = {
      key: string;
      steamids: InputSteamId[];
   };
   export type SteamUserSummary = {
      steamid: string;
      communityvisibilitystate: number;
      profilestate: number;
      personaname: string;
      profileurl: string;
      avatarfull: string;
      avatarhash: string;
      lastlogoff: number;
      personastate: number;
      realname: string;
      primaryclanid: string;
      timecreated: number;
      personastateflags: number;
      loccountrycode?: string;
      locstatecode?: string;
   };
   export type Res = {
      response: {
         players: SteamUserSummary[];
      };
   };
}

function ResolveVanityUrl(opts: ResolveVanityUrl.Opts): Promise<ResolveVanityUrl.Res> {
   return fetchJSON(`${ResolveVanityUrl.endpoint}?key=${opts.key}&vanityurl=${opts.vanityurl}`);
}
namespace ResolveVanityUrl {
   export const endpoint = "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1"
   export type Opts = {
      key: string;
      vanityurl: string;
   };
   export type Res = {
      response: {
         steamid: string;
         success: 1;
      };
   };
}
async function getSteamIdFromUrl({key, url}: getSteamIdFromUrl.Opts): Promise<string> {
   const profileMatch = url.match(/^https?:\/{2}steamcommunity.com\/profiles\/(?<steamid>\d+)/);
   if (profileMatch) {
      return profileMatch.groups?.steamid as string;
   }
   // I'm pretty sure this regex doesn't cover every case but I don't really care
   const vanityMatch = url.match(/^https?:\/{2}steamcommunity.com\/id\/(?<vanityurl>[a-z-_A-Z]+)/)
   if (vanityMatch) {
      const res = await ResolveVanityUrl({key, vanityurl: vanityMatch.groups?.vanityurl as string});
      return res.response.steamid;
   }
   else {
      throw new Error(`Cannot recognize the url ${JSON.stringify(url)} as a Steam Profile URL`);
   }
}
namespace getSteamIdFromUrl {
   export type Opts = {
      key: string;
      url: string;
   };
}

export {
   GetRecentlyPlayedGames,
   GetOwnedGames,
   GetBadges,
   GetFriendList,
   GetPlayerSummaries,
   ResolveVanityUrl,
   getSteamIdFromUrl,
};
