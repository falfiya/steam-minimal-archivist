import {format} from "date-fns";

/**
 * Get Epoch
 */
export const gepoch = () => Math.floor(Date.now() / 1000);
/**
 * Get String Epoch
 */
export const sepoch = () => format(new Date, "yyyy-MM-dd'T'HH:mm:ssxxx");

export const isStringArray = (u: unknown): u is string[] =>
   Array.isArray(u) && u.every(x => typeof x === "string");

export function log(who: string, sigil: string, ...msg: string[]) {
   const start = `\t${who.padEnd(5).slice(0, 5)}\t${sigil}\t`;
   msg = msg.flatMap(s => s.split("\n"));
   for (const line of msg) {
      process.stdout.write(`${start}${line}\n`);
   }
}
export namespace log {
   export function title(x: string) {
      process.stdout.write(x);
   }

   export const debug = (...x: any) => console.debug(...x);

   export const warn = (msg: any) =>
      msg.split("\n").forEach((line: string) =>
         console.warn(`WARN\t${line}`));

   export const panic = (...x: any) => {
      console.error(...x);
      process.exit(1);
   };
}
