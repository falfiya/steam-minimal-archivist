import fs from "fs";
import Sqlite3Database, {Statement} from "better-sqlite3";

/*
If further optimization is needed, allow inserting multiple rows at a time.
Otherwise, the db probably isn't the bottleneck.
*/

// @ts-expect-error
import schema from "./schema.sql";
declare const schema: string;

namespace haveAvatar {
   export const sql = /* sql */ `
      select count(*) from avatars where hash = :hash;
   `;
   export type params = {hash: string};
}

namespace addAvatar {
   export const sql = /* sql */ `
      insert into avatars values (
         :hash,
         :data
      );
   `;
   export type params = {hash: string, data: Buffer};
}

namespace addUser {
   export const sql = /* sql */ `
      insert into users values (
         :last_updated,
         :id,

         :last_logoff
      );
   `;
   export type params = {
      last_updated: number,
      id: bigint,

      last_logoff: number,
   };
}

namespace addUser2 {
   export const sql = /* sql */ `
      insert into users2_vw values (
         :last_updated,
         :id,

         :user_name,
         :profile_url,
         :avatar_hash,
         :real_name,
         :time_created,
         :steam_xp,
         :steam_level,
         :steam_xp_needed_to_level_up,
         :steam_xp_needed_current_level
      );
   `;
   export type params = {
      last_updated: number,
      id: bigint,

      user_name: string,
      profile_url: string,
      avatar_hash: string | null,
      real_name: string | null,
      time_created: number,
      steam_xp: number,
      steam_level: number,
      steam_xp_needed_to_level_up: number,
      steam_xp_needed_current_level: number,
   };
}

namespace addGame {
   export const sql = /* sql */ `
      insert into games_vw values (
         :last_updated,
         :id,
         :name
      )
   `;
   export type params = {
      last_updated: number;
      id: number;

      name: string;
   }
}

namespace addPlaytime {
   export const sql = /* sql */ `
      insert into playtime_vw values (
         :last_updated,
         :user_id,
         :game_id,

         :playtime_2weeks,
         :playtime_forever,
         :playtime_windows_forever,
         :playtime_mac_forever,
         :playtime_linux_forever,
         :last_played
      );
   `;
   export type params = {
      last_updated: number,
      user_id: bigint,
      game_id: number,

      playtime_2weeks: number | null,
      playtime_forever: number,
      playtime_windows_forever: number;
      playtime_mac_forever: number;
      playtime_linux_forever: number;
      last_played: number;
   };
}

namespace getFriends {
   /** Remember to turn safeIntegers on and use .raw mode! */
   export const sql = /* sql */ `
      select user_a as friend from friends_vw where user_b = :user_id
      union
      select user_b as friend from friends_vw where user_a = :user_id;
   `;
   export type params = {user_id: bigint};
   export type returnValue = bigint[];
}

namespace addFriend {
   export const sql = /* sql */ `
      insert into friends_vw values (
         :last_updated,
         :user_a,
         :user_b,
         :friend_since
      );
   `;
   export type params = {
      last_updated: number;
      user_a: bigint;
      user_b: bigint;
      /** A value of null means that these two users are no longer friends :( */
      friend_since: number | null;
   };
}

export class ArchiveDatabase extends Sqlite3Database {
   schemaVersion = 1;

   stmtHaveAvatar: Statement;
   stmtAddAvatar: Statement;
   stmtAddUser: Statement;
   stmtAddUser2: Statement;
   stmtAddGame: Statement;
   stmtAddPlaytime: Statement;
   stmtGetFriends: Statement;
   stmtAddFriend: Statement;

   static new(location: string): ArchiveDatabase {
      if (!fs.existsSync(location)) {
         // provision db
         const db = new Sqlite3Database(location);
         db.exec(schema)
         db.close();
      }
      return new ArchiveDatabase(location);
   }

   constructor (location: string) {
      super(location, {fileMustExist: true});
      this.pragma("foreign_keys = on");
      this.verify();

      this.stmtHaveAvatar = this.prepare(haveAvatar.sql);
      this.stmtAddAvatar = this.prepare(addAvatar.sql);
      this.stmtAddUser = this.prepare(addUser.sql);
      this.stmtAddUser2 = this.prepare(addUser2.sql);
      this.stmtAddGame = this.prepare(addGame.sql);
      this.stmtAddPlaytime = this.prepare(addPlaytime.sql);
      this.stmtGetFriends = this.prepare(getFriends.sql);
      this.stmtGetFriends.safeIntegers(true);
      this.stmtGetFriends.raw(true);
      this.stmtAddFriend = this.prepare(addFriend.sql);
   }

   verify() {
      const selectStmt = this.prepare(/* sql */ `
         select schema_version from sma_meta;
      `);
      const diskVersion = selectStmt.get();
      const adapterVersion = this.schemaVersion;
      if (diskVersion !== adapterVersion) {
         throw new Error(`The schema on disk is ${diskVersion} but the adapter version is ${adapterVersion}!`);
      }
   }

   haveAvatar(p: haveAvatar.params): boolean {
      return !!this.stmtHaveAvatar.get(p);
   }

   addAvatar(p: addAvatar.params) {
      this.stmtAddAvatar.run(p);
   }

   addUser(p: addUser.params) {
      this.stmtAddUser.run(p);
   }

   addUser2(p: addUser2.params) {
      this.stmtAddUser2.run(p);
   }

   addGame(p: addGame.params) {
      this.stmtAddGame.run(p);
   }

   addPlaytime(p: addPlaytime.params) {
      this.stmtAddPlaytime.run(p);
   }

   getFriends(p: getFriends.params): getFriends.returnValue {
      // @ts-expect-error
      return this.stmtGetFriends.all(p).flat();
   }

   addFriend(p: addFriend.params) {
      this.stmtAddFriend.run(p);
   }

   override close(): this {
      super.pragma("optimize");
      return super.close();
   }
}
