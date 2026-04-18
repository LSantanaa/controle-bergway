"use client";

import Link from "next/link";

import { useDashboardSummaryQuery } from "@/lib/hooks/use-app-queries";
import { useDashboardContext } from "@/components/providers/dashboard-provider";
import { formatBarrelStatus, formatDateTime, formatMovementType } from "@/lib/utils";
import { SkeletonStat, SkeletonTimelineItem } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { profile } = useDashboardContext();
  const { data, isLoading } = useDashboardSummaryQuery();

  const stats = [
    { label: "Barris ativos", value: data?.stats.activeBarrels ?? 0 },
    { label: "Disponíveis", value: data?.stats.availableBarrels ?? 0 },
    { label: "Com cliente", value: data?.stats.openBarrels ?? 0 },
    { label: "Clientes ativos", value: data?.stats.activeCustomers ?? 0 },
  ];

  const movements = data?.recentMovements ?? [];
  const openBarrels = data?.openBarrels ?? [];

  return (
    <>
      <section className="page-header">
        <div>
          <div className="brand-kicker">Painel</div>
          <h1>Operação e gestão</h1>
          <p className="brand-subtitle">
           Visão geral de movimentações.
          </p>
        </div>

        <div className="toolbar">
          <Link className="button" href="/dashboard/movimentacoes">
            Registrar movimentação
          </Link>
          {profile.role === "admin" ? (
            <Link className="button-ghost" href="/dashboard/usuarios">
              Gerenciar usuários
            </Link>
          ) : null}
        </div>
      </section>

      <section className="stats">
        {isLoading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          stats.map((item) => (
            <article key={item.label} className="stat-card">
              <span className="muted">{item.label}</span>
              <div className="stat-value">{item.value}</div>
            </article>
          ))
        )}
      </section>

      <section className="split">
        <article className="card stack">
          <div className="toolbar">
            <div>
              <h2 style={{ margin: 0 }}>Últimas movimentações</h2>
              <p className="muted">Entrada e saída recentes com operador e cliente.</p>
            </div>
            <Link className="button-ghost" href="/dashboard/historico">
              Ver histórico
            </Link>
          </div>

          <div className="timeline">
            {isLoading ? (
              <>
                <SkeletonTimelineItem />
                <SkeletonTimelineItem />
                <SkeletonTimelineItem />
              </>
            ) : movements.length ? (
              movements.map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className="toolbar">
                    <strong>
                      {formatMovementType(item.movement_type)} do equipamento {item.barrel_code}
                    </strong>
                    <span className="muted">{formatDateTime(item.occurred_at)}</span>
                  </div>
                  {item.barrel?.notes && <div className="muted" style={{ fontWeight: 500 }}>{item.barrel.notes}</div>}
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

        <article className="card stack">
          <div>
            <h2 style={{ margin: 0 }}>Equipamentos com cliente</h2>
            <p className="muted">Visão rápida do que ainda estão fora da cervejaria.</p>
          </div>

          <div className="timeline">
            {isLoading ? (
              <>
                <SkeletonTimelineItem />
                <SkeletonTimelineItem />
                <SkeletonTimelineItem />
              </>
            ) : openBarrels.length ? (
              openBarrels.slice(0, 8).map((item) => (
                <div key={item.id} className="timeline-item">
                  <strong>{item.code}</strong>
                  {item.notes && <div className="muted" style={{ fontWeight: 500 }}>{item.notes}</div>}
                  <div className="muted">
                    {item.current_customer?.trade_name || item.current_customer?.name || "Sem cliente"}
                  </div>
                  <div className="muted">
                    {item.capacity_liters}L - {formatBarrelStatus(item.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Nenhum equipamento em aberto no momento.</div>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
