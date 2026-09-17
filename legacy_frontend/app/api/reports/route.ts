import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function GET() {
  const cookieStore = await cookies();
  const headers = new Headers();
  const userId = cookieStore.get("user_id")?.value;
  const projectId = cookieStore.get("project_id")?.value;
  if (userId) {
    headers.set("X-User-Id", userId);
    headers.set("X-User-Role", "MANAGER");
  }
  headers.set("X-Project-Id", projectId ?? "1");

  const res = await fetch(`${API_URL}/reports`, { headers, cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: res.statusText }, { status: res.status });
  }
  return NextResponse.json(await res.json());
}
