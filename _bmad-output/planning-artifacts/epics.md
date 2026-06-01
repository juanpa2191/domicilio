---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-05-30'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-domicilio-app-2026-05-30/prd.md
  - _bmad-output/planning-artifacts/prds/prd-domicilio-app-2026-05-30/addendum.md
  - _bmad-output/planning-artifacts/prds/prd-domicilio-app-2026-05-30/.decision-log.md
  - _bmad-output/planning-artifacts/ux-designs/ux-domicilio-app-2026-05-30/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-domicilio-app-2026-05-30/EXPERIENCE.md
  - _bmad-output/planning-artifacts/architecture.md
---

# Domicilios Norte Aburrá - Epic Breakdown

## Overview

Este documento provee el desglose completo de épicas e historias para **Domicilios Norte Aburrá**, descomponiendo los 28 FRs efectivos del MVP (post D-20), NFRs cross-cutting, decisiones técnicas y requerimientos de UX en historias implementables.

**Scope MVP:** 28 FRs activos (FR-1 a FR-25 + FR-30 a FR-32). Diferidos a Fase 2 per D-20: FR-26 a FR-29 (Vista Domiciliario completa), Push notifications reales (FR-21 reemplazado por polling), Modo offline.

## Requirements Inventory

### Functional Requirements

**Surface: Autenticación y Cuentas (§4.1 PRD)**
- **FR-1:** El Cliente puede crear una cuenta proporcionando nombre y celular; recibe OTP de 6 dígitos por SMS; lo ingresa para confirmar.
- **FR-2:** El Cliente puede iniciar sesión proporcionando su celular y recibe OTP por SMS.
- **FR-3:** Comercio nuevo es creado por el admin de la plataforma (email, nombre, dirección, persona contacto). Genera contraseña temporal.
- **FR-4:** Un Comercio puede tener usuarios con 3 roles: Mostrador (acceso completo), Cocina (solo Tiquetes), Domiciliario (solo entregas asignadas). El Mostrador puede crear usuarios Cocina y Domiciliario.

**Surface: Catálogo del Comercio (§4.2 PRD)**
- **FR-5:** El rol Mostrador puede crear/editar producto con: nombre (obligatorio), precio (obligatorio), descripción opcional (200 char), foto opcional (JPG/PNG, 2MB).
- **FR-6:** El rol Mostrador puede agregar Adiciones Estructuradas por producto (nombre + precio adicional).
- **FR-7:** El rol Mostrador puede marcar productos como "no disponible hoy" sin borrarlos.

**Surface: Toma de Pedido — Cliente (§4.3 PRD)**
- **FR-8:** El Cliente ve listado de Comercios disponibles ordenado por proximidad/relevancia, con nombre, foto, estado (abierto/cerrado), tiempo estimado.
- **FR-9:** El Cliente puede agregar productos al carrito con cantidad y Adiciones Estructuradas. Sin mezclar productos de 2 Comercios.
- **FR-10:** Al confirmar carrito, el Cliente puede agregar UNA Adición Libre (texto libre, max 280 caracteres).
- **FR-11:** El Cliente elige Modalidad: `domicilio` (con dirección) o `recoger_en_local` (sin dirección).
- **FR-12:** El Cliente ve resumen del Pedido y elige forma de pago según Modalidad. Pedido pasa a `pendiente_pago` o `validando_pago`.
- **FR-13:** El Cliente sube Comprobante de Pago (JPG/PNG hasta 5MB). El Pedido pasa a `validando_pago`.

**Surface: Gestión del Pedido — Mostrador (§4.4 PRD, CORAZÓN)**
- **FR-14:** Rol Mostrador ve Cola FIFO de Pedidos no completados, ordenada por timestamp ASC. Pedido nuevo dispara alerta sonora + visual + slide-in. Orden NO cambia por interacción.
- **FR-15:** Para Pedidos `validando_pago`, el Mostrador ve Comprobante subido y puede "Confirmar pago" (1 tap) o "Rechazar pago" (2 taps + motivo 140 char).
- **FR-16:** El Mostrador puede cambiar Estado: `en_cocina` → `listo`, `listo` → `en_domicilio` (con asignación de Domiciliario), `en_domicilio` → `entregado`, cualquier → `cancelado`.
- **FR-17:** El Mostrador puede cerrar el Comercio temporalmente con un toggle.

**Surface: Vista Cocina (§4.5 PRD, CORAZÓN — simplificada per D-20)**
- **FR-18:** Rol Cocina ve lista vertical de Tiquetes activos (Estado `en_cocina`) con items, Adición Libre, hora del Pedido, Modalidad. Sin precio ni datos del Cliente.
- **FR-19:** El rol Cocina puede tap en Tiquete → modal "¿Listo?" → confirmar → Pedido pasa a `listo`, Tiquete desaparece, Mostrador recibe alerta.
- **FR-20:** Vista Cocina se auto-refresca cada 10s (vía Realtime + polling fallback).

**Surface: Comunicación de Estado (§4.6 PRD, simplificada per D-20)**
- **FR-21:** ~~Cada cambio de Estado dispara push notification al Cliente.~~ → **REEMPLAZADO en MVP por polling cada 10s** al endpoint `/api/pedidos/[id]/estado`.
- **FR-22:** El Cliente ve pantalla "Mi pedido" con estado actual, tiempo transcurrido, items, Comercio, forma de pago. Máximo 3 Pedidos activos simultáneos.

**Surface: Configuración del Comercio (§4.7 PRD)**
- **FR-23:** El Mostrador puede editar info básica del Comercio (nombre, dirección, horario, foto principal).
- **FR-24:** El Mostrador configura formas de pago: Nequi (celular), Bancolombia (cuenta + tipo), Daviplata (celular), Efectivo al recibir (toggle), Pago en local (toggle).
- **FR-25:** El Mostrador puede crear/editar/desactivar Domiciliarios (nombre, celular, email, contraseña).

**🚫 DIFERIDOS A FASE 2 (per D-20):**
- ~~**FR-26:** Login del Domiciliario.~~
- ~~**FR-27:** Lista de Entregas Asignadas (vista Domiciliario).~~
- ~~**FR-28:** Marcar Pedido como Entregado (Domiciliario).~~
- ~~**FR-29:** Asignación de Pedidos al Domiciliario (Mostrador → vista Domiciliario).~~

**Surface: Administración (§4.9 PRD, renumerado)**
- **FR-30:** El admin puede crear cuenta de Comercio (nombre, email, dirección, fecha inicio gratis). Envía email con instrucciones de primer login.
- **FR-31:** El admin ve tabla de Comercios: estado, fecha inicio/fin gratis, estado pago suscripción.
- **FR-32:** El admin ve métricas agregadas por Comercio: número Pedidos 7/30 días, valor total transado, Pedidos cancelados.

