"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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

import {
  deleteBarrelAction,
  saveBarrelAction,
  toggleBarrelAction,
} from "./actions";
import type { Barrel } from "@/lib/types";

export default function BarrelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { profile } = useDashboardContext();
  const { flash, setFlash } = useFlashState();
  const [isPending, startTransition] = useTransition();
  const [selectedEditingItem, setSelectedEditingItem] =
    useState<Barrel | null>(null);
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? DEFAULT_LIST_PAGE);
  const editingId = searchParams.get("edit") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const capacityFilter = searchParams.get("capacity") ?? "";
  const { data, isFetching } = useBarrelsQuery(
    search,
    page,
    DEFAULT_LIST_PAGE_SIZE,
    statusFilter,
    capacityFilter,
  );
  const barrels = data?.items ?? [];
  const editingItem =
    selectedEditingItem ?? barrels.find((item) => item.id === editingId) ?? null;
  const isAdmin = profile.role === "admin";
  const formRef = useRef<HTMLElement>(null);

  const clearEditUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const next = params.toString();
    return next ? `/dashboard/barris?${next}` : "/dashboard/barris";
  }, [searchParams]);

  useEffect(() => {
    if (!editingId) {
      setSelectedEditingItem(null);
      return;
    }

    const currentPageItem = barrels.find((item) => item.id === editingId);
    if (currentPageItem) {
      setSelectedEditingItem(currentPageItem);
    }
  }, [barrels, editingId]);

  async function invalidateData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["barrels"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["history"] }),
    ]);
  }

  async function handleRowAction(
    event: React.FormEvent<HTMLFormElement>,
    action: (
      formData: FormData,
    ) => Promise<{ status: "success" | "error"; message: string }>,
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

  const buildEditHref = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("edit", id);
    return `/dashboard/barris?${params.toString()}`;
  };

  function handleEdit(item: Barrel) {
    setSelectedEditingItem(item);
    window.history.pushState(null, "", buildEditHref(item.id));
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleCancelEdit() {
    setSelectedEditingItem(null);
    window.history.pushState(null, "", clearEditUrl);
  }

  const buildFilterHref = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const next = params.toString();
    return next ? `/dashboard/barris?${next}` : "/dashboard/barris";
  };

  const statusHref = (status: string) =>
    buildFilterHref({ status: statusFilter === status ? "" : status });

  const capacityHref = (capacity: string) =>
    buildFilterHref({ capacity: capacityFilter === capacity ? "" : capacity });

  const comboHref = (status: string, capacity: string) =>
    buildFilterHref(
      statusFilter === status && capacityFilter === capacity
        ? { status: "", capacity: "" }
        : { status, capacity },
    );

  const filterClass = (isActive: boolean) =>
    isActive ? "button-ghost filter-active" : "button-ghost";

  const filterParams = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(capacityFilter ? { capacity: capacityFilter } : {}),
  };

  return (
    <>
      <section className="page-header">
        <div>
          <div className="brand-kicker">Cadastro</div>
          <h1>Equipamentos</h1>
          <p className="brand-subtitle">Gerenciamento de equipamentos.</p>
        </div>
      </section>

      <FlashMessage error={flash.error} success={flash.success} />

      <section className="split">
        <article className="card stack">
          <div className="toolbar">
            <div>
              <h2 style={{ margin: 0 }}>Lista de equipamentos</h2>
              <p className="muted">
                Busca rápida e status de operação em tempo real.
              </p>
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
            <div className="filter-row">
              <Link className={filterClass(!statusFilter && !capacityFilter)} href={buildFilterHref({ status: "", capacity: "" })}>
                Todos
              </Link>
              <Link className={filterClass(statusFilter === "available")} href={statusHref("available")}>
                Disponíveis
              </Link>
              <Link className={filterClass(statusFilter === "out")} href={statusHref("out")}>
                Com cliente
              </Link>
              <Link className={filterClass(capacityFilter === "30")} href={capacityHref("30")}>
                30L
              </Link>
              <Link className={filterClass(capacityFilter === "50")} href={capacityHref("50")}>
                50L
              </Link>
              <Link className={filterClass(statusFilter === "available" && capacityFilter === "30")} href={comboHref("available", "30")}>
                30L disponíveis
              </Link>
              <Link className={filterClass(statusFilter === "available" && capacityFilter === "50")} href={comboHref("available", "50")}>
                50L disponíveis
              </Link>
            </div>

            {isFetching ? (
              <div className="table-status" role="status">
                Atualizando equipamentos...
              </div>
            ) : null}
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
                    <tr
                      key={item.id}
                      className={!item.is_active ? "row-muted" : undefined}
                    >
                      <td>{item.code}</td>
                      <td>
                        <strong>{item.notes || "-"}</strong>
                      </td>
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
                      <td>
                        {item.current_customer?.trade_name ||
                          item.current_customer?.name ||
                          "-"}
                      </td>
                      <td>{formatDateTime(item.updated_at)}</td>
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
                                onSubmit={(event) =>
                                  handleRowAction(event, toggleBarrelAction)
                                }
                              >
                                <input
                                  name="barrelId"
                                  type="hidden"
                                  value={item.id}
                                />
                                <button
                                  className="button-secondary"
                                  type="submit"
                                >
                                  {item.is_active ? "Arquivar" : "Reativar"}
                                </button>
                              </form>

                              <form
                                className="inline-form"
                                onSubmit={(event) =>
                                  handleRowAction(event, deleteBarrelAction)
                                }
                              >
                                <input
                                  name="barrelId"
                                  type="hidden"
                                  value={item.id}
                                />
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
                    <td colSpan={7}>
                      <div className="empty-state">
                        Nenhum equipamento encontrado.
                      </div>
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
              baseUrl="/dashboard/barris"
              searchParam={search}
              params={filterParams}
            />
          )}
        </article>

        {isAdmin ? (
          <article className="card stack" ref={formRef}>
            <div>
              <h2 style={{ margin: 0 }}>
                {editingItem ? "Editar equipamento" : "Novo equipamento"}
              </h2>
              <p className="muted">
                {editingItem
                  ? "Ajuste código, capacidade e observações."
                  : "Cadastre novos equipamentos."}
              </p>
            </div>

            <form
              key={editingItem?.id ?? "new"}
              className="stack"
              onSubmit={handleSave}
            >
              <input
                name="barrelId"
                type="hidden"
                value={editingItem?.id ?? ""}
              />

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
                <SubmitButton pending={isPending}>
                  {editingItem ? "Salvar alterações" : "Cadastrar equipamento"}
                </SubmitButton>
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
