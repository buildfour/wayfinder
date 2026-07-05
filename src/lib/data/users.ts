import { isD1Configured, d1QueryOne, d1Execute } from "@/lib/cloudflare/d1-http";
import { prisma } from "@/lib/db";
import { randomId } from "@/lib/data/id";

export interface DbUser {
  id: string;
  name: string | null;
  email: string;
  passwordHash: string | null;
  plan: string;
  image: string | null;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  if (isD1Configured()) {
    return d1QueryOne<DbUser>(
      `SELECT id, name, email, passwordHash, plan, image FROM User WHERE email = ? LIMIT 1`,
      [email.toLowerCase()]
    );
  }
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    plan: user.plan,
    image: user.image,
  };
}

export async function findUserById(id: string): Promise<DbUser | null> {
  if (isD1Configured()) {
    return d1QueryOne<DbUser>(
      `SELECT id, name, email, passwordHash, plan, image FROM User WHERE id = ? LIMIT 1`,
      [id]
    );
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    plan: user.plan,
    image: user.image,
  };
}

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<DbUser> {
  const id = randomId();
  const now = new Date().toISOString();

  if (isD1Configured()) {
    await d1Execute(
      `INSERT INTO User (id, email, name, passwordHash, plan, createdAt, updatedAt) VALUES (?, ?, ?, ?, 'explorer', ?, ?)`,
      [id, data.email.toLowerCase(), data.name, data.passwordHash, now, now]
    );
    await d1Execute(
      `INSERT INTO UserSettings (id, userId, showCheckpoints, autoBranchByOS, showTimeEstimates, notifyOnSourceChange) VALUES (?, ?, 1, 0, 1, 1)`,
      [randomId(), id]
    );
    return {
      id,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      plan: "explorer",
      image: null,
    };
  }

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash: data.passwordHash,
      plan: "explorer",
      settings: { create: {} },
    },
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    plan: user.plan,
    image: user.image,
  };
}

export async function updateUserName(id: string, name: string): Promise<void> {
  const now = new Date().toISOString();
  if (isD1Configured()) {
    await d1Execute(`UPDATE User SET name = ?, updatedAt = ? WHERE id = ?`, [name.trim(), now, id]);
    return;
  }
  await prisma.user.update({ where: { id }, data: { name: name.trim() } });
}
