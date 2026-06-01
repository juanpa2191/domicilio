-- ====================================================================
-- Migration: Initial schema for Domicilios Norte Aburrá
-- Story 1.2 — Schema inicial de DB con multi-tenancy
-- ====================================================================
-- Crea: enums, tablas comercios + usuarios_comercio + platform_admins,
-- updated_at triggers, RLS policies con tenant_id custom claim,
-- helper functions, y custom_access_token_hook para Auth.
-- ====================================================================

-- --------------------------------------------------------------------
-- ENUMS (todos los del dominio, snake_case español)
-- --------------------------------------------------------------------
create type public.rol_usuario as enum ('mostrador', 'cocina', 'domiciliario');

create type public.estado_pedido as enum (
  'pendiente_pago',
  'validando_pago',
  'en_cocina',
  'listo',
  'en_domicilio',
  'entregado',
  'cancelado'
);

create type public.modalidad_entrega as enum ('domicilio', 'recoger_en_local');

create type public.forma_pago as enum (
  'transferencia',
  'efectivo_recibir',
  'efectivo_local'
);

create type public.estado_suscripcion as enum (
  'periodo_gratis',
  'al_dia',
  'pendiente',
  'atrasado'
);

-- --------------------------------------------------------------------
-- updated_at trigger function (reutilizable)
-- --------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------
-- TABLE: comercios
-- --------------------------------------------------------------------
create table public.comercios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text not null,
  horario jsonb not null default '{}'::jsonb,
  foto_principal_url text,
  cerrado_temporalmente boolean not null default false,
  formas_pago jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  fecha_inicio_gratis date not null default current_date,
  fecha_fin_gratis date not null default (current_date + interval '60 days'),
  estado_suscripcion public.estado_suscripcion not null default 'periodo_gratis',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger comercios_set_updated_at
  before update on public.comercios
  for each row execute function public.set_updated_at();

create index idx_comercios_activo on public.comercios (activo) where activo = true;

-- --------------------------------------------------------------------
-- TABLE: usuarios_comercio (Mostrador / Cocina / Domiciliario)
-- NOTA: NO incluye admin. Admin va en platform_admins.
-- --------------------------------------------------------------------
create table public.usuarios_comercio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  comercio_id uuid not null references public.comercios(id) on delete cascade,
  rol public.rol_usuario not null,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, comercio_id)
);

create trigger usuarios_comercio_set_updated_at
  before update on public.usuarios_comercio
  for each row execute function public.set_updated_at();

create index idx_usuarios_comercio_user_id on public.usuarios_comercio (user_id);
create index idx_usuarios_comercio_comercio_id on public.usuarios_comercio (comercio_id);
create index idx_usuarios_comercio_active on public.usuarios_comercio (comercio_id, activo);

-- --------------------------------------------------------------------
-- TABLE: platform_admins (juanpis en MVP)
-- --------------------------------------------------------------------
create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------
-- HELPER FUNCTIONS (leen del JWT custom claims)
-- --------------------------------------------------------------------

-- Retorna el tenant_id (comercio_id) del JWT si el usuario es de un comercio.
-- Retorna NULL si es admin o no tiene comercio asignado.
create or replace function public.tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id',
      ''
    ),
    ''
  )::uuid
$$;

-- Retorna true si el usuario autenticado es platform admin.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb -> 'is_platform_admin')::boolean,
    false
  )
$$;

-- --------------------------------------------------------------------
-- CUSTOM ACCESS TOKEN HOOK
-- Poblará el JWT con tenant_id y is_platform_admin al login.
-- IMPORTANTE: después de aplicar esta migración, hay que activar este
-- hook desde el Dashboard de Supabase: Authentication → Hooks →
-- "Custom Access Token" → seleccionar `public.custom_access_token_hook`.
-- --------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_id_val uuid;
  comercio_id_val uuid;
  is_admin_val boolean;
begin
  user_id_val := (event ->> 'user_id')::uuid;
  claims := event -> 'claims';

  -- ¿Es platform admin?
  select exists (
    select 1 from public.platform_admins where user_id = user_id_val
  ) into is_admin_val;

  if is_admin_val then
    claims := jsonb_set(claims, '{is_platform_admin}', 'true'::jsonb);
  end if;

  -- ¿Pertenece a un Comercio? (busca el primero activo)
  select uc.comercio_id into comercio_id_val
  from public.usuarios_comercio uc
  where uc.user_id = user_id_val and uc.activo = true
  limit 1;

  if comercio_id_val is not null then
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(comercio_id_val::text));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Permisos requeridos para que Supabase Auth pueda invocar el hook.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
grant select on public.platform_admins to supabase_auth_admin;
grant select on public.usuarios_comercio to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon;

-- --------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- --------------------------------------------------------------------

-- comercios
alter table public.comercios enable row level security;

-- Mostrador/Cocina/Domiciliario ven SOLO su comercio.
-- Platform admin ve TODOS los comercios.
create policy comercios_select_own on public.comercios
  for select to authenticated
  using (
    id = public.tenant_id() or public.is_platform_admin()
  );

-- Solo Mostrador del comercio o platform_admin pueden actualizar.
create policy comercios_update on public.comercios
  for update to authenticated
  using (
    (id = public.tenant_id() and exists (
      select 1 from public.usuarios_comercio uc
      where uc.user_id = auth.uid()
        and uc.comercio_id = public.comercios.id
        and uc.rol = 'mostrador'
        and uc.activo = true
    )) or public.is_platform_admin()
  );

-- Solo platform_admin crea comercios (vía Story 1.5).
create policy comercios_insert_admin on public.comercios
  for insert to authenticated
  with check (public.is_platform_admin());

-- Solo platform_admin elimina (en práctica usamos toggle `activo`).
create policy comercios_delete_admin on public.comercios
  for delete to authenticated
  using (public.is_platform_admin());

-- usuarios_comercio
alter table public.usuarios_comercio enable row level security;

-- Cada usuario ve los miembros de su mismo comercio. Platform admin ve todos.
create policy usuarios_comercio_select on public.usuarios_comercio
  for select to authenticated
  using (
    comercio_id = public.tenant_id() or public.is_platform_admin()
  );

-- Mostrador puede crear/editar usuarios de su comercio (Story 1.7).
create policy usuarios_comercio_insert on public.usuarios_comercio
  for insert to authenticated
  with check (
    public.is_platform_admin() or (
      comercio_id = public.tenant_id() and exists (
        select 1 from public.usuarios_comercio uc
        where uc.user_id = auth.uid()
          and uc.comercio_id = public.usuarios_comercio.comercio_id
          and uc.rol = 'mostrador'
          and uc.activo = true
      )
    )
  );

create policy usuarios_comercio_update on public.usuarios_comercio
  for update to authenticated
  using (
    public.is_platform_admin() or (
      comercio_id = public.tenant_id() and exists (
        select 1 from public.usuarios_comercio uc
        where uc.user_id = auth.uid()
          and uc.comercio_id = public.usuarios_comercio.comercio_id
          and uc.rol = 'mostrador'
          and uc.activo = true
      )
    )
  );

-- platform_admins
alter table public.platform_admins enable row level security;

-- Solo platform_admins se ven a sí mismos.
create policy platform_admins_select_self on public.platform_admins
  for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

-- INSERT/UPDATE/DELETE solo via service_role (no policies para authenticated).
