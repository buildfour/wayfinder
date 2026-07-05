import type { Metadata } from "next";
import { getPublishedTour } from "@/lib/publish/store";
import { getPublicBaseUrl } from "@/lib/publish/urls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tour = await getPublishedTour(id);

  if (!tour) {
    return {
      title: "Tour — Wayfinder",
      description: "A guided step-by-step tour built with Wayfinder.",
    };
  }

  const description =
    tour.sourceExcerpt ??
    `${tour.steps.filter((s) => !s.branchId).length} steps · ~${tour.estimatedMinutes} min · ${tour.sourceTitle}`;

  const baseUrl = getPublicBaseUrl();

  return {
    title: `${tour.title} — Wayfinder`,
    description,
    openGraph: {
      title: tour.title,
      description,
      type: "website",
      url: `${baseUrl}/tour/${id}`,
      siteName: "Wayfinder",
    },
    twitter: {
      card: "summary_large_image",
      title: tour.title,
      description,
    },
  };
}

export default function TourLayout({ children }: { children: React.ReactNode }) {
  return children;
}
