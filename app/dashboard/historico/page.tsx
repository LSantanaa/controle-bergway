"use client";

import { useSearchParams } from "next/navigation";

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
  const { data } = useHistoryQuery(
    search,
    DEFAULT_LIST_PAGE,
    DEFAULT_HISTORY_PAGE_SIZE,
  );
  const movements = data?.items ?? [];

  return (
    <>
      <section className="page-header">
        <div>
          <div className="brand-kicker">Consulta</div>
          <h1>Histórico</h1>
          <p className="brand-subtitle">
            Busque por movimentações passadas, filtrando por código de
            equipamento, cliente ou observações.
          </p>
        </div>
      </section>

      <section className="card stack">
        <div className="toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Movimentações registradas</h2>
            <p className="muted">
              Busque por código do equipamento ou observações.
            </p>
          </div>

          <form className="toolbar" method="get">
            <input
              className="search"
              defaultValue={search}
              name="q"
              placeholder="Buscar no histórico"
            />
            <button className="button-ghost" type="submit">
              Buscar
            </button>
          </form>
        </div>

        <div className="table-wrap">
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
                    <td>
                      <strong>{item.barrel?.notes || "-"}</strong>
                    </td>
                    <td>
                      {item.customer?.trade_name || item.customer?.name || "-"}
                    </td>
                    <td>{item.performer?.full_name || "-"}</td>
                    <td>{item.notes || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      Nenhum registro encontrado.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            baseUrl="/dashboard/clientes"
            searchParam={search}
          />
        )}
      </section>
    </>
  );
}
