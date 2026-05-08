import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "../../data/coupons.json");

async function ensureFile() {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

export async function getCoupons() {
  await ensureFile();
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

export async function saveCoupons(coupons) {
  await ensureFile();
  await fs.writeFile(filePath, JSON.stringify(coupons, null, 2), "utf8");
}