### NonFunctional Requirements

**NFR-1 (Performance):** Carga inicial de páginas críticas (catálogo, confirmar pedido) en <2 segundos en 4G.
**NFR-2 (Performance):** Cola FIFO Mostrador actualiza en tiempo real (<5 segundos de latencia desde creación del Pedido).
**NFR-3 (Performance):** Vista Cocina refresh <10 segundos (Realtime con polling fallback).
**NFR-4 (Privacidad):** Consentimiento explícito del Cliente al registrarse (checkbox + link a política de privacidad).
**NFR-5 (Privacidad):** Cliente puede solicitar eliminación de datos (manual vía email a soporte en MVP).
**NFR-6 (Privacidad):** Comprobantes de pago cifrados en reposo, eliminados después de 30 días.
**NFR-7 (Privacidad):** Política de privacidad accesible desde la app en todo momento.
**NFR-8 (Seguridad):** Comunicaciones HTTPS exclusivamente.
**NFR-9 (Seguridad):** Contraseñas almacenadas con hash bcrypt (Supabase Auth default).
**NFR-10 (Seguridad):** Tokens de sesión expiran tras 90 días de inactividad.
**NFR-11 (Seguridad):** Rate limiting en endpoints OTP y login (Upstash Ratelimit).
**NFR-12 (Confiabilidad):** Backups diarios de la base de datos (Supabase Pro).
**NFR-13 (Confiabilidad):** Restauración prioridad vista Mostrador (es donde el Comercio sufre directo).
**NFR-14 (Confiabilidad):** Logs de errores accesibles via Sentry.
**NFR-15 (Cost):** Hosting + servicios <$100.000 COP/mes con 1-3 comercios en MVP.
**NFR-16 (Cost):** Escalar a 25 comercios no debe exceder $500.000 COP/mes.

### Additional Requirements

**Setup técnico inicial (de Architecture):**
- Proyecto creado con `npx create-next-app@latest -e with-supabase` (starter oficial Supabase)
- shadcn/ui inicializado + componentes core instalados (button, card, dialog, input, form, label, select, badge, dropdown-menu, sheet, skeleton, table, tabs, toast, avatar, separator)
- Supabase CLI instalado y entorno local corriendo (`npx supabase init && npx supabase start`)

**Infraestructura backend (Supabase):**
- Schema SQL inicial versionado en `supabase/migrations/`
- RLS policies activadas con `auth.jwt() ->> 'tenant_id'` (custom claim, NO subqueries)
- Custom JWT claim `tenant_id` configurado en Supabase Auth Hooks
- pgtap tests para multi-tenancy isolation (Cliente A no ve datos Cliente B)
- Tabla `payment_audit` inmutable (SHA-256 hash de comprobante, quién validó, cuándo)
- Columna `sequence_number` (bigserial) en `pedidos` para FIFO determinista
- Buckets Storage: público (fotos productos) + privado (comprobantes con signed URLs + lifecycle 30d)
- Supabase Realtime canal-per-comercio (`comercio:${id}`, `cocina:${id}`)

**Integraciones externas:**
- LabsMobile (SMS OTP primario, ~$50 COP/SMS) con Twilio fallback (feature flag)
- Upstash Ratelimit (Redis serverless) en OTP y login
- Sentry (error tracking + performance + tags por action)
- Vercel hosting + analytics + preview deploys por PR

**Boundaries arquitectónicos:**
- `lib/domicilios/*` (lógica de negocio) NO importa `lib/supabase/*` directamente (lock-in mitigation)
- Server Actions retornan `ActionResult<T>` (discriminated union) uniformemente
- Zod schemas en `lib/domicilios/schemas/` compartidos entre client y server
- Spanish para dominio (`Pedido`, `Comercio`), English para infra

**Routing y URLs:**
- Next.js App Router SIN route groups (sin paréntesis)
- URLs explícitas: `/cliente/*`, `/mostrador/*`, `/cocina`, `/admin/*`

**Polling para estado del Cliente (reemplaza Push en MVP):**
- Endpoint `/api/pedidos/[id]/estado` (Route Handler)
- TanStack Query con `refetchInterval: 10000` en vista `/cliente/mis-pedidos/[pedidoId]`

**Cobro de suscripción:**
- Manual fuera de app en MVP (juanpis cobra al comercio cada mes, sin pasarela)

### UX Design Requirements

**UX-DR1 (DESIGN.md Colors):** Implementar paleta brand con primary `#F97316` (naranja Tailwind 500), accent `#FFF7ED`, y 6 status colors semánticos por Estado del Pedido (pending, cooking, ready, delivering, delivered, cancelled). Todos los otros tokens heredan shadcn defaults.

**UX-DR2 (DESIGN.md Typography):** Tipografía Geist Sans para body/label/caption (shadcn default). Display 28-42px para empty states/headers. Custom `cocina-title` (32px) y `cocina-body` (20px) para Vista Cocina (legibilidad desde 2-3m).

**UX-DR3 (DESIGN.md Components):** Componentes custom — `pedido-card` (Card Cola FIFO), `pedido-card-nuevo` (variante destacada con border naranja + slide-in 300ms), `status-badge` (píldoras pequeñas por Estado), `tiquete-cocina` (Card grande para vista Cocina con border 2px).

**UX-DR4 (DESIGN.md Layouts):** Layout responsive por surface — Cliente single-column max-w-md, Mostrador two-column landscape (Cola 60% + Detalle 40%), Cocina grid 2-3 columnas, Admin centrado max-w-5xl. Modo claro solo (dark mode Fase 2).

**UX-DR5 (DESIGN.md Animations):** Animación slide-in al `pedido-card-nuevo` (300ms ease-out) + alerta sonora. Después de 5s transition a card normal. Respetar `prefers-reduced-motion`.

**UX-DR6 (EXPERIENCE.md IA):** Navegación por surface — Cliente bottom tab bar (Home / Mis Pedidos / Cuenta), Mostrador sidebar persistente (Pedidos / Catálogo / Domiciliarios / Configuración), Cocina sin nav (vista única), Domiciliario sin nav (lista + detalle — DIFERIDO Fase 2), Admin sidebar tradicional.

**UX-DR7 (EXPERIENCE.md Voice/Tone):** Microcopy cercana, directa, trato de "tú". Mensajes específicos por cambio de Estado del Pedido ("Listo, Don Luis recibió tu pedido", "Tu pedido salió a domicilio") definidos en tabla de EXPERIENCE.md §Voice/Tone.

