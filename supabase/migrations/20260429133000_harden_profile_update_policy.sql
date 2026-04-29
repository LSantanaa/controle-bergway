-- Segurança incremental: impede que um usuário altere o próprio perfil,
-- papel ou status diretamente pelo cliente. Dados existentes não são alterados.

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;

create policy "profiles_admin_update"
on public.profiles for update
using (public.current_app_role() = 'admin' and public.current_app_active())
with check (public.current_app_role() = 'admin' and public.current_app_active());

