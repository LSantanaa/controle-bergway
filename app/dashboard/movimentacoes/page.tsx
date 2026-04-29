"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { BarrelSearch } from "@/components/ui/barrel-search";
import { useMovementPageQuery } from "@/lib/hooks/use-app-queries";
import { useFlashState } from "@/lib/hooks/use-flash-state";
import { formatDateTime, formatMovementType } from "@/lib/utils";

import { registerMovementAction } from "./actions";

export default function MovementsPage() {
  const queryClient = useQueryClient();
  const { flash, setFlash } = useFlashState();
  const [isPending, startTransition] = useTransition();
  const [selectedBarrel, setSelectedBarrel] = useState<any>(null);
  const { data } = useMovementPageQuery();
  const activeCustomers = data?.activeCustomers ?? [];
  const openBarrels = data?.openBarrels ?? [];
  const movements = data?.recentMovements ?? [];

  async function invalidateData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["barrels"] }),
      queryClient.invalidateQueries({ queryKey: ["history"] }),
    ]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await registerMovementAction(formData);
      setFlash({
        error: result.status === "error" ? result.message : "",
        success: result.status === "success" ? result.message : "",
      });

      if (result.status === "success") {
        form.reset();
        await invalidateData();
      }
    });
  }

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

      <section className="movement-layout">
        <div className="stack">
          <article className="card stack">
            <div>
              <h2 style={{ margin: 0 }}>Registrar movimentação</h2>
              <p className="muted">
                Para saída, selecione o cliente. Para entrada, o próprio histórico fecha o ciclo.
              </p>
            </div>

            <form className="stack" onSubmit={handleSubmit}>
              <div className="field-grid">
                <div className="field-grid-2">
                  <BarrelSearch onBarrelSelect={setSelectedBarrel} />

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

              <SubmitButton pending={isPending}>Registrar agora</SubmitButton>
            </form>
          </article>

          <article className="card stack">
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
              {movements.length ? (
                movements.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div className="toolbar">
                      <strong>
                        {formatMovementType(item.movement_type)} • {item.barrel_code}
                      </strong>
                      <span className="muted">{formatDateTime(item.occurred_at)}</span>
                    </div>
                    {item.barrel?.notes && (
                      <div className="muted" style={{ fontWeight: 500 }}>
                        {item.barrel.notes}
                      </div>
                    )}
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
          </article>
        </div>

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
                  {item.notes && <div className="muted" style={{ fontWeight: 500 }}>{item.notes}</div>}
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
    </>
  );
}
