import { getHistory } from "@/lib/queries";
import type { SearchParamsRecord } from "@/lib/types";
import {
  formatDateTime,
  formatMovementType,
  getSingleParam,
} from "@/lib/utils";

type HistoryPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;
  const search = getSingleParam(params.q);
  const movements = await getHistory(search);

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
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Equipamento</th>
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
                    <td>{item.customer?.trade_name || item.customer?.name || "-"}</td>
                    <td>{item.performer?.full_name || "-"}</td>
                    <td>{item.notes || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Nenhum registro encontrado.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