**UX-DR8 (EXPERIENCE.md State Patterns):** Estados visuales universales — Skeleton para loading inicial, Spinner en botones para action in progress, Empty state con copy amigable + emoji opcional, Toast persistente para error red con botón Reintentar, Toast efímero verde para éxito (auto-dismiss 3s).

**UX-DR9 (EXPERIENCE.md Interaction Primitives):** Stepper +/- para cantidad de productos, Checkbox para Adiciones Estructuradas, Radio buttons grandes para Modalidad (no select), drag-and-drop / cámara para Comprobante con preview antes de confirmar.

**UX-DR10 (EXPERIENCE.md Accessibility):** Cumplimiento WCAG 2.1 AA — contraste ≥4.5:1 texto normal o ≥3:1 grande, touch targets mínimo 44x44px (Cocina 80px+, Domiciliario 64px+), foco visible shadcn ring, navegación por teclado con tab order lógico, screen readers con aria-label y anuncios de cambios de estado, `<html lang="es">`, zoom hasta 200% sin pérdida de funcionalidad.

**UX-DR11 (EXPERIENCE.md Microcopy específica):** Implementar tabla completa de mensajes push/in-app por cambio de Estado del Pedido — 7 transiciones de estado con copy específico cada una (definidas en EXPERIENCE.md §Voice and Tone tabla).

**UX-DR12 (EXPERIENCE.md Asymmetric Actions):** Confirmar Pago = 1 tap (happy path rápido). Rechazar Pago = 2 taps (input motivo + botón enviar). Asimetría intencional para evitar errores destructivos en hora pico.

**UX-DR13 (EXPERIENCE.md Optimistic UI):** Acciones críticas (validar pago, confirmar pedido) NO optimistic — esperar confirmación servidor con spinner. Acciones operativas (cambiar Estado, marcar listo) sí optimistic con rollback si servidor falla.

### FR Coverage Map

| FR | Epic | Descripción breve |
|---|---|---|
| FR-1 | Epic 3 | Registro Cliente OTP |
| FR-2 | Epic 3 | Login Cliente OTP |
| FR-3 | Epic 1 | Crear cuenta Comercio (admin) |
| FR-4 | Epic 1 | Roles dentro del Comercio |
| FR-5 | Epic 2 | Crear/editar producto |
| FR-6 | Epic 2 | Adiciones Estructuradas |
| FR-7 | Epic 2 | Disponibilidad on/off |
| FR-8 | Epic 3 | Navegar comercios |
| FR-9 | Epic 3 | Agregar productos al carrito |
| FR-10 | Epic 3 | Adición Libre |
| FR-11 | Epic 3 | Selección Modalidad |
| FR-12 | Epic 3 | Confirmar Pedido + forma pago |
| FR-13 | Epic 3 | Subir Comprobante |
| FR-14 | Epic 4 | Cola FIFO |
| FR-15 | Epic 4 | Validar Comprobante |
| FR-16 | Epic 4 | Cambio Estado Mostrador |
| FR-17 | Epic 2 | Modo Cerrado temporalmente |
| FR-18 | Epic 5 | Lista Tiquetes Cocina |
| FR-19 | Epic 5 | Marcar Tiquete Listo |
| FR-20 | Epic 5 | Auto-refresh Cocina |
| FR-21 | Epic 6 | Polling estado Cliente (reemplaza Push MVP) |
| FR-22 | Epic 6 | Vista seguimiento Pedido |
| FR-23 | Epic 2 | Editar info Comercio |
| FR-24 | Epic 2 | Configurar formas de pago |
| FR-25 | Epic 2 | Gestionar Domiciliarios |
| FR-30 | Epic 1 | Admin crear Comercio |
| FR-31 | Epic 1 | Admin vista Comercios |
| FR-32 | Epic 6 | Admin métricas básicas |

**Cobertura: 28/28 FRs MVP** (FR-26 a FR-29 diferidos a Fase 2 per D-20).

## Epic List

### Epic 1: Foundation, Auth & Onboarding de Comercios
El admin (juanpis) puede crear cuentas de Comercio. El Mostrador puede entrar a la app con su contraseña temporal. La aplicación tiene cimientos técnicos sólidos (DB con multi-tenancy, deploy automático, monitoring, política de privacidad básica).
**FRs covered:** FR-3, FR-4, FR-30, FR-31

### Epic 2: Configuración del Comercio
El Mostrador configura su Catálogo de productos (con fotos, adiciones, disponibilidad), su información básica (horario, dirección), sus formas de pago (Nequi, Bancolombia, Daviplata, efectivo) y su lista de Domiciliarios.
**FRs covered:** FR-5, FR-6, FR-7, FR-17, FR-23, FR-24, FR-25

### Epic 3: Toma de Pedido del Cliente
El Cliente se registra con OTP por SMS, navega los Comercios disponibles, arma su pedido (carrito + Adiciones Estructuradas + Adición Libre), elige Modalidad (domicilio o pickup), elige forma de pago y sube comprobante de transferencia (o confirma efectivo).
**FRs covered:** FR-1, FR-2, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13

### Epic 4: Gestión del Pedido — Mostrador (CORAZÓN)
El Mostrador ve la Cola FIFO de Pedidos entrantes, valida los comprobantes de pago (1 tap confirmar, 2 taps rechazar con motivo), avanza los estados del Pedido (en_cocina → listo → en_domicilio → entregado), y cancela si necesario.
**FRs covered:** FR-14, FR-15, FR-16

### Epic 5: Vista Cocina (CORAZÓN)
El rol Cocina ve los Tiquetes activos en lista vertical (sin precio ni datos del Cliente), marca listo con confirmación (2 taps deliberados), y el Tiquete desaparece de su vista mientras alerta al Mostrador.
**FRs covered:** FR-18, FR-19, FR-20

### Epic 6: Visibilidad — Cliente + Admin
El Cliente ve el estado de su Pedido en tiempo real (vía polling cada 10s) con mensajes amigables. El admin ve métricas operacionales agregadas por Comercio para reportar valor al comerciante.
**FRs covered:** FR-21, FR-22, FR-32

---

## Epic 1: Foundation, Auth & Onboarding de Comercios

El admin (juanpis) puede crear cuentas de Comercio, listarlas y gestionar suscripciones. El Mostrador puede iniciar sesión con su contraseña temporal. La aplicación tiene cimientos técnicos sólidos: PWA Next.js + Supabase, multi-tenancy con RLS, monitoring con Sentry, deploy en Vercel y política de privacidad básica.

