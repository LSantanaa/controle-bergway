import { NextResponse } from "next/server";

import { getDashboardSummaryData } from "@/lib/queries";

export async function GET() {
  try {
    const data = await getDashboardSummaryData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao carregar resumo do dashboard.",
      },
      { status: 500 },
    );
  }
}
