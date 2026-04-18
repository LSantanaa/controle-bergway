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
  useUsersQuery,
} from "@/lib/hooks/use-app-queries";
import { useFlashState } from "@/lib/hooks/use-flash-state";
import { formatDateTime, formatRole } from "@/lib/utils";

import { deleteUserAction, saveUserAction } from "./actions";

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hasSupabaseAdminEnv } = useDashboardContext();
  const { flash, setFlash } = useFlashState();
  const [isPending, startTransition] = useTransition();
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? DEFAULT_LIST_PAGE);
  const editingId = searchParams.get("edit") ?? "";
  const { data } = useUsersQuery(search, page, DEFAULT_LIST_PAGE_SIZE);
  const users = data?.items ?? [];
  const editingItem = users.find((item) => item.id === editingId) ?? null;

  const clearEditUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const next = params.toString();
    return next ? `/dashboard/usuarios?${next}` : "/dashboard/usuarios";
  }, [searchParams]);

  async function invalidateData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["users"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["history"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", "movement-page"] }),
      queryClient.invalidateQueries({ queryKey: ["barrels"] }),
      queryClient.invalidateQueries({ queryKey: ["customers"] }),
    ]);
  }

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await deleteUserAction(formData);
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
      const result = await saveUserAction(formData);
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
          <div className="brand-kicker">Administração</div>
          <h1>Usuários</h1>
          <p className="brand-subtitle">
            Gerencie acessos e permissões de colaboradores e administradores.
          </p>
        </div>
      </section>

      <FlashMessage error={flash.error} success={flash.success} />

      {!hasSupabaseAdminEnv ? (
        <div className="hint">
          `SUPABASE_SECRET_KEY` ainda não configurada. Enquanto isso, nome, papel e status podem
          ser ajustados, mas criar, excluir ou trocar e-mail/senha ficará bloqueado.
        </div>
      ) : null}

      <section className="split">
        <article className="card stack">
          <div className="toolbar">
            <div>
              <h2 style={{ margin: 0 }}>Acessos cadastrados</h2>
              <p className="muted">Administra perfis, status e credenciais sem sair do sistema.</p>
            </div>

            <form className="toolbar" method="get">
              <input className="search" defaultValue={search} name="q" placeholder="Buscar usuário" />
              <button className="button-ghost" type="submit">
                Buscar
              </button>
            </form>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length ? (
                  users.map((item) => (
                    <tr key={item.id}>
                      <td>{item.full_name}</td>
                      <td>{item.email}</td>
                      <td>{formatRole(item.role)}</td>
                      <td>
                        <span
                          className={
                            item.is_active ? "badge badge-success" : "badge badge-warning"
                          }
                        >
                          {item.is_active ? "Ativo" : "Pendente"}
                        </span>
                      </td>
                      <td>{formatDateTime(item.created_at)}</td>
                      <td>
                        <div className="table-actions">
                          <Link className="button-ghost" href={`/dashboard/usuarios?edit=${item.id}`}>
                            Editar
                          </Link>

                          <form className="inline-form" onSubmit={handleDelete}>
                            <input name="userId" type="hidden" value={item.id} />
                            <button className="button-danger" type="submit">
                              Excluir
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">Nenhum usuário encontrado.</div>
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
              baseUrl="/dashboard/usuarios"
              searchParam={search}
            />
          )}
        </article>

        <article className="card stack">
          <div>
            <h2 style={{ margin: 0 }}>{editingItem ? "Editar usuário" : "Novo usuário"}</h2>
            <p className="muted">
              {editingItem
                ? "Atualize nome, perfil, acesso e senha se necessário."
                : "Crie novos colaboradores e admins diretamente no sistema."}
            </p>
          </div>

          <form key={editingItem?.id ?? "new"} className="stack" onSubmit={handleSave}>
            <input name="userId" type="hidden" value={editingItem?.id ?? ""} />

            <div className="field-grid">
              <div className="field">
                <label htmlFor="full_name">Nome completo</label>
                <input
                  className="input"
                  defaultValue={editingItem?.full_name ?? ""}
                  id="full_name"
                  name="full_name"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="email">E-mail</label>
                <input
                  className="input"
                  defaultValue={editingItem?.email ?? ""}
                  id="email"
                  name="email"
                  required
                  type="email"
                />
              </div>

              <div className="field-grid-2">
                <div className="field">
                  <label htmlFor="role">Perfil</label>
                  <select
                    className="select"
                    defaultValue={editingItem?.role ?? "collaborator"}
                    id="role"
                    name="role"
                  >
                    <option value="admin">Administrador</option>
                    <option value="collaborator">Colaborador</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="password">
                    {editingItem ? "Nova senha (opcional)" : "Senha inicial"}
                  </label>
                  <input className="input" id="password" minLength={6} name="password" type="password" />
                </div>
              </div>

              <label className="toolbar" style={{ justifyContent: "flex-start" }}>
                <input defaultChecked={editingItem?.is_active ?? true} name="is_active" type="checkbox" />
                Liberar acesso imediatamente
              </label>
            </div>

            <div className="toolbar">
              <SubmitButton pending={isPending}>{editingItem ? "Salvar alterações" : "Criar usuário"}</SubmitButton>
              {editingItem ? (
                <Link className="button-ghost" href={clearEditUrl}>
                  Cancelar edição
                </Link>
              ) : null}
            </div>
          </form>
        </article>
      </section>
    </>
  );
}