### Story 1.1: Setup inicial del proyecto

As a **desarrollador (juanpis)**,
I want **un proyecto Next.js + Supabase + shadcn/ui configurado con la estructura definida en architecture.md**,
So that **tengo cimientos técnicos sólidos para empezar a construir features sin reinventar setup**.

**Acceptance Criteria:**

**Given** el repositorio está vacío
**When** ejecuto `npx create-next-app@latest domicilios-norte-aburra -e with-supabase` y los comandos de setup definidos en architecture.md
**Then** el proyecto compila con `npm run dev` sin errores
**And** Supabase local corre en Docker (`npx supabase start`)
**And** shadcn/ui está inicializado con los 16 componentes core listados
**And** la estructura de carpetas sigue `architecture.md` (app/cliente, app/mostrador, app/cocina, app/admin, lib/domicilios, lib/supabase, lib/sms, supabase/migrations)
**And** Sentry está inicializado en `instrumentation.ts` con captureException helper en `lib/sentry.ts`
**And** el proyecto está desplegado en Vercel (preview deploys automáticos por PR) conectado a Supabase staging

### Story 1.2: Schema inicial de DB con multi-tenancy

As a **desarrollador**,
I want **el schema SQL inicial con tablas core (comercios, usuarios_comercio) y RLS activado con JWT custom claim**,
So that **toda query a la DB respeta el aislamiento multi-tenant desde el día 1**.

**Acceptance Criteria:**

**Given** Supabase local está corriendo
**When** aplico la migration `20260530000001_initial_schema.sql`
**Then** existen las tablas `comercios`, `usuarios_comercio` con UUIDs como PK, columnas `created_at`/`updated_at`, FK `comercio_id` correcta
**And** enums `rol_usuario` (`mostrador`, `cocina`, `domiciliario`, `admin`) y otros definidos en español snake_case
**And** RLS está enabled en todas las tablas
**And** policies usan `auth.jwt() ->> 'tenant_id'` (NO subqueries a tablas members)
**And** un Supabase Auth Hook poblara el JWT custom claim `tenant_id` al login (basado en el comercio_id del usuario_comercio)
**And** los tipos TypeScript regenerados con `npx supabase gen types typescript --local > types/supabase.ts`

### Story 1.3: Tests pgtap de multi-tenancy isolation

As a **desarrollador**,
I want **pgtap tests que verifican que un Comercio A no puede leer datos del Comercio B bajo ninguna circunstancia**,
So that **un bug futuro en RLS policies se detecte en CI antes de llegar a producción**.

**Acceptance Criteria:**

**Given** existen 2 comercios A y B con datos de prueba
**When** ejecuto `supabase test db` con los archivos pgtap en `supabase/tests/`
**Then** los tests verifican que el usuario del Comercio A no puede SELECT/UPDATE/DELETE registros del Comercio B
**And** los tests cubren cada tabla protegida por RLS (comercios, usuarios_comercio, y futuras)
**And** los tests pasan en CI vía GitHub Actions workflow `pgtap-tests.yml`

### Story 1.4: Helpers Supabase + middleware + rate limiting

As a **desarrollador**,
I want **los helpers Supabase verificados (server, client, middleware) y rate limiting Upstash configurado**,
So that **las Server Actions y la auth funcionan en Server Components y endpoints sensibles están protegidos**.

**Acceptance Criteria:**

**Given** el starter creó los archivos `lib/supabase/{server,client,middleware}.ts`
**When** invoco `createClient()` desde un Server Component
**Then** la sesión del usuario se obtiene correctamente vía cookies
**And** el middleware `middleware.ts` refresca tokens automáticamente
**And** `lib/ratelimit.ts` exporta un Upstash Ratelimit configurado (10 req/min para OTP, 5 intentos/15min para login)
**And** los endpoints OTP rechazan con 429 cuando se excede el límite

### Story 1.5: Admin puede crear un Comercio (FR-30)

As an **admin (juanpis)**,
I want **una página `/admin/comercios/nuevo` donde puedo crear un nuevo Comercio con nombre, email del responsable, dirección, fecha inicio gratis**,
So that **puedo onboardear el primer Comercio piloto sin tener que hacer INSERT manual en SQL**.

**Acceptance Criteria:**

**Given** estoy autenticado como admin
**When** completo el formulario en `/admin/comercios/nuevo` con datos válidos y envío
**Then** se crea un registro en la tabla `comercios` con `fecha_inicio_gratis = today` y `fecha_fin_gratis = today + 60 días`
**And** se crea un usuario_comercio con rol `mostrador`, contraseña temporal generada, vinculado al comercio
**And** se dispara email al responsable con instrucciones de primer login (Supabase Auth invite o similar)
**And** vuelvo a `/admin/comercios` con toast de éxito

### Story 1.6: Admin lista Comercios con estado suscripción (FR-31)

As an **admin**,
I want **una página `/admin/comercios` con tabla de todos los Comercios mostrando nombre, estado activo/inactivo, fecha inicio/fin gratis y estado pago suscripción**,
So that **veo cuáles comercios siguen en prueba y cuáles ya entraron en pago**.

**Acceptance Criteria:**

**Given** estoy autenticado como admin y existen N Comercios
**When** navego a `/admin/comercios`
**Then** veo tabla con columnas: Nombre, Estado (activo/inactivo), Fecha inicio gratis, Fecha fin gratis, Estado pago suscripción (al día/pendiente/atrasado)
**And** puedo hacer click en un Comercio para ver detalle
**And** puedo desactivar un Comercio (cambio campo `activo` = false) desde la tabla con confirmación

### Story 1.7: Mostrador login + crear usuarios adicionales del Comercio (FR-3, FR-4)

As a **Mostrador del Comercio**,
I want **iniciar sesión con mi email y contraseña temporal, cambiarla, y crear usuarios Cocina/Domiciliario para mi Comercio**,
So that **puedo dar acceso a mis empleados con permisos limitados**.

**Acceptance Criteria:**

**Given** el admin creó mi cuenta con contraseña temporal
**When** voy a `/auth/login`, ingreso email + contraseña temporal
**Then** soy redirigido a una pantalla de cambio obligatorio de contraseña
**And** tras cambiarla soy redirigido a `/mostrador` (Cola FIFO vacía)
**And** desde `/mostrador/configuracion/usuarios` puedo crear un usuario_comercio adicional con rol `cocina` o `domiciliario`, nombre, email, contraseña generada
**And** ese usuario solo puede acceder a su vista correspondiente (Cocina o vista futura Domiciliario en Fase 2)
**And** RLS impide que Mostrador, Cocina o Domiciliario vean datos de otro Comercio

