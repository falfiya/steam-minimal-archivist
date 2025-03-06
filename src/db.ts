import fs from "fs";
import path from "path";
import sqlite3 from "better-sqlite3";
import {gepoch} from "./util";
import * as zstd from "@mongodb-js/zstd";

// This is telling esbuild to include the file as a string
// @ts-expect-error
import schema from "./schema.sql";
declare const schema: string;

export async function openDatabase(path: string): Promise<smaDB> {
   let db;
   if (fs.existsSync(path)) {
      db = await loadDatabase(path);
   } else {
      db = createDatabase();
   }

   return new smaDB(path, db);
}

async function loadDatabase(path: string): Promise<sqlite3.Database> {
   const compressed = fs.readFileSync(path);
   const decompressed = await zstd.decompress(compressed);
   return new sqlite3(decompressed);
}

/**
 * Creates a database and writes it out.
 */
function createDatabase(): sqlite3.Database {
   const db = new sqlite3(":memory:");
   db.exec(schema)
   return db;
}

type Stmt = sqlite3.Statement;

export class smaDB {
   constructor (public path: string, public db: sqlite3.Database) {
      db.pragma("foreign_keys = on");

      this._begin = db.prepare("begin transaction;");
      this._commit = db.prepare("commit;");
      this._rollback = db.prepare("rollback;");

      this._getMeta = db.prepare(smaDB._getMeta);
      this._hasAvatar = db.prepare(smaDB._hasAvatar).raw();
      this._putAvatar = db.prepare(smaDB._putAvatar);
      this._putUserAt = db.prepare(smaDB._putUserAt);
      this._putGameAt = db.prepare(smaDB._putGameAt);
      this._putPlaytimeAt = db.prepare(smaDB._putPlaytimeAt);
      this._putFriendAt = db.prepare(smaDB._putFriendAt);
      this._setVacuumed = db.prepare(smaDB._setVacuumed);
   }

   private _begin: Stmt;
   begin() {
      this._begin.run();
   }

   private _commit: Stmt;
   commit() {
      this._commit.run();
   }

   private _rollback: Stmt;
   rollback() {
      this._rollback.run();
   }

   private _getMeta: Stmt;
   static _getMeta = /* sql */ `
      select vmajor, vminor, vpatch, last_vacuumed from meta;
   `;
   getMeta() {
      type Metadata = {
         vmajor: number;
         vminor: number;
         vpatch: number;
         last_vacuumed: number;
      };
      const [meta] = this._getMeta.all();
      if (meta == null) {
         throw new TypeError("Could not get metadata!");
      }
      return meta as Metadata;
   }

   private _hasAvatar: Stmt;
   static _hasAvatar = /* sql */ `
      select count(*) as count from avatars where hash = :hash;
   `;
   hasAvatar(o: {hash: string}): boolean {
      // @ts-expect-error
      return !!this._hasAvatar.get(o)[0];
   }

   private _putAvatar: Stmt;
   static _putAvatar = /* sql */ `
      insert into avatars(id, hash, data) values
         (null, :hash, :data) on conflict do nothing;
   `;
   putAvatar(o: {hash: string, data: Buffer}) {
      this._putAvatar.run(o);
   }

   private _putUserAt: Stmt;
   static _putUserAt = /* sql */ `
      insert into user_at(
         epoch,
         id,
         time_created,

         last_logoff,

         user_name,
         profile_url,
         avatar_hash,
         real_name,

         steam_xp,
         steam_level,
         steam_xp_needed_to_level_up,
         steam_xp_needed_current_level
      )
      values (
         :epoch,
         :id,

         :time_created,

         :last_logoff,

         :user_name,
         :profile_url,
         :avatar_hash,
         :real_name,

         :steam_xp,
         :steam_level,
         :steam_xp_needed_to_level_up,
         :steam_xp_needed_current_level
      );
   `;
   putUserAt(o: {
      epoch: number,
      id: bigint,
      time_created: number,

      last_logoff: number,

      user_name: string,
      profile_url: string,
      avatar_hash: string | null,
      real_name: string | null,

      steam_xp: number,
      steam_level: number,
      steam_xp_needed_to_level_up: number,
      steam_xp_needed_current_level: number,
   }) {
      this._putUserAt.run(o);
   }

   private _putGameAt: Stmt;
   static _putGameAt = /* sql */ `
      insert into game_at(epoch, id, name)
         values (:epoch, :id, :name);
   `;
   putGameAt(o: {
      epoch: number,
      id: number,
      name: string,
   }) {
      this._putGameAt.run(o);
   }

   private _putPlaytimeAt: Stmt;
   static _putPlaytimeAt = /* sql */ `
      insert into playtime_at(
         epoch,
         user_id,
         game_id,

         playtime_2weeks,
         playtime_forever,
         playtime_windows_forever,
         playtime_mac_forever,
         playtime_linux_forever,
         last_played
      )
      values (
         :epoch,
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
   putPlaytimeAt(o: {
      epoch: number,
      user_id: bigint,
      game_id: number,

      playtime_2weeks: number,
      playtime_forever: number,
      playtime_windows_forever: number,
      playtime_mac_forever: number,
      playtime_linux_forever: number,
      last_played: number,
   }) {
      this._putPlaytimeAt.run(o);
   }

   private _putFriendAt: Stmt;
   static _putFriendAt = /* sql */ `
      insert into friend_at(epoch, user_a, user_b, friends_since)
         values (:epoch, :user_a, :user_b, :friends_since);
   `;
   putFriendAt(o: {
      epoch: number,
      user_a: bigint,
      user_b: bigint,
      friends_since: number,
   }) {
      if (o.user_a > o.user_b) {
         [o.user_a, o.user_b] = [o.user_b, o.user_a];
      }
      this._putFriendAt.run(o);
   }

   private _setVacuumed: Stmt;
   static _setVacuumed = /* sql */ `
      update meta set last_vacuumed = ?;
   `;
   setVacuumed() {
      this._setVacuumed.run(gepoch());
   }

   static vacuumInterval = 1000000;
   async close() {
      this.db.pragma("optimize");
      if (this.getMeta().last_vacuumed + smaDB.vacuumInterval < gepoch()) {
         this.db.exec("vacuum");
         this.setVacuumed();
      }

      fs.mkdirSync(path.dirname(this.path), {recursive: true});
      fs.writeFileSync(this.path, await zstd.compress(this.db.serialize()));
      this.db.close();
   }
}
