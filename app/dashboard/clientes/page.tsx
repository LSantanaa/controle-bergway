"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Pagination } from "@/components/ui/pagination";
import { useDashboardContext } from "@/components/providers/dashboard-provider";
import {
  DEFAULT_LIST_PAGE,
  DEFAULT_LIST_PAGE_SIZE,
  useCustomersQuery,
} from "@/lib/hooks/use-app-queries";
import { useFlashState } from "@/lib/hooks/use-flash-state";

import {
  deleteCustomerAction,
  saveCustomerAction,
  toggleCustomerAction,
} from "./actions";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { profile } = useDashboardContext();
  const { flash, setFlash } = useFlashState();
  const [isPending, startTransition] = useTransition();
  const [selectedEditingItem, setSelectedEditingItem] =
    useState<Customer | null>(null);
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? DEFAULT_LIST_PAGE);
  const editingId = searchParams.get("edit") ?? "";
  const { data, isFetching } = useCustomersQuery(
    search,
    page,
    DEFAULT_LIST_PAGE_SIZE,
  );
  const customers = data?.items ?? [];
  const editingItem =
    selectedEditingItem ?? customers.find((item) => item.id === editingId) ?? null;
  const isAdmin = profile.role === "admin";

  const clearEditUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const next = params.toString();
    return next ? `/dashboard/clientes?${next}` : "/dashboard/clientes";
  }, [searchParams]);

  useEffect(() => {
    if (!editingId) {
      setSelectedEditingItem(null);
      return;
    }

    const currentPageItem = customers.find((item) => item.id === editingId);
    if (currentPageItem) {
      setSelectedEditingItem(currentPageItem);
    }
  }, [customers, editingId]);

  async function invalidateData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["customers"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "movement-page"] }),
      queryClient.invalidateQueries({ queryKey: ["history"] }),
      queryClient.invalidateQueries({ queryKey: ["barrels"] }),
    ]);
  }

  async function handleRowAction(
    event: React.FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<{ status: "success" | "error"; message: string }>,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await action(formData);
      setFlash({
        error: result.status === "error" ? result.message : "",
        success: result.status === "success" ? result.message : "",
      });

      if (result.status === "success") {
        await invalidateData();
      }
    });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveCustomerAction(formData);
      setFlash({
        error: result.status === "error" ? result.message : "",
        success: result.status === "success" ? result.message : "",
      });

      if (result.status === "success") {
        await invalidateData();
        router.replace(clearEditUrl);
      }
    });
  }

  const buildEditHref = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("edit", id);
    return `/dashboard/clientes?${params.toString()}`;
  };

  function handleEdit(item: Customer) {
    setSelectedEditingItem(item);
    window.history.pushState(null, "", buildEditHref(item.id));
  }

  function handleCancelEdit() {
    setSelectedEditingItem(null);
    window.history.pushState(null, "", clearEditUrl);
  }

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
            {isFetching ? (
              <div className="table-status" role="status">
                Atualizando clientes...
              </div>
            ) : null}
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
                              <button
                                className="button-ghost"
                                onClick={() => handleEdit(item)}
                                type="button"
                              >
                                Editar
                              </button>

                              <form
                                className="inline-form"
                                onSubmit={(event) => handleRowAction(event, toggleCustomerAction)}
                              >
                                <input name="customerId" type="hidden" value={item.id} />
                                <button className="button-secondary" type="submit">
                                  {item.is_active ? "Arquivar" : "Reativar"}
                                </button>
                              </form>

                              <form
                                className="inline-form"
                                onSubmit={(event) => handleRowAction(event, deleteCustomerAction)}
                              >
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

          {data && (
            <Pagination
              page={page}
              pageSize={data.pageSize}
              total={data.total}
              baseUrl="/dashboard/clientes"
              searchParam={search}
            />
          )}
        </article>

        {isAdmin ? (
          <article className="card stack">
            <div>
              <h2 style={{ margin: 0 }}>{editingItem ? "Editar cliente" : "Novo cliente"}</h2>
              <p className="muted">
                {editingItem
                  ? "Altere os dados do cliente e clique em salvar para atualizar as informações."
                  : "Preencha os dados do cliente e clique em cadastrar para adicionar à base."}
              </p>
            </div>

            <form key={editingItem?.id ?? "new"} className="stack" onSubmit={handleSave}>
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
                <SubmitButton pending={isPending}>{editingItem ? "Salvar alterações" : "Cadastrar cliente"}</SubmitButton>
                {editingItem ? (
                  <button
                    className="button-ghost"
                    onClick={handleCancelEdit}
                    type="button"
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </form>
          </article>
        ) : null}
      </section>
    </>
  );
}
