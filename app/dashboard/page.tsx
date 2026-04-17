import Link from "next/link";

import { getDashboardData } from "@/lib/queries";
import { formatBarrelStatus, formatDateTime, formatMovementType } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const activeBarrels = data.barrels.filter((item) => item.is_active);
  const openBarrels = activeBarrels.filter((item) => item.status === "out");
  const availableBarrels = activeBarrels.filter((item) => item.status === "available");
  const activeCustomers = data.customers.filter((item) => item.is_active);

  const stats = [
    { label: "Barris ativos", value: activeBarrels.length },
    { label: "Disponíveis", value: availableBarrels.length },
    { label: "Com cliente", value: openBarrels.length },
    { label: "Clientes ativos", value: activeCustomers.length },
  ];

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
          {data.profile.role === "admin" ? (
            <Link className="button-ghost" href="/dashboard/usuarios">
              Gerenciar usuários
            </Link>
          ) : null}
        </div>
      </section>

      <section className="stats">
        {stats.map((item) => (
          <article key={item.label} className="stat-card">
            <span className="muted">{item.label}</span>
            <div className="stat-value">{item.value}</div>
          </article>
        ))}
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
            {data.movements.length ? (
              data.movements.map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className="toolbar">
                    <strong>
                      {formatMovementType(item.movement_type)} do equipamento {item.barrel_code}
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
        </article>

        <article className="card stack">
          <div>
            <h2 style={{ margin: 0 }}>Equipamentos com cliente</h2>
            <p className="muted">Visão rápida do que ainda está fora da cervejaria.</p>
          </div>

          <div className="timeline">
            {openBarrels.length ? (
              openBarrels.slice(0, 8).map((item) => (
                <div key={item.id} className="timeline-item">
                  <strong>{item.code}</strong>
                  <div className="muted">
                    {item.current_customer?.trade_name || item.current_customer?.name || "Sem cliente"}
                  </div>
                  <div className="muted">
                    {item.capacity_liters}L • {formatBarrelStatus(item.status)}
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
