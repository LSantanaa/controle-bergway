import { NextRequest, NextResponse } from "next/server";

import { getHistoryPageData } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "25");
  const period = searchParams.get("period") ?? "";
  const type = searchParams.get("type") ?? "";

  try {
    const data = await getHistoryPageData({
      search: q,
      page,
      pageSize,
      period,
      type,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao carregar historico.",
      },
      { status: 500 },
    );
  }
}
