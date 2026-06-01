-- ====================================================================
-- Migration: Harden security and RLS performance
-- Fix advisors detectados tras initial_schema:
--  - function_search_path_mutable (security) → set explicit search_path
--  - auth_rls_initplan (performance) → wrap function calls en (select ...)
--    para que evalúen 1 vez por query en vez de 1 vez por row
-- ====================================================================

-- ----- SECURITY: Set explicit search_path on all functions -----
alter function public.set_updated_at() set search_path = '';
alter function public.tenant_id() set search_path = '';
alter function public.is_platform_admin() set search_path = '';
alter function public.custom_access_token_hook(jsonb) set search_path = '';

-- ----- PERFORMANCE: Wrap function calls en (select ...) -----

-- comercios
drop policy if exists comercios_select_own on public.comercios;
create policy comercios_select_own on public.comercios
  for select to authenticated
  using (
    id = (select public.tenant_id()) or (select public.is_platform_admin())
  );

drop policy if exists comercios_update on public.comercios;
create policy comercios_update on public.comercios
  for update to authenticated
  using (
    (id = (select public.tenant_id()) and exists (
      select 1 from public.usuarios_comercio uc
      where uc.user_id = (select auth.uid())
        and uc.comercio_id = public.comercios.id
        and uc.rol = 'mostrador'
        and uc.activo = true
    )) or (select public.is_platform_admin())
  );

drop policy if exists comercios_insert_admin on public.comercios;
create policy comercios_insert_admin on public.comercios
  for insert to authenticated
  with check ((select public.is_platform_admin()));

drop policy if exists comercios_delete_admin on public.comercios;
create policy comercios_delete_admin on public.comercios
  for delete to authenticated
  using ((select public.is_platform_admin()));

-- usuarios_comercio
drop policy if exists usuarios_comercio_select on public.usuarios_comercio;
create policy usuarios_comercio_select on public.usuarios_comercio
  for select to authenticated
  using (
    comercio_id = (select public.tenant_id()) or (select public.is_platform_admin())
  );

drop policy if exists usuarios_comercio_insert on public.usuarios_comercio;
create policy usuarios_comercio_insert on public.usuarios_comercio
  for insert to authenticated
  with check (
    (select public.is_platform_admin()) or (
      comercio_id = (select public.tenant_id()) and exists (
        select 1 from public.usuarios_comercio uc
        where uc.user_id = (select auth.uid())
          and uc.comercio_id = public.usuarios_comercio.comercio_id
          and uc.rol = 'mostrador'
          and uc.activo = true
      )
    )
  );

drop policy if exists usuarios_comercio_update on public.usuarios_comercio;
create policy usuarios_comercio_update on public.usuarios_comercio
  for update to authenticated
  using (
    (select public.is_platform_admin()) or (
      comercio_id = (select public.tenant_id()) and exists (
        select 1 from public.usuarios_comercio uc
        where uc.user_id = (select auth.uid())
          and uc.comercio_id = public.usuarios_comercio.comercio_id
          and uc.rol = 'mostrador'
          and uc.activo = true
      )
    )
  );

-- platform_admins
drop policy if exists platform_admins_select_self on public.platform_admins;
create policy platform_admins_select_self on public.platform_admins
  for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_platform_admin()));
