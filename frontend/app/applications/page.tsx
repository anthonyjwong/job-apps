import { ApplicationsView } from "@/components/ApplicationsView";
import type { Application } from "@/lib/types";
import { headers } from "next/headers";

async function getApplications(): Promise<Application[]> {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${protocol}://${host}`;
  try {
    const res = await fetch(`${baseUrl}/api/applications`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.applications ?? [];
  } catch (e) {
    return [];
  }
}

export default async function ApplicationsPage() {
  const initialApplications = await getApplications();
  return <ApplicationsView initialApplications={initialApplications} />;
}