import { NextResponse } from "next/server";
import { recordVote } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { slug, kind } = await req.json();
    if (typeof slug !== "string" || (kind !== "like" && kind !== "nope")) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    await recordVote(slug, kind);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "error" },
      { status: 400 }
    );
  }
}