### Story 1.8: Política de privacidad y consentimiento Habeas Data

As a **Cliente**,
I want **leer la política de privacidad y dar consentimiento explícito al registrarme**,
So that **el producto cumple con la Ley 1581 de Colombia (Habeas Data)**.

**Acceptance Criteria:**

**Given** estoy en cualquier página de la app
**When** navego a `/cliente/cuenta/privacidad`
**Then** veo la política de privacidad completa redactada
**And** el formulario de registro (Story 3.2) tiene un checkbox NO pre-marcado "Acepto la política de privacidad" con link a esta página
**And** sin marcar el checkbox no se permite completar el registro

---

## Epic 2: Configuración del Comercio

El Mostrador configura su tienda virtual: información básica, horarios, formas de pago aceptadas, Catálogo de productos con fotos y Adiciones Estructuradas, gestión de disponibilidad, y lista de Domiciliarios (datos básicos para tener a mano).

### Story 2.1: Editar información básica del Comercio (FR-23)

As a **Mostrador**,
I want **editar el nombre, dirección, horario y foto principal de mi Comercio**,
So that **los clientes ven información correcta y actualizada al pedirme**.

**Acceptance Criteria:**

**Given** estoy autenticado como Mostrador
**When** voy a `/mostrador/configuracion` y edito los campos
**Then** los cambios se reflejan en la app del Cliente en menos de 60 segundos
**And** fuera del horario configurado, el Comercio aparece como "cerrado" automáticamente en la lista del Cliente
**And** la foto se sube a Supabase Storage (bucket público) con compresión vía `next/image`

### Story 2.2: Configurar formas de pago aceptadas (FR-24)

As a **Mostrador**,
I want **activar/desactivar y configurar las formas de pago (Nequi, Bancolombia, Daviplata, efectivo al recibir, pago en local)**,
So that **el Cliente solo ve opciones que yo realmente acepto**.

**Acceptance Criteria:**

**Given** estoy en `/mostrador/configuracion/pagos`
**When** activo Nequi e ingreso mi número de celular
**Then** se valida el formato del número (10 dígitos)
**And** Nequi aparece como opción en el checkout del Cliente
**And** debe haber mínimo 1 forma de pago activa para que el Comercio reciba pedidos (validación bloquea desactivar la última)
**And** los toggles "efectivo al recibir" y "pago en local" no requieren datos adicionales

### Story 2.3: Crear/editar producto del Catálogo con foto (FR-5)

As a **Mostrador**,
I want **crear y editar productos en mi Catálogo con nombre, precio, descripción opcional y foto opcional**,
So that **mi menú está disponible para que los clientes pidan**.

**Acceptance Criteria:**

**Given** estoy en `/mostrador/catalogo/productos/nuevo` o `[productoId]`
**When** completo nombre (obligatorio), precio en COP (obligatorio, entero), descripción (opcional, max 200 char), foto (opcional, JPG/PNG hasta 2MB)
**Then** el producto se guarda en tabla `productos` con `comercio_id` automático del usuario
**And** la foto se sube a Supabase Storage bucket público con URL pública
**And** productos sin foto se muestran con placeholder en `/cliente/comercios/[id]`
**And** los cambios se reflejan en la app del Cliente en menos de 60 segundos

### Story 2.4: Adiciones Estructuradas por producto (FR-6)

As a **Mostrador**,
I want **agregar Adiciones Estructuradas (nombre + precio adicional) a cada producto**,
So that **los clientes pueden personalizar su pedido con opciones predefinidas (ej: "Extra queso +$2.000")**.

**Acceptance Criteria:**

**Given** estoy editando un producto
**When** agrego una Adición con nombre "Extra queso" y precio adicional 2000
**Then** se guarda en tabla `adiciones_estructuradas` con `producto_id` correcto
**And** el Cliente ve la Adición como checkbox en el carrito con su precio
**And** puedo eliminar/editar Adiciones existentes
**And** un producto puede tener 0 a N Adiciones

### Story 2.5: Toggle disponibilidad on/off de producto (FR-7)

As a **Mostrador**,
I want **marcar un producto como "no disponible hoy" sin borrarlo**,
So that **no tengo que recrearlo mañana si me quedo sin ingredientes hoy**.

**Acceptance Criteria:**

**Given** un producto existe en mi Catálogo
**When** toggleo su disponibilidad off
**Then** el producto desaparece de la app del Cliente en menos de 60 segundos
**And** sigue visible en mi vista de Catálogo pero marcado visualmente como "no disponible"
**And** puedo reactivarlo en cualquier momento

### Story 2.6: Modo Cerrado temporalmente del Comercio (FR-17)

As a **Mostrador**,
I want **cerrar mi Comercio temporalmente con un toggle**,
So that **puedo descansar, atender una emergencia o cerrar por saturación sin desconfigurar horarios**.

**Acceptance Criteria:**

**Given** mi Comercio está abierto
**When** toggleo "Cerrado temporalmente" en `/mostrador/configuracion`
**Then** la app del Cliente muestra mi Comercio como cerrado y no permite nuevos Pedidos
**And** los Pedidos ya en curso siguen su flujo normal (no se cancelan automáticamente)
**And** puedo reactivar el toggle en cualquier momento

### Story 2.7: Gestión de Domiciliarios — datos básicos (FR-25)

As a **Mostrador**,
I want **crear, editar y desactivar Domiciliarios con nombre, celular, email**,
So that **tengo sus datos a mano para coordinar entregas (sin app del Domiciliario en MVP, coordinación por WhatsApp/llamada)**.

**Acceptance Criteria:**

**Given** estoy en `/mostrador/domiciliarios`
**When** creo un Domiciliario con nombre, celular y email
**Then** se guarda en tabla `domiciliarios` con `comercio_id` automático
**And** queda disponible en el dropdown de "Asignar Domiciliario" al cambiar estado de Pedido (Story 4.5)
**And** puedo desactivar un Domiciliario sin borrarlo (deja de aparecer en dropdown)
**And** no puedo borrar un Domiciliario que tenga Pedidos activos asignados

---

## Epic 3: Toma de Pedido del Cliente

El Cliente se registra/inicia sesión con OTP por SMS (LabsMobile primario, Twilio fallback), navega los Comercios disponibles en Barbosa, arma su Pedido con productos + Adiciones Estructuradas + Adición Libre, elige Modalidad (domicilio o pickup), confirma con forma de pago y sube comprobante de transferencia (o confirma efectivo).

### Story 3.1: Abstracción lib/sms con LabsMobile + Twilio fallback

