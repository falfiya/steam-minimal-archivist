type SteamId = string | bigint;
/** Incomplete implementation of the Steam API */
export class SteamApi {
   static new(key: string): SteamApi {
      return new SteamApi(key);
   }
   private constructor (private key: string) {}
   /** Call the API and decode the JSON. Handle errors too. */
   async call<T>(endpoint: string, queryString: string): Promise<T> {
      const url = `https://api.steampowered.com/${endpoint}?key=${this.key}&${queryString}`;
      const res = await fetch(url);
      if (res.ok) {
         try {
            const obj = await res.json();
            return obj as T;
         } catch (e) {
            console.error(await res.text());
            throw e;
         }
      } else {
         console.error(await res.text());
         throw new Error(`Fetch was not OK! Status = ${res.status} (${res.statusText})`);
      }
   }

   async recentGames(steamId: SteamId) {
      type RecentlyPlayedGame = {
         appid: number;
         name: string;
         playtime_2weeks: number;
         playtime_forever: number;
         img_icon_url: string;
         playtime_windows_forever: number;
         playtime_mac_forever: number;
         playtime_linux_forever: number;
      };
      // type RecentlyPlayed game is going to live outside this function
      type GetRecentlyPlayedGames = {
         response: {
            total_count: number;
            /** typically this is no more than three long */
            games: RecentlyPlayedGame[];
         };
      };
      const res = await this.call<GetRecentlyPlayedGames>(
         "IPlayerService/GetRecentlyPlayedGames/v1",
         `steamid=${steamId}`,
      );
      return res.response.games;
   }

   async ownedGames(steamId: SteamId) {
      type OwnedGame = {
         appid: number;
         name: string;
         playtime_forever: number;
         img_icon_url: string;
         playtime_windows_forever: number;
         playtime_mac_forever: number;
         playtime_linux_forever: number;
         rtime_last_played: number;
         playtime_disconnected: number;
      };
      type GetOwnedGames = {
         response: {
            total_count: number;
            games: OwnedGame[];
         };
      };
      const res = await this.call<GetOwnedGames>(
         "IPlayerService/GetOwnedGames/v1",
         `steamid=${steamId}&include_appinfo=true&include_played_free_games=true`
      );
      return res.response.games;
   }

   async leveling(steamId: SteamId) {
      type GetBadges = {
         response: {
            badges: any[];
            player_xp: number;
            player_level: number;
            player_xp_needed_to_level_up: number;
            player_xp_needed_current_level: number;
         };
      };
      const res = await this.call<GetBadges>(
         "IPlayerService/GetBadges/v1",
         `steamid=${steamId}`,
      );
      return res.response;
   }

   async friendsList(steamId: SteamId) {
      type Friend = {
         steamid: string;
         /** usually "friend" it seems */
         relationship: string;
         friend_since: number;
      };
      type GetFriendList = {
         friendslist: {
            friends: Friend[];
         };
      };
      const res = await this.call<GetFriendList>(
         "ISteamUser/GetFriendList/v1",
         `steamid=${steamId}`,
      );
      return res.friendslist.friends;
   }

   async summaries(steamIds: SteamId[]) {
      type SteamUserSummary = {
         steamid: string;
         communityvisibilitystate: number;
         profilestate: number;
         personaname: string;
         profileurl: string;
         avatarfull: string;
         avatarhash: string;
         lastlogoff: number;
         personastate: number;
         realname?: string;
         primaryclanid: string;
         timecreated: number;
         personastateflags: number;
         loccountrycode?: string;
         locstatecode?: string;
      }
      type GetPlayerSummaries = {
         response: {
            players: SteamUserSummary[];
         };
      };
      const res = await this.call<GetPlayerSummaries>(
         "ISteamUser/GetPlayerSummaries/v2",
         `steamids=${steamIds.join(',')}`,
      );
      return res.response.players;
   }

   async resolveVanityUrl(vanityUrl: string) {
      type ResolveVanityURL = {
         response: {
            steamid: string;
            success: 1;
         };
      };
      const res = await this.call<ResolveVanityURL>(
         "ISteamUser/ResolveVanityURL/v1",
         `vanityurl=${vanityUrl}`,
      );
      return res.response.steamid;
   }

   resolveUrl(url: string): Promise<string> {
      const profileMatch = url.match(/^https?:\/{2}steamcommunity.com\/profiles\/(?<steamid>\d+)/);
      if (profileMatch) {
         return Promise.resolve(profileMatch.groups?.steamid as string);
      }
      // I'm pretty sure this regex doesn't cover every case but I don't really care
      const vanityMatch = url.match(/^https?:\/{2}steamcommunity.com\/id\/(?<vanityurl>[a-z-_A-Z]+)/)
      if (vanityMatch) {
         return this.resolveVanityUrl(vanityMatch.groups?.vanityurl as string);
      }
      else {
         throw new Error(`Cannot recognize the url ${JSON.stringify(url)} as a Steam Profile URL`);
      }
   }
}
export namespace SteamApi {
   type ReturnOf<methodName extends keyof SteamApi> =
      ReturnType<SteamApi[methodName]> extends Promise<infer T>
      ? T
      : never;

   export type RecentGames = ReturnOf<"recentGames">;
   export type OwnedGames = ReturnOf<"ownedGames">;
   export type Leveling = ReturnOf<"leveling">;
   export type FriendsList = ReturnOf<"friendsList">;
   export type Summaries = ReturnOf<"summaries">;
}
