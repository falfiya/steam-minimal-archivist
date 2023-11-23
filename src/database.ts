// this could probably be sped up by inserting more than one row at a time but
// I doubt speed's gonna be a concern.

import Sqlite3Database, {Statement} from "better-sqlite3";
// @ts-expect-error
import schema from "./schema.sql";
declare const schema: string;

export class SnapshotDB extends Sqlite3Database {
   stmtUsers: Statement;
   stmtGames: Statement;
   stmtAvatars: Statement;
   stmtFriends: Statement;

   constructor () {
      super("data/snapshots.sqlite3");
      this.exec(schema);
      this.stmtUsers = this.prepare(/* sql */ `
         insert into users values (
            :epoch,
            :id,
            :user_name,
            :profile_url,
            :avatar_hash,
            :last_logoff,
            :real_name,
            :time_created,
            :steam_xp,
            :steam_level,
            :steam_xp_needed_to_level_up,
            :steam_xp_needed_current_level
         );
      `)
      this.stmtGames = this.prepare(/* sql */ `
         insert into games values (
            :epoch,
            :user_id,
            :game_id,
            :name,
            :playtime_2weeks,
            :playtime_forever,
            :playtime_windows_forever,
            :playtime_mac_forever,
            :playtime_linux_forever,
            :last_played
         );
      `);
      this.stmtAvatars = this.prepare(/* sql */ `
         insert into users values (
            :hash,
            :data
         );
      `);
      this.stmtFriends = this.prepare(/* sql */ `
         insert into friends values (
            :epoch,
            :source_id,
            :dest_id,
            :friend_since
         );
      `);
   }

   addUser(
      epoch: number,
      id: number,
      user_name: string,
      profile_url: string,
      avatar_hash: string,
      last_logoff: number,
      real_name: string,
      time_created: number,
      steam_xp: number,
      steam_level: number,
      steam_xp_needed_to_level_up: number,
      steam_xp_needed_current_level: number,
   ) {
      this.stmtUsers.run({
         epoch,
         id,
         user_name,
         profile_url,
         avatar_hash,
         last_logoff,
         real_name,
         time_created,
         steam_xp,
         steam_level,
         steam_xp_needed_to_level_up,
         steam_xp_needed_current_level,
      });
   }

   addGame(
      epoch: number,
      user_id: number,
      game_id: number,
      name: string,
      playtime_2weeks: number,
      playtime_forever: number,
      playtime_windows_forever: number,
      playtime_mac_forever: number,
      playtime_linux_forever: number,
      last_played: number,
   ) {
      this.stmtGames.run({
         epoch,
         user_id,
         game_id,
         name,
         playtime_2weeks,
         playtime_forever,
         playtime_windows_forever,
         playtime_mac_forever,
         playtime_linux_forever,
         last_played,
      });
   }

   addAvatar(
      hash: string,
      data: Blob,
   ) {
      this.stmtAvatars.run({
         hash,
         data,
      });
   }

   addFriend(
      epoch: number,
      source_id: number,
      dest_id: number,
      friend_since: number,
   ) {
      this.stmtFriends.run({
         epoch,
         source_id,
         dest_id,
         friend_since,
      });
   }
}