As a **desarrollador**,
I want **una abstracción `lib/sms/*` con interfaz SmsProvider e implementaciones LabsMobile (primario) y Twilio (fallback)**,
So that **puedo cambiar de proveedor por feature flag sin reescribir lógica de envío de OTP**.

**Acceptance Criteria:**

**Given** existen las credenciales de LabsMobile y Twilio en env vars
**When** llamo `sendOTP(celular)` desde `lib/sms/send-otp.ts`
**Then** envía el OTP via LabsMobile por defecto
**And** si LabsMobile responde error o feature flag `USE_TWILIO=true`, hace fallback automático a Twilio
**And** el costo y proveedor usado se loggea (sin loggear el OTP en sí)
**And** se respeta el rate limiting de Upstash (Story 1.4)

### Story 3.2: Registro y Login del Cliente con OTP (FR-1, FR-2)

As a **Cliente nuevo o existente**,
I want **registrarme con mi nombre + celular o iniciar sesión solo con mi celular, recibir un OTP por SMS y confirmarlo**,
So that **accedo a la app sin tener que recordar una contraseña**.

**Acceptance Criteria:**

**Given** estoy en `/auth/registro-cliente` o `/auth/login`
**When** ingreso un celular válido (10 dígitos colombianos) y nombre (solo registro)
**Then** la app envía OTP de 6 dígitos vía `lib/sms/send-otp.ts`
**And** soy redirigido a `/auth/verificar-otp` donde ingreso el código
**And** si el OTP es correcto, soy autenticado y redirigido a `/cliente`
**And** si el OTP expira (>5 min) o se ingresa mal 3 veces, debo solicitar uno nuevo
**And** la sesión persiste 90 días o hasta logout
**And** un mismo celular NO puede crear 2 cuentas (validación en registro)
**And** el formulario de registro tiene checkbox Habeas Data (Story 1.8)

### Story 3.3: Página principal del Cliente con lista de Comercios (FR-8)

As a **Cliente**,
I want **ver la lista de Comercios disponibles en mi pueblo con foto, nombre, estado (abierto/cerrado) y tiempo estimado**,
So that **puedo elegir dónde pedir**.

**Acceptance Criteria:**

**Given** estoy autenticado o como visitante público
**When** voy a `/cliente` (o `/` que es alias)
**Then** veo una lista de todos los Comercios activos (vertical, mobile-first)
**And** cada Comercio muestra: foto principal, nombre, estado, tiempo estimado de entrega
**And** Comercios cerrados (fuera de horario o toggle "Cerrado temporalmente") aparecen visualmente desactivados y no son clickeables para pedir
**And** la bottom tab nav muestra Home / Mis Pedidos / Cuenta

### Story 3.4: Vista de Catálogo del Comercio + Carrito (FR-9)

As a **Cliente**,
I want **abrir un Comercio, ver su Catálogo y agregar productos al carrito con cantidades y Adiciones Estructuradas**,
So that **armo mi pedido**.

**Acceptance Criteria:**

**Given** elegí un Comercio abierto
**When** voy a `/cliente/comercios/[comercioId]`
**Then** veo lista de productos disponibles con foto, nombre, precio
**And** al tap en un producto abro modal con Adiciones Estructuradas (checkboxes) y stepper de cantidad
**And** "Agregar al carrito" suma el producto + adiciones seleccionadas al carrito
**And** el carrito persiste entre sesiones hasta que se confirme o vacíe
**And** NO se pueden mezclar productos de 2 Comercios distintos (si tengo carrito de Comercio A y agrego de Comercio B, se me avisa "¿Vaciar carrito anterior?")

### Story 3.5: Adición Libre en pedido (FR-10)

As a **Cliente**,
I want **agregar un texto libre opcional al carrito (ej: "sin cebolla, doble arepa")**,
So that **personalizo cosas que no están en las Adiciones Estructuradas**.

**Acceptance Criteria:**

**Given** estoy en `/cliente/carrito`
**When** veo el campo de Adición Libre (textarea)
**Then** puedo escribir hasta 280 caracteres
**And** el contador de caracteres es visible cuando supero 200 (último 30%)
**And** el texto se guarda con el Pedido y se muestra textual al Comercio (sin parseo)

### Story 3.6: Selección de Modalidad y dirección (FR-11)

As a **Cliente**,
I want **elegir entre domicilio (con dirección) o pickup, y guardar mi dirección si elegí domicilio**,
So that **el Comercio sabe cómo entregarme**.

**Acceptance Criteria:**

**Given** estoy en checkout
**When** elijo Modalidad `domicilio`
**Then** debo seleccionar/agregar una dirección (texto libre + alias opcional)
**And** la dirección se guarda asociada a mi Cliente para próximos pedidos (tabla `direcciones_guardadas`)
**When** elijo Modalidad `recoger_en_local`
**Then** no necesito dirección, solo confirmar
**And** el precio del Pedido NO cambia entre modalidades (sin costo de domicilio explícito en MVP)

### Story 3.7: Checkout con forma de pago (FR-12)

As a **Cliente**,
I want **ver resumen del Pedido y elegir forma de pago según Modalidad**,
So that **confirmo mi pedido sabiendo cuánto pago y cómo**.

**Acceptance Criteria:**

**Given** completé carrito + Modalidad + dirección
**When** voy a confirmar
**Then** veo resumen: items con cantidades y adiciones, Adición Libre, total a pagar, Modalidad, dirección si aplica
**And** opciones de pago se filtran por Modalidad: `domicilio` muestra (Transferencia / Efectivo al recibir si está habilitado), `recoger_en_local` muestra (Transferencia / Pago en local si está habilitado)
**And** al confirmar el Pedido entra a Estado `pendiente_pago` (si paga transferencia) o `validando_pago` (efectivo)
**And** se guarda en tabla `pedidos` con `sequence_number bigserial`

### Story 3.8: Upload de Comprobante de Pago con bucket privado (FR-13)

As a **Cliente que pagué por transferencia**,
I want **ver los datos de transferencia del Comercio y subir el comprobante**,
So that **el Comercio puede validar mi pago**.

**Acceptance Criteria:**

**Given** confirmé Pedido con forma de pago `transferencia`
**When** voy a `/cliente/checkout/subir-comprobante`
**Then** veo los datos de pago del Comercio (Nequi/Bancolombia/Daviplata según lo configurado) destacados y copiables
**And** puedo subir imagen (JPG/PNG hasta 5MB) desde galería o cámara
**And** veo preview antes de confirmar
**And** al subir, la imagen va a Supabase Storage bucket PRIVADO con signed URL
**And** se crea registro en `comprobantes_pago` ligado al Pedido
**And** el Pedido pasa a Estado `validando_pago`
**And** veo pantalla "Esperando confirmación de [Comercio]" con animación sutil
**And** si cierro la app antes de subir, el Pedido queda en `pendiente_pago` 30 min y se cancela auto (cron job o lazy check)

