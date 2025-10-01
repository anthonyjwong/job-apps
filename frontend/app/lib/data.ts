import { PriorityActions } from "@/lib/types";

const baseUrl = "http://backend:8000";

export async function fetchPriorityActionsData(): Promise<PriorityActions> {
  try {
    const response = await fetch(`${baseUrl}/applications/priority`, { cache: "no-store" });
    if (!response.ok) throw new Error('Failed to fetch priority actions');
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch priority actions data.');
  }
}