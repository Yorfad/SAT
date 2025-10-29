const mem = new Map<string, any>();
export function cacheGet<T>(key: string): T | undefined { return mem.get(key); }
export function cacheSet<T>(key: string, val: T, _ttlSec = 60): void { mem.set(key, val); }
export function cacheDelete(key: string): void { mem.delete(key); }