"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  DEFAULT_HISTORY_PAGE_SIZE,
  DEFAULT_LIST_PAGE,
  useHistoryQuery,
} from "@/lib/hooks/use-app-queries";
import { formatDateTime, formatMovementType } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? DEFAULT_LIST_PAGE);
  const periodFilter = searchParams.get("period") ?? "";
  const typeFilter = searchParams.get("type") ?? "";
  const { data, isFetching } = useHistoryQuery(
    search,
    page,
    DEFAULT_HISTORY_PAGE_SIZE,
    periodFilter,
    typeFilter,
  );
  const movements = data?.items ?? [];

  const buildFilterHref = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const next = params.toString();
    return next ? `/dashboard/historico?${next}` : "/dashboard/historico";
  };

  const periodHref = (period: string) =>
    buildFilterHref({ period: periodFilter === period ? "" : period });

  const typeHref = (type: string) =>
    buildFilterHref({ type: typeFilter === type ? "" : type });

  const filterClass = (isActive: boolean) =>
    isActive ? "button-ghost filter-active" : "button-ghost";

  const filterParams = {
    ...(periodFilter ? { period: periodFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  };

  return (
    <>
      <section className="page-header">
        <div>
          <div className="brand-kicker">Consulta</div>
          <h1>Histórico</h1>
          <p className="brand-subtitle">
            Busque por movimentações passadas, filtrando por código de equipamento, cliente ou observações.
          </p>
        </div>
      </section>

      <section className="card stack">
        <div className="toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Movimentações registradas</h2>
            <p className="muted">Busque por código do equipamento ou observações.</p>
          </div>

          <form className="toolbar" method="get">
            <input className="search" defaultValue={search} name="q" placeholder="Buscar no histórico" />
            <button className="button-ghost" type="submit">
              Buscar
            </button>
          </form>
        </div>

        <div className="table-wrap">
          <div className="filter-row">
            <Link className={filterClass(!periodFilter && !typeFilter)} href={buildFilterHref({ period: "", type: "" })}>
              Tudo
            </Link>
            <Link className={filterClass(periodFilter === "today")} href={periodHref("today")}>
              Hoje
            </Link>
            <Link className={filterClass(periodFilter === "7d")} href={periodHref("7d")}>
              Últimos 7 dias
            </Link>
            <Link className={filterClass(periodFilter === "30d")} href={periodHref("30d")}>
              Últimos 30 dias
            </Link>
            <Link className={filterClass(typeFilter === "checkout")} href={typeHref("checkout")}>
              Saídas
            </Link>
            <Link className={filterClass(typeFilter === "checkin")} href={typeHref("checkin")}>
              Entradas
            </Link>
          </div>

          {isFetching ? (
            <div className="table-status" role="status">
              Atualizando histórico...
            </div>
          ) : null}
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Equipamento</th>
                <th>Tipo/Modelo</th>
                <th>Cliente</th>
                <th>Operador</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {movements.length ? (
                movements.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateTime(item.occurred_at)}</td>
                    <td>{formatMovementType(item.movement_type)}</td>
                    <td>{item.barrel_code}</td>
                    <td><strong>{item.barrel?.notes || "-"}</strong></td>
                    <td>{item.customer?.trade_name || item.customer?.name || "-"}</td>
                    <td>{item.performer?.full_name || "-"}</td>
                    <td>{item.notes || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">Nenhum registro encontrado.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

         {data && (
            <Pagination
              page={page}
              pageSize={data.pageSize}
              total={data.total}
              baseUrl="/dashboard/historico"
              searchParam={search}
              params={filterParams}
            />
          )}
      </section>
    </>
  );
}
