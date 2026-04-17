# Barris Control 2026

Rebuild do sistema da cervejaria em `Next.js App Router`, com renderizacao server-first, `Supabase SSR`, autenticação segura no servidor e administracao de usuarios dentro do proprio sistema.

## Stack

- `Next.js 16`
- `React 19`
- `Supabase Auth + Postgres`
- `@supabase/ssr`
- `Server Actions` e `Route-aware DAL`

## Direcao arquitetural

- Sem SPA pesada para o fluxo principal.
- Sem backend `Express` separado por enquanto: o proprio `Next` faz o papel de camada servidor.
- `Supabase` continua como banco, auth e RLS.
- `SUPABASE_SECRET_KEY` fica apenas no servidor para criacao, atualizacao de credenciais e exclusao de usuarios.

## Estrutura nova

```text
app/
  login/
  dashboard/
    barris/
    clientes/
    usuarios/
    movimentacoes/
    historico/
components/
  shell/
  ui/
lib/
  supabase/
  auth.ts
  queries.ts
supabase/
  schema.sql
```

O codigo legado foi mantido temporariamente em `legacy-src/` para referencia durante a migracao.

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Copie `.env.example` para `.env`.

3. Preencha com as credenciais do projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
```

Compatibilidade:

- Se o projeto ainda estiver usando chaves antigas, o app aceita `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.

4. Execute o SQL de [supabase/schema.sql](/C:/Users/leona/Documents/cervejaria-barris/supabase/schema.sql).

5. Crie o primeiro usuario em `Authentication > Users`.

6. Promova esse primeiro usuario para admin:

```sql
update public.profiles
   set role = 'admin', is_active = true
 where email = 'seu-email@cervejaria.com';
```

7. Rode o app:

```bash
npm run dev
```

## Fluxo de usuarios

- Primeiro admin: criado manualmente no Supabase Auth.
- Demais usuarios: criados, editados e excluidos dentro do sistema.
- Colaboradores pendentes nao entram no dashboard ate serem liberados.

## Regras principais

- Barris e clientes podem ser arquivados.
- Exclusao permanente so acontece quando nao existe historico relacionado.
- Movimentacoes continuam protegidas pela funcao SQL `register_barrel_movement`.
- Leituras principais saem do servidor para melhorar consistencia e performance percebida.

## Deploy

O projeto agora deve ser publicado como app `Next.js`, por exemplo em:

- Vercel
- Railway
- Render

Build:

```bash
npm run build
```
