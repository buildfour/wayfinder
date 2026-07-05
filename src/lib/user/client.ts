import type { Tour, TourProgress } from "@/lib/types";

export interface UserTourRecord {
  id: string;
  updatedAt?: string;
  progress: {
    currentStepIndex: number;
    completedStepIds: string;
    selectedBranch: string | null;
    startTime: string;
    elapsedMinutes: number;
  } | null;
}

export async function fetchUserTours(): Promise<{
  success: boolean;
  tours?: Tour[];
  records?: UserTourRecord[];
}> {
  const res = await fetch("/api/user/tours");
  return res.json();
}

export async function saveUserTour(tour: Tour): Promise<{ success: boolean }> {
  const res = await fetch("/api/user/tours", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tour }),
  });
  return res.json();
}

export async function saveUserProgress(progress: TourProgress): Promise<{ success: boolean }> {
  const res = await fetch(`/api/user/tours/${progress.tourId}/progress`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress }),
  });
  return res.json();
}

export async function fetchUserProgress(tourId: string): Promise<{
  success: boolean;
  progress: TourProgress | null;
}> {
  const res = await fetch(`/api/user/tours/${tourId}/progress`);
  return res.json();
}

export interface UserSettingsResponse {
  success: boolean;
  user?: {
    name: string | null;
    email: string;
    plan: string;
  };
  settings?: {
    showCheckpoints: boolean;
    autoBranchByOS: boolean;
    showTimeEstimates: boolean;
    notifyOnSourceChange: boolean;
  };
  connectedSources?: Array<{ id: string; provider: string; label: string; status: string }>;
  teamMembers?: Array<{ id: string; email: string; role: string; status: string }>;
}

export async function fetchUserSettings(): Promise<UserSettingsResponse> {
  const res = await fetch("/api/user/settings");
  return res.json();
}

export async function updateUserSettings(
  data: Record<string, boolean | string>
): Promise<{ success: boolean }> {
  const res = await fetch("/api/user/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function connectUserSource(provider: string) {
  const res = await fetch("/api/user/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  });
  return res.json();
}

export async function isAuthenticated(): Promise<boolean> {
  const res = await fetch("/api/auth/session");
  const session = await res.json();
  return !!session?.user;
}

export function recordToProgress(tourId: string, record: UserTourRecord["progress"]): TourProgress | null {
  if (!record) return null;
  return {
    tourId,
    currentStepIndex: record.currentStepIndex,
    completedStepIds: JSON.parse(record.completedStepIds) as string[],
    selectedBranch: record.selectedBranch,
    startTime: Number(record.startTime),
    elapsedMinutes: record.elapsedMinutes,
  };
}
