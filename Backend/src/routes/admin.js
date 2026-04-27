import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { requireAdmin } from "../middleware/auth.js";
import { getUsers, saveUsers } from "../services/userStore.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/tokens.js";

const router = Router();

function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

async function ensureInitialAdmin() {
  const users = await getUsers();
  const hasAdmin = users.some((item) => item.role === "admin");
  if (hasAdmin) return;

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@store.com")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

  const user = {
    _id: uuidv4(),
    name: "System Admin",
    email: adminEmail,
    passwordHash: await hashPassword(adminPassword),
    role: "admin",
    createdAt: Date.now(),
  };

  users.push(user);
  await saveUsers(users);
}

router.post("/login", async (req, res, next) => {
  try {
    await ensureInitialAdmin();
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const users = await getUsers();
    const admin = users.find(
      (item) =>
        item.email === String(email).trim().toLowerCase() &&
        item.role === "admin",
    );

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = signAccessToken(admin);

    return res.json({ token, admin: sanitizeUser(admin) });
  } catch (error) {
    return next(error);
  }
});

router.post("/accounts", requireAdmin, async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email and password are required" });
    }

    if (String(password).length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const users = await getUsers();
    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = users.some((item) => item.email === normalizedEmail);

    if (exists) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const adminUser = {
      _id: uuidv4(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      role: "admin",
      createdAt: Date.now(),
    };

    users.push(adminUser);
    await saveUsers(users);

    return res.status(201).json({ admin: sanitizeUser(adminUser) });
  } catch (error) {
    return next(error);
  }
});

export default router;
