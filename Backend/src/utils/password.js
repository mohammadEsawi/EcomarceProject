import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hashBuffer = await scrypt(password, salt, 64);
  return `${salt}:${hashBuffer.toString("hex")}`;
}

export async function verifyPassword(password, encoded) {
  if (!encoded || !encoded.includes(":")) return false;
  const [salt, hash] = encoded.split(":");
  const derived = await scrypt(password, salt, 64);
  const hashBuffer = Buffer.from(hash, "hex");
  if (hashBuffer.length !== derived.length) return false;
  return timingSafeEqual(hashBuffer, derived);
}
