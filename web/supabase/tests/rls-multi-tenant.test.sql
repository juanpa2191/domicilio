-- ====================================================================
-- TESTS DE MULTI-TENANCY RLS — Story 1.3
-- ====================================================================
-- Verifica aislamiento estricto entre Comercios:
--   - Un Mostrador del Comercio A NUNCA puede ver/modificar datos del Comercio B
--   - Un Cliente sin tenant_id no ve nada
--   - Un platform_admin ve y modifica todo
--
-- USO: ejecutar como service_role (vía Supabase SQL Editor o MCP).
--   1. Crea función temporal `public._test_rls_multitenancy()` que retorna
--      una tabla con resultados de cada test.
--   2. Ejecuta SELECT sobre esa función.
--   3. Borra la función al final.
--
-- Cada test usa `set local role to authenticated` + `set_config jwt.claims`
-- para impersonar diferentes usuarios sin necesidad de Auth real.
-- El cleanup borra los registros de prueba al final (DB queda intacta).
-- ====================================================================

create or replace function public._test_rls_multitenancy()
returns table(test_num int, name text, result text, details text)
language plpgsql
as $f$
declare
  comercio_a uuid;
  comercio_b uuid;
  test_user_a uuid := '11111111-1111-1111-1111-111111111111';
  test_cliente uuid := '33333333-3333-3333-3333-333333333333';
  test_admin uuid := '44444444-4444-4444-4444-444444444444';
  cnt int;
begin
  -- ===== SETUP =====
  insert into public.comercios (nombre, direccion) values ('Comercio A', 'Calle A 1') returning id into comercio_a;
  insert into public.comercios (nombre, direccion) values ('Comercio B', 'Calle B 2') returning id into comercio_b;

  -- ===== TESTS COMO MOSTRADOR DE COMERCIO A =====
  set local role to authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', test_user_a::text, 'tenant_id', comercio_a::text)::text, true);

  -- TEST 1: NO ve Comercio B
  select count(*) into cnt from public.comercios where id = comercio_b;
  return query select 1, 'Mostrador A NO ve Comercio B'::text,
    case when cnt = 0 then '✅ PASS' else '❌ FAIL' end::text,
    format('rows=%s (esperado 0)', cnt);

  -- TEST 2: SÍ ve su Comercio A
  select count(*) into cnt from public.comercios where id = comercio_a;
  return query select 2, 'Mostrador A SÍ ve Comercio A'::text,
    case when cnt = 1 then '✅ PASS' else '❌ FAIL' end::text,
    format('rows=%s (esperado 1)', cnt);

  -- TEST 3: Búsqueda general no expone B
  select count(*) into cnt from public.comercios where nombre = 'Comercio B';
  return query select 3, 'Búsqueda general NO expone Comercio B'::text,
    case when cnt = 0 then '✅ PASS' else '❌ FAIL' end::text,
    format('rows=%s (esperado 0)', cnt);

  -- ===== TEST COMO CLIENTE SIN COMERCIO =====
  reset role;
  set local role to authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', test_cliente::text)::text, true);

  -- TEST 4: Cliente sin tenant_id no ve comercios
  select count(*) into cnt from public.comercios;
  return query select 4, 'Cliente sin tenant_id NO ve Comercios'::text,
    case when cnt = 0 then '✅ PASS' else '❌ FAIL' end::text,
    format('rows=%s (esperado 0)', cnt);

  -- ===== TESTS DE OPERACIONES BLOQUEADAS PARA MOSTRADOR =====
  reset role;
  set local role to authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', test_user_a::text, 'tenant_id', comercio_a::text)::text, true);

  -- TEST 5: Mostrador no puede INSERT (solo admin)
  begin
    insert into public.comercios (nombre, direccion) values ('Hackeado', 'X');
    return query select 5, 'Mostrador A BLOQUEADO al INSERT Comercio'::text,
      '❌ FAIL'::text, 'INSERT funcionó (RLS violado)'::text;
  exception when others then
    return query select 5, 'Mostrador A BLOQUEADO al INSERT Comercio'::text,
      '✅ PASS'::text, format('Bloqueado (sqlstate=%s)', sqlstate);
  end;

  -- TEST 6: Mostrador no puede UPDATE Comercio B
  update public.comercios set nombre = 'HACKEADO' where id = comercio_b;
  get diagnostics cnt = row_count;
  return query select 6, 'UPDATE Comercio B desde Mostrador A BLOQUEADO'::text,
    case when cnt = 0 then '✅ PASS' else '❌ FAIL' end::text,
    format('rows actualizados=%s (esperado 0)', cnt);

  -- TEST 7: Mostrador no puede DELETE
  delete from public.comercios where id = comercio_a;
  get diagnostics cnt = row_count;
  return query select 7, 'DELETE Comercio desde Mostrador BLOQUEADO'::text,
    case when cnt = 0 then '✅ PASS' else '❌ FAIL' end::text,
    format('rows borrados=%s (esperado 0)', cnt);

  -- ===== HELPER FUNCTIONS =====
  -- TEST 8: tenant_id() lee correctamente del JWT
  return query select 8, 'tenant_id() retorna comercio_a para Mostrador A'::text,
    case when public.tenant_id() = comercio_a then '✅ PASS' else '❌ FAIL' end::text,
    format('tenant_id()=%s', public.tenant_id());

  -- TEST 9: is_platform_admin() = false para Mostrador
  return query select 9, 'is_platform_admin() = false para Mostrador'::text,
    case when not public.is_platform_admin() then '✅ PASS' else '❌ FAIL' end::text,
    format('is_platform_admin()=%s', public.is_platform_admin());

  -- ===== TESTS COMO PLATFORM ADMIN =====
  reset role;
  set local role to authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', test_admin::text, 'is_platform_admin', true)::text, true);

  -- TEST 10: Admin ve TODOS los comercios
  select count(*) into cnt from public.comercios where id in (comercio_a, comercio_b);
  return query select 10, 'Admin SÍ ve Comercios A y B'::text,
    case when cnt = 2 then '✅ PASS' else '❌ FAIL' end::text,
    format('rows=%s (esperado 2)', cnt);

  -- TEST 11: Admin puede INSERT
  begin
    insert into public.comercios (nombre, direccion) values ('Admin Created', 'Z');
    return query select 11, 'Admin SÍ puede INSERT Comercio'::text,
      '✅ PASS'::text, 'INSERT exitoso'::text;
  exception when others then
    return query select 11, 'Admin SÍ puede INSERT Comercio'::text,
      '❌ FAIL'::text, format('Error: %s', sqlerrm);
  end;

  -- TEST 12: is_platform_admin() = true
  return query select 12, 'is_platform_admin() = true con claim'::text,
    case when public.is_platform_admin() then '✅ PASS' else '❌ FAIL' end::text,
    format('is_platform_admin()=%s', public.is_platform_admin());

  reset role;

  -- ===== CLEANUP =====
  delete from public.comercios where nombre in ('Comercio A', 'Comercio B', 'Hackeado', 'HACKEADO', 'Admin Created');
end;
$f$;

-- Ejecutar:
select * from public._test_rls_multitenancy();

-- Limpiar la función después:
drop function public._test_rls_multitenancy();
