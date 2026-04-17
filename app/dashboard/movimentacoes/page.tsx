import Link from "next/link";

import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { getDashboardData } from "@/lib/queries";
import type { SearchParamsRecord } from "@/lib/types";
import { formatDateTime, formatMovementType, readFlash } from "@/lib/utils";

import { registerMovementAction } from "./actions";

type MovementsPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function MovementsPage({ searchParams }: MovementsPageProps) {
  const params = await searchParams;
  const flash = readFlash(params);
  const data = await getDashboardData();
  const activeCustomers = data.customers.filter((item) => item.is_active);
  const openBarrels = data.barrels.filter((item) => item.is_active && item.status === "out");

  return (
    <>
      <section className="page-header">
        <div>
          <div className="brand-kicker">Operação</div>
          <h1>Movimentações</h1>
          <p className="brand-subtitle">
           Entrada e saída de equipamentos.
          </p>
        </div>
      </section>

      <FlashMessage error={flash.error} success={flash.success} />

      <section className="split">
        <article className="card stack">
          <div>
            <h2 style={{ margin: 0 }}>Registrar movimentação</h2>
            <p className="muted">
              Para saída, selecione o cliente. Para entrada, o próprio histórico fecha o ciclo.
            </p>
          </div>

          <form action={registerMovementAction} className="stack">
            <div className="field-grid">
              <div className="field-grid-2">
                <div className="field">
                  <label htmlFor="barrel_code">Código do barril</label>
                  <input className="input" id="barrel_code" name="barrel_code" required />
                </div>

                <div className="field">
                  <label htmlFor="movement_type">Tipo</label>
                  <select className="select" defaultValue="checkout" id="movement_type" name="movement_type">
                    <option value="checkout">Saída</option>
                    <option value="checkin">Entrada</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="customer_id">Cliente para saída</label>
                <select className="select" id="customer_id" name="customer_id">
                  <option value="">Selecione quando for saída</option>
                  {activeCustomers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.trade_name || item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="notes">Observações</label>
                <textarea className="textarea" id="notes" name="notes" />
              </div>
            </div>

            <SubmitButton>Registrar agora</SubmitButton>
          </form>
        </article>

        <article className="card stack">
          <div className="toolbar">
            <div>
              <h2 style={{ margin: 0 }}>Barris em aberto</h2>
              <p className="muted">Retornos esperados e cliente atual.</p>
            </div>
            <Link className="button-ghost" href="/dashboard/barris">
              Ver barris
            </Link>
          </div>

          <div className="timeline">
            {openBarrels.length ? (
              openBarrels.map((item) => (
                <div key={item.id} className="timeline-item">
                  <strong>{item.code}</strong>
                  <div className="muted">
                    Cliente: {item.current_customer?.trade_name || item.current_customer?.name || "-"}
                  </div>
                  <div className="muted">{item.capacity_liters}L</div>
                </div>
              ))
            ) : (
              <div className="empty-state">Nenhum barril com cliente neste momento.</div>
            )}
          </div>
        </article>
      </section>

      <section className="card stack">
        <div className="toolbar">
          <div>
            <h2 style={{ margin: 0 }}>Últimas operações</h2>
            <p className="muted">Leitura rápida da atividade mais recente.</p>
          </div>
          <Link className="button-ghost" href="/dashboard/historico">
            Histórico completo
          </Link>
        </div>

        <div className="timeline">
          {data.movements.length ? (
            data.movements.map((item) => (
              <div key={item.id} className="timeline-item">
                <div className="toolbar">
                  <strong>
                    {formatMovementType(item.movement_type)} • {item.barrel_code}
                  </strong>
                  <span className="muted">{formatDateTime(item.occurred_at)}</span>
                </div>
                <div className="muted">
                  Cliente: {item.customer?.trade_name || item.customer?.name || "-"}
                </div>
                <div className="muted">Operador: {item.performer?.full_name || "-"}</div>
              </div>
            ))
          ) : (
            <div className="empty-state">Nenhuma movimentação registrada ainda.</div>
          )}
        </div>
      </section>
    </>
  );
}
