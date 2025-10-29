import crypto from "crypto";
import { env } from "../config/env";


const keyHex = env.satEncKey;
if (!keyHex || keyHex.length !== 64) {
console.warn("[WARN] SAT_ENC_KEY no está configurada correctamente (64 hex). Cifrado SAT deshabilitado.");
}
const key = keyHex ? Buffer.from(keyHex, "hex") : null;


export function encrypt(text: string): string | null {
if (!key) return null;
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
const tag = cipher.getAuthTag();
return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}


export function decrypt(payload: string): string | null {
if (!key) return null;
const [ivB64, tagB64, dataB64] = payload.split(":");
const iv = Buffer.from(ivB64, "base64");
const tag = Buffer.from(tagB64, "base64");
const data = Buffer.from(dataB64, "base64");
const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
decipher.setAuthTag(tag);
const dec = Buffer.concat([decipher.update(data), decipher.final()]);
return dec.toString("utf8");
}