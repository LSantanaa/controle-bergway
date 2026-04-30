import { NextRequest, NextResponse } from "next/server";

import { searchActiveCustomers } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? "8");

  try {
    const data = await searchActiveCustomers(q, limit);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao buscar clientes.",
      },
      { status: 500 },
    );
  }
}
