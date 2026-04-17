import Image from "next/image";
import { redirect } from "next/navigation";

import { signInAction, signOutAction } from "@/app/actions/auth";
import { PasswordInput } from "@/components/ui/password-input";
import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSessionContext } from "@/lib/auth";
import { hasSupabaseAdminEnv, hasSupabasePublicEnv } from "@/lib/env";
import type { SearchParamsRecord } from "@/lib/types";
import { getSingleParam, readFlash } from "@/lib/utils";

type LoginPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const flash = readFlash(params);
  const pending = getSingleParam(params.pending) === "1";
  const context = await getSessionContext();

  if (context.profile?.is_active) {
    redirect("/dashboard");
  }

  if (!hasSupabasePublicEnv) {
    return (
      <main className="auth-shell">
        <section className="auth-card stack-lg">
          <div>
            <div className="brand-kicker">Setup</div>
            <h1 className="brand-title">Faltam as chaves do Supabase</h1>
            <p className="brand-subtitle">
              Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
            </p>
          </div>

          <div className="hint">
            Para fluxo administrativo completo de usuarios, configure tambem
            `SUPABASE_SECRET_KEY`.
          </div>

          <div className="hint">
            Se o seu `.env` ainda usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, o sistema
            agora tambem aceita esse formato legado.
          </div>
        </section>
      </main>
    );
  }

  if (context.userId && pending) {
    return (
      <main className="auth-shell">
        <section className="auth-card stack-lg">
          <div>
            <Image
              alt="Logo da Cervejaria Bergway"
              className="brand-logo"
              height={76}
              priority
              src="/logoBergway.png"
              width={76}
            />
            <div className="brand-kicker">Acesso pendente</div>
            <h1 className="brand-title">Seu usuario ainda nao foi liberado</h1>
            <p className="brand-subtitle">
              O login foi reconhecido, mas o administrador ainda precisa ativar seu acesso.
            </p>
          </div>

          <FlashMessage error={flash.error} success={flash.success} />

          <div className="hint">
            Primeiro admin: pode ser criado manualmente no Supabase Auth. Depois disso, os
            proximos usuarios ja sao geridos pelo proprio sistema.
          </div>

          {!hasSupabaseAdminEnv ? (
            <div className="hint">
              A chave `SUPABASE_SECRET_KEY` ainda nao esta configurada, entao o fluxo
              administrativo de criacao e exclusao de usuarios ainda ficara incompleto.
            </div>
          ) : null}

          <form action={signOutAction}>
            <SubmitButton className="button-ghost">Sair</SubmitButton>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card stack-lg">
        <div>
          <Image
            alt="Logo da Cervejaria Bergway"
            className="brand-logo"
            height={76}
            priority
            src="/logoBergway.png"
            width={76}
          />
          <div className="brand-kicker">Cervejaria Bergway</div>
          <h1 className="brand-title">Controle de Equipamentos</h1>
        </div>

        <FlashMessage error={flash.error} success={flash.success} />

        <form action={signInAction} className="stack">
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input className="input" id="email" name="email" type="email" required />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <PasswordInput id="password" name="password" required />
          </div>

          <SubmitButton>Entrar no sistema</SubmitButton>
        </form>

        <div className="hint">
          Problemas? Entre em contato com o administrador do sistema.
        </div>
      </section>
    </main>
  );
}
