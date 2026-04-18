import { NextResponse } from "next/server";

import { getMovementPageData } from "@/lib/queries";

export async function GET() {
  try {
    const data = await getMovementPageData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao carregar dados de movimentacao.",
      },
      { status: 500 },
    );
  }
}
