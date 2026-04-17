import Link from "next/link";

import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { getUsers } from "@/lib/queries";
import type { SearchParamsRecord } from "@/lib/types";
import { formatDateTime, formatRole, getSingleParam, readFlash } from "@/lib/utils";

import { deleteUserAction, saveUserAction } from "./actions";

type UsersPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const search = getSingleParam(params.q);
  const flash = readFlash(params);
  const users = await getUsers(search);
  const editingId = getSingleParam(params.edit);
  const editingItem = users.find((item) => item.id === editingId) ?? null;

  return (
    <>
      <section className="page-header">
        <div>
          <div className="brand-kicker">Administração</div>
          <h1>Usuários</h1>
          <p className="brand-subtitle">
            O primeiro admin nasce no Supabase Auth. Depois disso, criação, edição e exclusão
            passam a ser feitas aqui dentro.
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

                          <form action={deleteUserAction} className="inline-form">
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

          <form action={saveUserAction} className="stack">
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
              <SubmitButton>{editingItem ? "Salvar alterações" : "Criar usuário"}</SubmitButton>
              {editingItem ? (
                <Link className="button-ghost" href="/dashboard/usuarios">
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
