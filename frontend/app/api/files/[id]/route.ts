import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const headers = new Headers();
  const userId = cookieStore.get("user_id")?.value;
  const cookieProjectId = cookieStore.get("project_id")?.value;

  const url = new URL(request.url);
  const queryProjectId = url.searchParams.get("projectId");

  if (userId) {
    headers.set("X-User-Id", userId);
    headers.set("X-User-Role", "MANAGER");
  }
  headers.set("X-Project-Id", queryProjectId || cookieProjectId || "1");

  const res = await fetch(`${API_URL}/files/${id}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return new NextResponse(errText || null, { status: res.status });
  }

  return new NextResponse(null, { status: 204 });
}
