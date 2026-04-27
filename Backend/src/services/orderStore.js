import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ordersFile = path.join(__dirname, "../../data/orders.json");

async function ensureFile() {
  try {
    await fs.access(ordersFile);
  } catch {
    await fs.mkdir(path.dirname(ordersFile), { recursive: true });
    await fs.writeFile(ordersFile, "[]", "utf8");
  }
}

export async function getOrders() {
  await ensureFile();
  const raw = await fs.readFile(ordersFile, "utf8");
  return JSON.parse(raw);
}

export async function saveOrders(orders) {
  await ensureFile();
  await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2), "utf8");
}
