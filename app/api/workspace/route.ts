import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { workspaceState } from "@/db/schema";

export async function GET() {
  try {
    const db = getDb();
    const [row] = await db.select().from(workspaceState).where(eq(workspaceState.id, 1)).limit(1);
    return Response.json({ data: row ? JSON.parse(row.payload) : null, storage: "d1" });
  } catch {
    return Response.json({ data: null, storage: "browser" });
  }
}

export async function PUT(request: Request) {
  const data = await request.json();
  const payload = JSON.stringify(data);
  if (payload.length > 250_000) return Response.json({ error: "Workspace data is too large." }, { status: 413 });
  try {
    const db = getDb();
    await db.insert(workspaceState).values({ id: 1, payload, updatedAt: new Date().toISOString() }).onConflictDoUpdate({ target: workspaceState.id, set: { payload, updatedAt: new Date().toISOString() } });
    return Response.json({ ok: true, storage: "d1" });
  } catch {
    return Response.json({ ok: false, storage: "browser" }, { status: 503 });
  }
}
