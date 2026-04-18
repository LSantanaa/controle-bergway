import Link from "next/link";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  baseUrl: string;
  searchParam?: string;
}

export function Pagination({ page, pageSize, total, baseUrl, searchParam = "" }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    if (searchParam) {
      params.set("q", searchParam);
    }
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", marginTop: "20px" }}>
      {page > 1 && (
        <Link href={buildUrl(1)} className="button-ghost">
          ← Primeira
        </Link>
      )}

      {page > 1 && (
        <Link href={buildUrl(page - 1)} className="button-ghost">
          ← Anterior
        </Link>
      )}

      <span className="muted" style={{ padding: "0 12px" }}>
        Página {page} de {totalPages}
      </span>

      {page < totalPages && (
        <Link href={buildUrl(page + 1)} className="button-ghost">
          Próxima →
        </Link>
      )}

      {page < totalPages && (
        <Link href={buildUrl(totalPages)} className="button-ghost">
          Última →
        </Link>
      )}
    </div>
  );
}