---

## Epic 4: Gestión del Pedido — Mostrador (CORAZÓN)

El Mostrador ve la Cola FIFO de Pedidos entrantes en tiempo real, valida los comprobantes de pago con asimetría intencional (1 tap confirmar vs 2 taps rechazar con motivo), avanza estados del Pedido y asigna Domiciliarios al despachar.

### Story 4.1: Schema pedidos + sequence_number + Realtime setup

As a **desarrollador**,
I want **el schema de `pedidos`, `items_pedido`, `historial_estado`, `payment_audit` con sequence_number y Realtime habilitado en canal por comercio**,
So that **la Cola FIFO funciona con orden determinista bajo carga y los cambios se propagan en tiempo real**.

**Acceptance Criteria:**

**Given** existen migrations previas (1.2)
**When** aplico migrations `20260530000003_realtime_setup.sql` y `20260530000005_audit_table.sql`
**Then** existe tabla `pedidos` con `sequence_number bigserial`, `estado enum`, FK `cliente_id` y `comercio_id`, `adicion_libre`, timestamps
**And** existen `items_pedido` (con `precio_unitario_snapshot`, `adiciones_seleccionadas jsonb`) y `historial_estado` (append-only)
**And** existe `payment_audit` inmutable con `pedido_id`, `validador_id`, `accion` (confirmar/rechazar), `motivo`, `hash_comprobante_sha256`, `timestamp`
**And** Realtime publication incluye `pedidos` y `items_pedido` filtrados por `comercio_id`
**And** RLS policies + pgtap tests cubren las 4 tablas nuevas

### Story 4.2: Cola FIFO del Mostrador con realtime updates (FR-14)

As a **Mostrador**,
I want **ver mis Pedidos no completados en una Cola FIFO ordenada por sequence_number ASC, con actualización en tiempo real**,
So that **proceso pedidos en orden de llegada sin que se me pierdan en hora pico**.

**Acceptance Criteria:**

**Given** estoy autenticado como Mostrador en `/mostrador`
**When** entra un Pedido nuevo en mi Comercio
**Then** la card aparece al pie de la Cola con animación slide-in 300ms ease-out (UX-DR5)
**And** suena alerta sonora discreta (configurable on/off en configuración)
**And** la card tiene background `accent` naranja suave + border `primary` los primeros 5 segundos, después transición a card normal
**And** el orden NO cambia cuando hago click en un Pedido o cuando el Cliente envía actualización
**And** el orden NO cambia bajo carga concurrente (test con 2 pedidos creados en el mismo tick)
**And** la Cola muestra max 50 Pedidos (paginación si hay más)
**And** si pierdo conexión WS, hago fallback a polling cada 10s

### Story 4.3: Vista de detalle del Pedido + ver Comprobante (FR-15 setup)

As a **Mostrador**,
I want **abrir un Pedido específico de la Cola y ver sus items, Adición Libre, Modalidad, Cliente, forma de pago y Comprobante (si aplica)**,
So that **tengo toda la info para procesarlo**.

**Acceptance Criteria:**

**Given** hago click/tap en un Pedido en la Cola
**When** se abre el detalle (panel lateral derecho en landscape, full-screen drawer en portrait)
**Then** veo: items con cantidad y Adiciones Estructuradas, Adición Libre, Modalidad, dirección si aplica, nombre y celular del Cliente, forma de pago
**And** si forma de pago = transferencia, veo botón "Ver comprobante" que abre la imagen con signed URL (TTL 5-10 min)
**And** veo Estado actual con `status-badge` y botones de acción contextual según Estado

### Story 4.4: Validar pago con asimetría 1tap/2taps + payment_audit (FR-15)

As a **Mostrador**,
I want **confirmar o rechazar el pago de un Pedido con asimetría de fricción (confirmar 1 tap, rechazar 2 taps + motivo) y registrar en audit trail**,
So that **proceso el happy path rápido en hora pico y evito rechazos accidentales**.

**Acceptance Criteria:**

**Given** un Pedido está en Estado `validando_pago` y abrí su detalle
**When** hago tap en "Confirmar pago"
**Then** UN solo tap (sin modal) actualiza Estado a `en_cocina` instantáneamente
**And** se inserta registro en `payment_audit` con mi user_id, acción "confirmar", hash SHA-256 del comprobante, timestamp
**And** el Pedido aparece como Tiquete en vista Cocina
**And** el Cliente recibe el nuevo estado vía polling

**Given** quiero rechazar
**When** hago tap en "Rechazar pago"
**Then** se abre input de motivo (textarea max 140 char) + botón "Enviar rechazo"
**And** tras "Enviar" (segundo tap), Estado pasa a `cancelado`, motivo se guarda, audit registra "rechazar"
**And** el Cliente recibe push (polling) con el motivo del rechazo
**And** la acción NO es reversible (decisión deliberada)

### Story 4.5: Cambio manual de estados + asignación Domiciliario + cancelar (FR-16)

As a **Mostrador**,
I want **mover el Pedido por sus estados manualmente (en_cocina → listo → en_domicilio → entregado), asignar Domiciliario al despachar, y cancelar si necesario**,
So that **el flujo completo del Pedido refleja la realidad operativa**.

**Acceptance Criteria:**

**Given** un Pedido está en `en_cocina`
**When** veo que Lucía aún no marcó listo desde Cocina (caso de override)
**Then** puedo cambiar manualmente a `listo` desde el detalle del Pedido

**Given** un Pedido está en `listo` con Modalidad `domicilio`
**When** voy a despachar
**Then** veo dropdown "Asignar Domiciliario" con la lista de Domiciliarios activos de mi Comercio (de Story 2.7)
**And** selecciono uno y el Pedido pasa a `en_domicilio`
**And** sin Domiciliarios activos, el botón está deshabilitado con mensaje "Activa un Domiciliario o cambia Modalidad a recoger"

**Given** un Pedido está en `en_domicilio` o `listo` (pickup)
**When** confirmo entrega
**Then** Estado pasa a `entregado` (en MVP es manual, sin GPS)

**Given** cualquier Estado activo
**When** hago tap en "Cancelar Pedido"
**Then** se abre input de motivo (text 140 char)
**And** se confirma con segundo tap
**And** Estado pasa a `cancelado`, Cliente recibe motivo, devolución es manual fuera de app (per D-A3)

