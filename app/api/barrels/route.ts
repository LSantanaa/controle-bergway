import { NextRequest, NextResponse } from "next/server";

import { getBarrelsPageData } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");
  const status = searchParams.get("status") ?? "";
  const capacity = Number(searchParams.get("capacity") ?? "");

  try {
    const data = await getBarrelsPageData({
      search: q,
      page,
      pageSize,
      status,
      capacity,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao carregar equipamentos.",
      },
      { status: 500 },
    );
  }
}
