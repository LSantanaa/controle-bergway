"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Pagination } from "@/components/ui/pagination";
import { useDashboardContext } from "@/components/providers/dashboard-provider";
import {
  DEFAULT_LIST_PAGE,
  DEFAULT_LIST_PAGE_SIZE,
  useBarrelsQuery,
} from "@/lib/hooks/use-app-queries";
import { useFlashState } from "@/lib/hooks/use-flash-state";
import { formatBarrelStatus, formatDateTime } from "@/lib/utils";

import { deleteBarrelAction, saveBarrelAction, toggleBarrelAction } from "./actions";

export default function BarrelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { profile } = useDashboardContext();
  const { flash, setFlash } = useFlashState();
  const [isPending, startTransition] = useTransition();
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? DEFAULT_LIST_PAGE);
  const editingId = searchParams.get("edit") ?? "";
  const { data } = useBarrelsQuery(search, page, DEFAULT_LIST_PAGE_SIZE);
  const barrels = data?.items ?? [];
  const editingItem = barrels.find((item) => item.id === editingId) ?? null;
  const isAdmin = profile.role === "admin";

  const clearEditUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const next = params.toString();
    return next ? `/dashboard/barris?${next}` : "/dashboard/barris";
  }, [searchParams]);

  async function invalidateData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["barrels"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["history"] }),
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
      const result = await saveBarrelAction(formData);
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
                  <th>Tipo/Observações</th>
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
                      <td><strong>{item.notes || "-"}</strong></td>
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

                              <form
                                className="inline-form"
                                onSubmit={(event) => handleRowAction(event, toggleBarrelAction)}
                              >
                                <input name="barrelId" type="hidden" value={item.id} />
                                <button className="button-secondary" type="submit">
                                  {item.is_active ? "Arquivar" : "Reativar"}
                                </button>
                              </form>

                              <form
                                className="inline-form"
                                onSubmit={(event) => handleRowAction(event, deleteBarrelAction)}
                              >
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

          {data && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              baseUrl="/dashboard/barris"
              searchParam={search}
            />
          )}
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

            <form key={editingItem?.id ?? "new"} className="stack" onSubmit={handleSave}>
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
                <SubmitButton pending={isPending}>{editingItem ? "Salvar alterações" : "Cadastrar equipamento"}</SubmitButton>
                {editingItem ? (
                  <Link className="button-ghost" href={clearEditUrl}>
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
