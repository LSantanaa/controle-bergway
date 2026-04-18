import { NextRequest, NextResponse } from "next/server";

import { getUsersPageData } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "20");

  try {
    const data = await getUsersPageData({
      search: q,
      page,
      pageSize,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao carregar usuarios.",
      },
      { status: 500 },
    );
  }
}
