import { isD1Configured, d1QueryAll, d1QueryOne, d1Execute } from "@/lib/cloudflare/d1-http";
import { prisma } from "@/lib/db";
import { randomId } from "@/lib/data/id";
import type { Tour, TourProgress } from "@/lib/types";

export interface TourRecordRow {
  id: string;
  userId: string;
  data: string;
  createdAt: string;
  updatedAt: string;
}

export interface TourProgressRow {
  id: string;
  tourId: string;
  currentStepIndex: number;
  completedStepIds: string;
  selectedBranch: string | null;
  startTime: number;
  elapsedMinutes: number;
}

export async function listUserTours(userId: string) {
  if (isD1Configured()) {
    const records = await d1QueryAll<TourRecordRow>(
      `SELECT id, userId, data, createdAt, updatedAt FROM TourRecord WHERE userId = ? ORDER BY updatedAt DESC`,
      [userId]
    );
    const withProgress = await Promise.all(
      records.map(async (r) => {
        const progress = await d1QueryOne<TourProgressRow>(
          `SELECT id, tourId, currentStepIndex, completedStepIds, selectedBranch, startTime, elapsedMinutes FROM TourProgressRecord WHERE tourId = ? LIMIT 1`,
          [r.id]
        );
        return { ...r, progress };
      })
    );
    return withProgress;
  }

  return prisma.tourRecord.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { progress: true },
  });
}

export async function upsertUserTour(userId: string, tour: Tour): Promise<void> {
  const now = new Date().toISOString();
  const data = JSON.stringify(tour);

  if (isD1Configured()) {
    const existing = await d1QueryOne<{ id: string; userId: string }>(
      `SELECT id, userId FROM TourRecord WHERE id = ? LIMIT 1`,
      [tour.id]
    );
    if (existing && existing.userId !== userId) {
      throw new Error("Tour not owned by user");
    }
    if (existing) {
      await d1Execute(`UPDATE TourRecord SET data = ?, updatedAt = ? WHERE id = ?`, [
        data,
        now,
        tour.id,
      ]);
    } else {
      await d1Execute(
        `INSERT INTO TourRecord (id, userId, data, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
        [tour.id, userId, data, now, now]
      );
    }
    return;
  }

  await prisma.tourRecord.upsert({
    where: { id: tour.id },
    create: { id: tour.id, userId, data },
    update: { data },
  });
}

export async function getUserTour(userId: string, tourId: string) {
  if (isD1Configured()) {
    return d1QueryOne<TourRecordRow>(
      `SELECT id, userId, data, createdAt, updatedAt FROM TourRecord WHERE id = ? AND userId = ? LIMIT 1`,
      [tourId, userId]
    );
  }
  return prisma.tourRecord.findFirst({ where: { id: tourId, userId }, include: { progress: true } });
}

export async function deleteUserTour(userId: string, tourId: string): Promise<boolean> {
  if (isD1Configured()) {
    const row = await getUserTour(userId, tourId);
    if (!row) return false;
    await d1Execute(`DELETE FROM TourProgressRecord WHERE tourId = ?`, [tourId]);
    await d1Execute(`DELETE FROM TourRecord WHERE id = ? AND userId = ?`, [tourId, userId]);
    return true;
  }
  const owned = await prisma.tourRecord.findFirst({ where: { id: tourId, userId } });
  if (!owned) return false;
  await prisma.tourRecord.delete({ where: { id: tourId } });
  return true;
}

export async function getTourProgress(userId: string, tourId: string) {
  const owned = await getUserTour(userId, tourId);
  if (!owned) return null;

  if (isD1Configured()) {
    return d1QueryOne<TourProgressRow>(
      `SELECT id, tourId, currentStepIndex, completedStepIds, selectedBranch, startTime, elapsedMinutes FROM TourProgressRecord WHERE tourId = ? LIMIT 1`,
      [tourId]
    );
  }
  const record = await prisma.tourRecord.findFirst({
    where: { id: tourId, userId },
    include: { progress: true },
  });
  return record?.progress ?? null;
}

export async function upsertTourProgress(
  userId: string,
  progress: TourProgress
): Promise<boolean> {
  const owned = await getUserTour(userId, progress.tourId);
  if (!owned) return false;

  if (isD1Configured()) {
    const existing = await d1QueryOne<{ id: string }>(
      `SELECT id FROM TourProgressRecord WHERE tourId = ? LIMIT 1`,
      [progress.tourId]
    );
    if (existing) {
      await d1Execute(
        `UPDATE TourProgressRecord SET currentStepIndex = ?, completedStepIds = ?, selectedBranch = ?, startTime = ?, elapsedMinutes = ? WHERE tourId = ?`,
        [
          progress.currentStepIndex,
          JSON.stringify(progress.completedStepIds),
          progress.selectedBranch,
          progress.startTime,
          progress.elapsedMinutes,
          progress.tourId,
        ]
      );
    } else {
      await d1Execute(
        `INSERT INTO TourProgressRecord (id, tourId, currentStepIndex, completedStepIds, selectedBranch, startTime, elapsedMinutes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          randomId(),
          progress.tourId,
          progress.currentStepIndex,
          JSON.stringify(progress.completedStepIds),
          progress.selectedBranch,
          progress.startTime,
          progress.elapsedMinutes,
        ]
      );
    }
    return true;
  }

  await prisma.tourProgressRecord.upsert({
    where: { tourId: progress.tourId },
    create: {
      tourId: progress.tourId,
      currentStepIndex: progress.currentStepIndex,
      completedStepIds: JSON.stringify(progress.completedStepIds),
      selectedBranch: progress.selectedBranch,
      startTime: BigInt(progress.startTime),
      elapsedMinutes: progress.elapsedMinutes,
    },
    update: {
      currentStepIndex: progress.currentStepIndex,
      completedStepIds: JSON.stringify(progress.completedStepIds),
      selectedBranch: progress.selectedBranch,
      startTime: BigInt(progress.startTime),
      elapsedMinutes: progress.elapsedMinutes,
    },
  });
  return true;
}
