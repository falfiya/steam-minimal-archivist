import Sqlite3Database from "better-sqlite3";

export class Snapshots extends Sqlite3Database {
   constructor () {
      super("data/snapshots.sqlite3");
   }
}
