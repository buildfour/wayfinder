import { isD1Configured, d1QueryOne, d1QueryAll, d1Execute } from "@/lib/cloudflare/d1-http";
import { prisma } from "@/lib/db";
import { randomId } from "@/lib/data/id";

export interface UserSettingsRow {
  id: string;
  userId: string;
  showCheckpoints: number | boolean;
  autoBranchByOS: number | boolean;
  showTimeEstimates: number | boolean;
  notifyOnSourceChange: number | boolean;
}

function normalizeSettings(row: UserSettingsRow) {
  return {
    showCheckpoints: Boolean(row.showCheckpoints),
    autoBranchByOS: Boolean(row.autoBranchByOS),
    showTimeEstimates: Boolean(row.showTimeEstimates),
    notifyOnSourceChange: Boolean(row.notifyOnSourceChange),
  };
}

export async function getUserSettingsBundle(userId: string) {
  if (isD1Configured()) {
    const user = await d1QueryOne<{
      name: string | null;
      email: string;
      plan: string;
    }>(`SELECT name, email, plan FROM User WHERE id = ? LIMIT 1`, [userId]);

    let settings = await d1QueryOne<UserSettingsRow>(
      `SELECT id, userId, showCheckpoints, autoBranchByOS, showTimeEstimates, notifyOnSourceChange FROM UserSettings WHERE userId = ? LIMIT 1`,
      [userId]
    );

    if (!settings) {
      const settingsId = randomId();
      await d1Execute(
        `INSERT INTO UserSettings (id, userId, showCheckpoints, autoBranchByOS, showTimeEstimates, notifyOnSourceChange) VALUES (?, ?, 1, 0, 1, 1)`,
        [settingsId, userId]
      );
      settings = await d1QueryOne<UserSettingsRow>(
        `SELECT id, userId, showCheckpoints, autoBranchByOS, showTimeEstimates, notifyOnSourceChange FROM UserSettings WHERE userId = ? LIMIT 1`,
        [userId]
      );
    }

    const connectedSources = await d1QueryAll(
      `SELECT id, provider, label, status FROM ConnectedSource WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );
    const teamMembers = await d1QueryAll(
      `SELECT id, email, role, status FROM TeamMember WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );

    return {
      user,
      settings: settings ? normalizeSettings(settings) : null,
      connectedSources,
      teamMembers,
    };
  }

  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({ data: { userId } });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { connectedSources: true, teamMembers: true },
  });

  return {
    user: user ? { name: user.name, email: user.email, plan: user.plan } : null,
    settings,
    connectedSources: user?.connectedSources ?? [],
    teamMembers: user?.teamMembers ?? [],
  };
}

export async function patchUserSettings(
  userId: string,
  body: Record<string, boolean | string>
) {
  if (typeof body.name === "string") {
    const now = new Date().toISOString();
    if (isD1Configured()) {
      await d1Execute(`UPDATE User SET name = ?, updatedAt = ? WHERE id = ?`, [
        body.name.trim(),
        now,
        userId,
      ]);
    } else {
      await prisma.user.update({ where: { id: userId }, data: { name: body.name.trim() } });
    }
  }

  if (isD1Configured()) {
    const existing = await d1QueryOne<{ id: string }>(
      `SELECT id FROM UserSettings WHERE userId = ? LIMIT 1`,
      [userId]
    );
    const fields: string[] = [];
    const params: unknown[] = [];
    if (typeof body.showCheckpoints === "boolean") {
      fields.push("showCheckpoints = ?");
      params.push(body.showCheckpoints ? 1 : 0);
    }
    if (typeof body.autoBranchByOS === "boolean") {
      fields.push("autoBranchByOS = ?");
      params.push(body.autoBranchByOS ? 1 : 0);
    }
    if (typeof body.showTimeEstimates === "boolean") {
      fields.push("showTimeEstimates = ?");
      params.push(body.showTimeEstimates ? 1 : 0);
    }
    if (typeof body.notifyOnSourceChange === "boolean") {
      fields.push("notifyOnSourceChange = ?");
      params.push(body.notifyOnSourceChange ? 1 : 0);
    }

    if (existing && fields.length > 0) {
      await d1Execute(`UPDATE UserSettings SET ${fields.join(", ")} WHERE userId = ?`, [
        ...params,
        userId,
      ]);
    } else if (!existing) {
      await d1Execute(
        `INSERT INTO UserSettings (id, userId, showCheckpoints, autoBranchByOS, showTimeEstimates, notifyOnSourceChange) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          randomId(),
          userId,
          body.showCheckpoints === false ? 0 : 1,
          body.autoBranchByOS ? 1 : 0,
          body.showTimeEstimates === false ? 0 : 1,
          body.notifyOnSourceChange === false ? 0 : 1,
        ]
      );
    }

    const settings = await d1QueryOne<UserSettingsRow>(
      `SELECT id, userId, showCheckpoints, autoBranchByOS, showTimeEstimates, notifyOnSourceChange FROM UserSettings WHERE userId = ? LIMIT 1`,
      [userId]
    );
    return settings ? normalizeSettings(settings) : null;
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      showCheckpoints: body.showCheckpoints !== false,
      autoBranchByOS: body.autoBranchByOS === true,
      showTimeEstimates: body.showTimeEstimates !== false,
      notifyOnSourceChange: body.notifyOnSourceChange !== false,
    },
    update: {
      ...(typeof body.showCheckpoints === "boolean" && { showCheckpoints: body.showCheckpoints }),
      ...(typeof body.autoBranchByOS === "boolean" && { autoBranchByOS: body.autoBranchByOS }),
      ...(typeof body.showTimeEstimates === "boolean" && { showTimeEstimates: body.showTimeEstimates }),
      ...(typeof body.notifyOnSourceChange === "boolean" && {
        notifyOnSourceChange: body.notifyOnSourceChange,
      }),
    },
  });
  return settings;
}

export async function listConnectedSources(userId: string) {
  if (isD1Configured()) {
    return d1QueryAll(
      `SELECT id, provider, label, status FROM ConnectedSource WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );
  }
  return prisma.connectedSource.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function createConnectedSource(
  userId: string,
  provider: string,
  label: string
) {
  const id = randomId();
  const now = new Date().toISOString();
  if (isD1Configured()) {
    await d1Execute(
      `INSERT INTO ConnectedSource (id, userId, provider, label, status, createdAt) VALUES (?, ?, ?, ?, 'pending', ?)`,
      [id, userId, provider, label, now]
    );
    return { id, provider, label, status: "pending" };
  }
  return prisma.connectedSource.create({
    data: { userId, provider, label, status: "pending" },
  });
}
