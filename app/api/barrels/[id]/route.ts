import { NextResponse } from "next/server";
import { getBarrelById } from "@/lib/queries";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id || id === "undefined") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const barrel = await getBarrelById(id);

  if (!barrel) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(barrel);
}