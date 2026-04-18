import { NextRequest, NextResponse } from "next/server";

import { searchBarrelByCode } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code") ?? "";

  if (!code) {
    return NextResponse.json({ error: "Código não fornecido." }, { status: 400 });
  }

  try {
    const barrel = await searchBarrelByCode(code);
    return NextResponse.json(barrel);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao buscar barril.",
      },
      { status: 500 },
    );
  }
}
