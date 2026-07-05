import type { Tour } from "@/lib/types";

export async function publishTour(tour: Tour): Promise<{
  success: boolean;
  shareUrl?: string;
  error?: string;
}> {
  const res = await fetch(`/api/tours/${tour.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tour }),
  });
  return res.json();
}

export async function fetchPublishedTour(id: string): Promise<{
  success: boolean;
  tour?: Tour;
  shareUrl?: string;
}> {
  const res = await fetch(`/api/tours/${id}`);
  return res.json();
}

export async function syncPublishedTour(id: string) {
  const res = await fetch(`/api/tours/${id}/sync`, { method: "POST" });
  return res.json();
}
