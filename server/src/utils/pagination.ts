export function parsePage(q: any, def = 1) { const p = Number(q?.page || def); return p > 0 ? p : def; }
export function parseLimit(q: any, def = 20, max = 100) {
const l = Number(q?.limit || def); return l > 0 ? Math.min(l, max) : def;
}