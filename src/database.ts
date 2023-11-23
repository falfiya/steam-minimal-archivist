import Sqlite3Database, {Statement} from "better-sqlite3";
// @ts-expect-error
import schema from "./schema.sql";
declare const schema: string;

export class SnapshotDB extends Sqlite3Database {
   stmtUsers: Statement;
   stmtGames: Statement;
   stmtAvatars: Statement;

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
      `);
      this.stmtAvatars = this.prepare(/* sql */ `
         insert into users values (
            :hash,
            :data
         );
      `);
   }
}
