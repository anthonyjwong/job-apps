"use server";

import type { UserNotificationSettings, UserPreferenceSettings, UserPrivacySettings, UserProfileSettings } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

async function getBaseUrl() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function saveProfile(profile: UserProfileSettings) {
  const url = await getBaseUrl();
  const res = await fetch(`${url}/api/user/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile })
  });
  if (!res.ok) return { success: false, message: "Failed to save profile" };
  revalidatePath("/settings");
  return { success: true };
}

export async function saveNotifications(notifications: UserNotificationSettings) {
  const url = await getBaseUrl();
  const res = await fetch(`${url}/api/user/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notifications })
  });
  if (!res.ok) return { success: false, message: "Failed to save notifications" };
  revalidatePath("/settings");
  return { success: true };
}

export async function savePreferences(preferences: UserPreferenceSettings) {
  const url = await getBaseUrl();
  const res = await fetch(`${url}/api/user/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preferences })
  });
  if (!res.ok) return { success: false, message: "Failed to save preferences" };
  revalidatePath("/settings");
  return { success: true };
}

export async function savePrivacy(privacy: UserPrivacySettings) {
  const url = await getBaseUrl();
  const res = await fetch(`${url}/api/user/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ privacy })
  });
  if (!res.ok) return { success: false, message: "Failed to save privacy" };
  revalidatePath("/settings");
  return { success: true };
}
