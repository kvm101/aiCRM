import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const headers = new Headers();
  const userId = cookieStore.get("user_id")?.value;
  const projectId = cookieStore.get("project_id")?.value;
  if (userId) {
    headers.set("X-User-Id", userId);
    headers.set("X-User-Role", "MANAGER");
  }
  headers.set("X-Project-Id", projectId ?? "1");

  const res = await fetch(`${API_URL}/reports/${id}/download`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    return new NextResponse(null, { status: res.status });
  }

  const buf = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") || "text/csv; charset=UTF-8";
  const contentDisposition = res.headers.get("content-disposition");

  const outHeaders = new Headers();
  outHeaders.set("Content-Type", contentType);
  if (contentDisposition) {
    outHeaders.set("Content-Disposition", contentDisposition);
  }

  return new NextResponse(buf, { headers: outHeaders });
}
