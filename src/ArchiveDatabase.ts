import Sqlite3Database, {Statement} from "better-sqlite3";
// @ts-expect-error
import schema from "./schema.sql";
declare const schema: string;

export class ArchiveDatabase extends Sqlite3Database {
   schemaVersion = "v1.0.0";

   stmtUsers: Statement;
   stmtGames: Statement;
   stmtAvatars: Statement;
   stmtFriends: Statement;

   init() {
      this.exec(schema);
   }

   constructor (location: string) {
      super(location);
      this.pragma("foreign_keys = on");
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
         insert or ignore into avatars values (
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
      o: {
         epoch: number,
         id: bigint,
         user_name: string,
         profile_url: string,
         avatar_hash: string | null,
         last_logoff: number,
         real_name: string,
         time_created: number,
         steam_xp: number,
         steam_level: number,
         steam_xp_needed_to_level_up: number,
         steam_xp_needed_current_level: number,
      }
   ) { this.stmtUsers.run(o) }

   addGame(
      o: {
         epoch: number,
         user_id: bigint,
         game_id: number,
         name: string,
         playtime_2weeks: number | null,
         playtime_forever: number,
         playtime_windows_forever: number,
         playtime_mac_forever: number,
         playtime_linux_forever: number,
         last_played: number,
      }
   ) { this.stmtGames.run(o) }

   addAvatar(
      o: {
         hash: string,
         data: Buffer,
      }
   ) { this.stmtAvatars.run(o) }

   addFriend(
      o: {
         epoch: number,
         source_id: string,
         dest_id: string,
         friend_since: number,
      }
   ) { this.stmtFriends.run(o) }

   override close(): this {
      super.pragma("optimize");
      return super.close();
   }
}

/* Notes Section
If further optimization is needed, allow inserting multiple rows at a time.
Otherwise, the db probably isn't the bottleneck.
*/
