import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const productsFile = path.join(__dirname, "../../data/products.json");

async function ensureFile() {
  try {
    await fs.access(productsFile);
  } catch {
    await fs.mkdir(path.dirname(productsFile), { recursive: true });
    await fs.writeFile(productsFile, "[]", "utf8");
  }
}

export async function getProducts() {
  await ensureFile();
  const raw = await fs.readFile(productsFile, "utf8");
  return JSON.parse(raw);
}

export async function saveProducts(products) {
  await ensureFile();
  await fs.writeFile(productsFile, JSON.stringify(products, null, 2), "utf8");
}
