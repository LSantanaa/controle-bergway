import Link from "next/link";

import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireActiveProfile } from "@/lib/auth";
import { getBarrels } from "@/lib/queries";
import type { SearchParamsRecord } from "@/lib/types";
import {
  formatBarrelStatus,
  formatDateTime,
  getSingleParam,
  readFlash,
} from "@/lib/utils";

import { deleteBarrelAction, saveBarrelAction, toggleBarrelAction } from "./actions";

type BarrelsPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function BarrelsPage({ searchParams }: BarrelsPageProps) {
  const profile = await requireActiveProfile();
  const params = await searchParams;
  const search = getSingleParam(params.q);
  const flash = readFlash(params);
  const barrels = await getBarrels(search);
  const editingId = getSingleParam(params.edit);
  const editingItem = barrels.find((item) => item.id === editingId) ?? null;
  const isAdmin = profile.role === "admin";

  return (
    <>
      <section className="page-header">
        <div>
          <div className="brand-kicker">Cadastro</div>
          <h1>Equipamentos</h1>
          <p className="brand-subtitle">
            Gerenciamento de equipamentos.
          </p>
        </div>
      </section>

      <FlashMessage error={flash.error} success={flash.success} />

      <section className="split">
        <article className="card stack">
          <div className="toolbar">
            <div>
              <h2 style={{ margin: 0 }}>Lista de equipamentos</h2>
              <p className="muted">Busca rápida e status de operação em tempo real.</p>
            </div>

            <form className="toolbar" method="get">
              <input
                className="search"
                defaultValue={search}
                name="q"
                placeholder="Buscar por código ou cliente"
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
                  <th>Código</th>
                  <th>Capacidade</th>
                  <th>Status</th>
                  <th>Cliente atual</th>
                  <th>Atualizado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {barrels.length ? (
                  barrels.map((item) => (
                    <tr key={item.id} className={!item.is_active ? "row-muted" : undefined}>
                      <td>{item.code}</td>
                      <td>{item.capacity_liters}L</td>
                      <td>
                        <span
                          className={
                            item.status === "available"
                              ? "badge badge-success"
                              : "badge badge-warning"
                          }
                        >
                          {formatBarrelStatus(item.status)}
                        </span>
                      </td>
                      <td>{item.current_customer?.trade_name || item.current_customer?.name || "-"}</td>
                      <td>{formatDateTime(item.updated_at)}</td>
                      <td>
                        <div className="table-actions">
                          {isAdmin ? (
                            <>
                              <Link className="button-ghost" href={`/dashboard/barris?edit=${item.id}`}>
                                Editar
                              </Link>

                              <form action={toggleBarrelAction} className="inline-form">
                                <input name="barrelId" type="hidden" value={item.id} />
                                <button className="button-secondary" type="submit">
                                  {item.is_active ? "Arquivar" : "Reativar"}
                                </button>
                              </form>

                              <form action={deleteBarrelAction} className="inline-form">
                                <input name="barrelId" type="hidden" value={item.id} />
                                <button className="button-danger" type="submit">
                                  Excluir
                                </button>
                              </form>
                            </>
                          ) : (
                            <span className="muted">Somente leitura</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">Nenhum equipamento encontrado.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {isAdmin ? (
          <article className="card stack">
            <div>
              <h2 style={{ margin: 0 }}>{editingItem ? "Editar equipamento" : "Novo equipamento"}</h2>
              <p className="muted">
                {editingItem
                  ? "Ajuste código, capacidade e observações."
                  : "Cadastre novos equipamentos."}
              </p>
            </div>

            <form action={saveBarrelAction} className="stack">
              <input name="barrelId" type="hidden" value={editingItem?.id ?? ""} />

              <div className="field-grid">
                <div className="field">
                  <label htmlFor="code">Código</label>
                  <input
                    className="input"
                    defaultValue={editingItem?.code ?? ""}
                    id="code"
                    name="code"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="capacity_liters">Capacidade (L)</label>
                  <input
                    className="input"
                    defaultValue={editingItem?.capacity_liters ?? 50}
                    id="capacity_liters"
                    min={1}
                    name="capacity_liters"
                    required
                    type="number"
                  />
                </div>

                <div className="field">
                  <label htmlFor="notes">Observações</label>
                  <textarea
                    className="textarea"
                    defaultValue={editingItem?.notes ?? ""}
                    id="notes"
                    name="notes"
                  />
                </div>
              </div>

              <div className="toolbar">
                <SubmitButton>{editingItem ? "Salvar alterações" : "Cadastrar equipamento"}</SubmitButton>
                {editingItem ? (
                  <Link className="button-ghost" href="/dashboard/barris">
                    Cancelar edição
                  </Link>
                ) : null}
              </div>
            </form>
          </article>
        ) : null}
      </section>
    </>
  );
}
