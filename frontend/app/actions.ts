"use server";

import type { NewApplication } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

async function getBaseUrl() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function createApplicationAction(application: NewApplication): Promise<{ success: boolean; message?: string; id?: number }> {
  try {
    const url = await getBaseUrl();
    const res = await fetch(`${url}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(application),
    });
    if (!res.ok) return { success: false, message: "Failed to create application" };
    const json = await res.json().catch(() => ({}));
    // Revalidate relevant pages
    revalidatePath("/");
    revalidatePath("/applications");
    return { success: true, id: json?.application?.id };
  } catch {
    return { success: false, message: "Network error" };
  }
}
