import Link from "next/link";

import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireActiveProfile } from "@/lib/auth";
import { getCustomers } from "@/lib/queries";
import type { SearchParamsRecord } from "@/lib/types";
import { getSingleParam, readFlash } from "@/lib/utils";

import {
  deleteCustomerAction,
  saveCustomerAction,
  toggleCustomerAction,
} from "./actions";

type CustomersPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const profile = await requireActiveProfile();
  const params = await searchParams;
  const search = getSingleParam(params.q);
  const flash = readFlash(params);
  const customers = await getCustomers(search);
  const editingId = getSingleParam(params.edit);
  const editingItem = customers.find((item) => item.id === editingId) ?? null;
  const isAdmin = profile.role === "admin";

  return (
    <>
      <section className="page-header">
        <div>
          <div className="brand-kicker">Cadastro</div>
          <h1>Clientes</h1>
          <p className="brand-subtitle">
            Gerenciamento de clientes.
          </p>
        </div>
      </section>

      <FlashMessage error={flash.error} success={flash.success} />

      <section className="split">
        <article className="card stack">
          <div className="toolbar">
            <div>
              <h2 style={{ margin: 0 }}>Base de clientes</h2>
              <p className="muted">Contato, cidade e status de atendimento.</p>
            </div>

            <form className="toolbar" method="get">
              <input
                className="search"
                defaultValue={search}
                name="q"
                placeholder="Buscar por nome, cidade ou telefone"
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
                  <th>Cliente</th>
                  <th>Contato</th>
                  <th>Cidade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {customers.length ? (
                  customers.map((item) => (
                    <tr key={item.id} className={!item.is_active ? "row-muted" : undefined}>
                      <td>
                        <strong>{item.trade_name || item.name}</strong>
                        <div className="muted">{item.name}</div>
                      </td>
                      <td>
                        <strong>{item.contact_name || "-"}</strong>
                        <div className="muted">{item.phone || "Sem telefone"}</div>
                      </td>
                      <td>{item.city || "-"}</td>
                      <td>
                        <span
                          className={
                            item.is_active ? "badge badge-success" : "badge badge-neutral"
                          }
                        >
                          {item.is_active ? "Ativo" : "Arquivado"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          {isAdmin ? (
                            <>
                              <Link className="button-ghost" href={`/dashboard/clientes?edit=${item.id}`}>
                                Editar
                              </Link>

                              <form action={toggleCustomerAction} className="inline-form">
                                <input name="customerId" type="hidden" value={item.id} />
                                <button className="button-secondary" type="submit">
                                  {item.is_active ? "Arquivar" : "Reativar"}
                                </button>
                              </form>

                              <form action={deleteCustomerAction} className="inline-form">
                                <input name="customerId" type="hidden" value={item.id} />
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
                    <td colSpan={5}>
                      <div className="empty-state">Nenhum cliente encontrado.</div>
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
              <h2 style={{ margin: 0 }}>{editingItem ? "Editar cliente" : "Novo cliente"}</h2>
              <p className="muted">
                Dados essenciais para operação e histórico sem dependência de modal.
              </p>
            </div>

            <form action={saveCustomerAction} className="stack">
              <input name="customerId" type="hidden" value={editingItem?.id ?? ""} />

              <div className="field-grid">
                <div className="field">
                  <label htmlFor="name">Razão social</label>
                  <input className="input" defaultValue={editingItem?.name ?? ""} id="name" name="name" required />
                </div>

                <div className="field">
                  <label htmlFor="trade_name">Nome fantasia</label>
                  <input
                    className="input"
                    defaultValue={editingItem?.trade_name ?? ""}
                    id="trade_name"
                    name="trade_name"
                  />
                </div>

                <div className="field-grid-2">
                  <div className="field">
                    <label htmlFor="contact_name">Contato</label>
                    <input
                      className="input"
                      defaultValue={editingItem?.contact_name ?? ""}
                      id="contact_name"
                      name="contact_name"
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="phone">Telefone</label>
                    <input className="input" defaultValue={editingItem?.phone ?? ""} id="phone" name="phone" />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="city">Cidade</label>
                  <input className="input" defaultValue={editingItem?.city ?? ""} id="city" name="city" />
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
                <SubmitButton>{editingItem ? "Salvar alterações" : "Cadastrar cliente"}</SubmitButton>
                {editingItem ? (
                  <Link className="button-ghost" href="/dashboard/clientes">
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
