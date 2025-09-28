import { headers } from "next/headers";
import { SettingsView, type SettingsInitialData } from "../../components/SettingsView";

export default async function SettingsPage() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const res = await fetch(`${proto}://${host}/user/settings`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load settings");
  const data = await res.json();

  const initialData: SettingsInitialData = data;
  return <SettingsView {...initialData} />;
}