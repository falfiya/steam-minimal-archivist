export function log(x: string) {
   process.stdout.write(x)
}
export namespace log {
   export const warn = (x: any) => console.error(x);
   export const panic = (x: any) => { console.error(x); process.exit(1) };
}

export const epoch = () => Math.floor(Date.now() / 1000);

export const isStringArray = (u: unknown): u is string[] =>
   Array.isArray(u) && u.every(x => typeof x === "string");
