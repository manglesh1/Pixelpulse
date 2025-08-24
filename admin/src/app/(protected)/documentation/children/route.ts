import { NextResponse } from "next/server";
import { getChildTopics } from "@/app/(protected)/documentation/docsIndex";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const p = searchParams.get("p") || "";
  const segments = p.split("/").filter(Boolean);
  const topics = getChildTopics(segments);
  return NextResponse.json({ topics });
}
