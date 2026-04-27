import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFile = path.join(__dirname, "../../data/users.json");

async function ensureFile() {
  try {
    await fs.access(usersFile);
  } catch {
    await fs.mkdir(path.dirname(usersFile), { recursive: true });
    await fs.writeFile(usersFile, "[]", "utf8");
  }
}

export async function getUsers() {
  await ensureFile();
  const raw = await fs.readFile(usersFile, "utf8");
  return JSON.parse(raw);
}

export async function saveUsers(users) {
  await ensureFile();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf8");
}
