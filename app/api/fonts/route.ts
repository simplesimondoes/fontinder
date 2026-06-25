import { NextResponse } from "next/server";
import { FONTS } from "@/lib/store";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ fonts: FONTS });
}
