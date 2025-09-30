"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

type ApplyPayload = {
  company: string;
  position: string;
  location?: string;
  salary?: string;
  type?: "fulltime" | "parttime" | "contract" | "internship" | "other";
  classification: "safety" | "target" | "reach" | "dream";
};

async function baseUrl() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function applyToJob(payload: ApplyPayload): Promise<{ success: boolean; message?: string }> {
  try {
    const url = await baseUrl();
    const res = await fetch(`${url}/api/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: payload.company,
        position: payload.position,
        status: "submitted",
        applicationDate: new Date().toISOString().split("T")[0],
        location: payload.location,
        salary: payload.salary,
        jobType: payload.type,
        classification: payload.classification,
      }),
    });
    if (!res.ok) return { success: false, message: "Failed to submit application" };
    revalidatePath("/applications");
    return { success: true };
  } catch (_) {
    return { success: false, message: "Network error" };
  }
}

export async function saveJobAction(jobId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const url = await baseUrl();
    const res = await fetch(`${url}/api/saved-jobs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
    if (!res.ok) return { success: false, message: "Failed to save job" };
    revalidatePath("/jobs");
    return { success: true };
  } catch (e) {
    return { success: false, message: "Network error" };
  }
}

export async function unsaveJobAction(jobId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const url = await baseUrl();
    const res = await fetch(`${url}/api/saved-jobs?jobId=${encodeURIComponent(jobId)}`, { method: "DELETE" });
    if (!res.ok) return { success: false, message: "Failed to remove saved job" };
    revalidatePath("/jobs");
    return { success: true };
  } catch (e) {
    return { success: false, message: "Network error" };
  }
}