---

## Epic 5: Vista Cocina (CORAZÓN)

El rol Cocina ve los Tiquetes activos en lista vertical optimizada para tablet montada y manos ocupadas. Marca listos con confirmación de 2 taps deliberados.

### Story 5.1: Vista de Tiquetes activos en lista vertical (FR-18)

As a **rol Cocina (Lucía)**,
I want **ver una lista vertical de Tiquetes activos de mi Comercio con tipografía grande**,
So that **puedo leer los pedidos desde 2-3 metros mientras cocino**.

**Acceptance Criteria:**

**Given** estoy autenticada como Cocina en `/cocina`
**When** mi Comercio tiene Pedidos en Estado `en_cocina`
**Then** veo una lista vertical de Tiquetes ordenada por timestamp ASC (más viejo arriba)
**And** cada Tiquete muestra (UX-DR2 typography): título cocina-title 32px (nombre platos), body cocina-body 20px (items + Adiciones Estructuradas + Adición Libre destacada), tag pequeño "PARA DOMICILIO" o "PARA RECOGER"
**And** NO se muestra precio ni datos del Cliente
**And** sin Tiquetes activos veo empty state "Sin pedidos en cocina. Buen momento para tomar agua. 💧"
**And** touch targets ≥80px (manos ocupadas)
**And** logout discreto detrás de tap largo en esquina

### Story 5.2: Realtime subscription Cocina + polling fallback (FR-20)

As a **rol Cocina**,
I want **que la vista se actualice automáticamente cuando entra un Tiquete nuevo o se marca uno**,
So that **no tengo que refrescar manualmente con las manos ocupadas**.

**Acceptance Criteria:**

**Given** estoy en `/cocina` con la vista abierta
**When** el Mostrador confirma pago de un nuevo Pedido (Story 4.4)
**Then** el Tiquete aparece en mi vista con animación fade-in en <5 segundos vía Realtime canal `cocina:${comercio_id}`
**And** si la conexión WS se cae, hago fallback a polling cada 10s
**And** veo indicador visual sutil cuando estoy en modo polling (sin alarmar a Lucía pero visible para juanpis)

### Story 5.3: Marcar Tiquete Listo con confirmación 2-tap + fade-out (FR-19)

As a **rol Cocina**,
I want **marcar un Tiquete como listo con confirmación explícita**,
So that **no se cancela accidentalmente con un tap en falso**.

**Acceptance Criteria:**

**Given** veo un Tiquete activo
**When** hago tap en él
**Then** aparece modal grande "¿Listo el [nombre del plato]?" con botones gigantes "Sí, listo" (verde) / "Cancelar"
**And** tap "Sí, listo" → Pedido pasa a Estado `listo`, Tiquete hace fade-out 200ms, desaparece
**And** el Mostrador recibe alerta visual de que ese Pedido ya puede salir
**And** un Tiquete marcado listo por error puede ser reactivado por el Mostrador (regresa a `en_cocina`)

---

## Epic 6: Visibilidad — Cliente + Admin

El Cliente ve el estado de su Pedido en tiempo real vía polling cada 10s (reemplazando push real en MVP) con mensajes amigables específicos por cambio de Estado. El admin ve métricas operacionales agregadas por Comercio para reportar valor.

### Story 6.1: Endpoint /api/pedidos/[id]/estado con auth check

As a **desarrollador**,
I want **un endpoint Route Handler que retorne el Estado actual del Pedido y mensaje contextual del último cambio**,
So that **el Cliente puede hacer polling para conocer el progreso**.

**Acceptance Criteria:**

**Given** un Cliente autenticado quiere consultar su Pedido
**When** GET `/api/pedidos/[id]/estado` con sesión válida
**Then** retorna `{ estado, mensaje, tiempo_estimado_restante, ultima_actualizacion }`
**And** RLS valida que el `id` del Pedido pertenece al Cliente autenticado (Cliente NO puede leer Pedido de otro Cliente)
**And** retorna 404 si Pedido no existe
**And** retorna 401 si no hay sesión

### Story 6.2: Vista "Mi pedido" con TanStack Query polling 10s (FR-21, FR-22)

As a **Cliente**,
I want **ver el estado de mi Pedido en una pantalla que se actualiza sola cada 10 segundos**,
So that **sé cómo va sin preguntar al Comercio**.

**Acceptance Criteria:**

**Given** confirmé un Pedido (Story 3.7+3.8)
**When** voy a `/cliente/mis-pedidos/[pedidoId]`
**Then** veo Estado actual con `status-badge`, tiempo transcurrido desde que ordené, items pedidos, Comercio
**And** TanStack Query hace polling cada 10s al endpoint de Story 6.1 (refetchInterval: 10000)
**And** cuando el Estado cambia, la UI se actualiza con animación sutil y mensaje contextual amigable según tabla en EXPERIENCE.md (ej: "Don Luis confirmó tu pago. Tu pedido está en cocina.")
**And** si el Pedido fue cancelado, veo el motivo y un botón "Pedir de nuevo"

### Story 6.3: Lista "Mis Pedidos" del Cliente (FR-22)

As a **Cliente**,
I want **ver la lista de mis Pedidos activos y mi historial**,
So that **puedo volver a ver pedidos anteriores o seguir el estado de los activos**.

**Acceptance Criteria:**

**Given** estoy autenticado y tengo Pedidos
**When** voy a `/cliente/mis-pedidos`
**Then** veo dos secciones: "Activos" (estados ≠ entregado/cancelado) y "Historial" (entregados/cancelados últimos 30 días)
**And** cada item muestra Comercio, fecha, total, Estado
**And** tap abre detalle (Story 6.2)
**And** límite de 3 Pedidos activos simultáneos (no puedo crear un 4to hasta que uno se complete o cancele)

### Story 6.4: Dashboard Admin con métricas básicas por Comercio (FR-32)

As an **admin**,
I want **ver métricas operacionales agregadas por Comercio en el dashboard**,
So that **puedo reportar al comerciante el valor que la app le da y monitorear la salud del piloto**.

**Acceptance Criteria:**

**Given** estoy autenticado como admin
**When** voy a `/admin` o `/admin/comercios/[comercioId]`
**Then** veo por Comercio: número de Pedidos últimos 7 días, número últimos 30 días, valor total transado (suma precios), número de Pedidos cancelados
**And** en `/admin` veo métricas agregadas de TODOS los Comercios + breakdown por Comercio en tabla
**And** las queries son eficientes (índices apropiados en `pedidos.created_at` y `pedidos.estado`)
**And** los datos se calculan en tiempo real (sin precomputación en MVP)
