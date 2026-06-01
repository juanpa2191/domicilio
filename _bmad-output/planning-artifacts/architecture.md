---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: 'complete'
completedAt: '2026-05-30'
lastStep: 8
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-domicilio-app-2026-05-30/prd.md
  - _bmad-output/planning-artifacts/prds/prd-domicilio-app-2026-05-30/addendum.md
  - _bmad-output/planning-artifacts/prds/prd-domicilio-app-2026-05-30/.decision-log.md
  - _bmad-output/planning-artifacts/ux-designs/ux-domicilio-app-2026-05-30/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-domicilio-app-2026-05-30/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-domicilio-app-2026-05-30/.decision-log.md
  - _bmad-output/brainstorming/brainstorming-session-2026-05-29-1842.md
workflowType: 'architecture'
project_name: 'Domicilios Norte Aburrá (domicilio-app)'
user_name: 'juanpis'
date: '2026-05-30'
---

# Architecture Decision Document

_Este documento se construye colaborativamente paso a paso. Las secciones se agregan a medida que tomamos cada decisión arquitectónica juntos._

## Project Context Analysis

### Requirements Overview (POST D-20 scope cut)

**Functional Requirements:** 32 FRs definidos en el PRD, de los cuales **MVP implementa 28** (recortados FR-26 a FR-29 de Vista Domiciliario, movidos a Fase 2 — ver `prd.md §6.1.1`). Producto es SaaS B2B operativo (no marketplace) para gestión de pedidos a domicilio en pueblos antioqueños. Foco diferenciador: vista Mostrador con Cola FIFO + validación humana de pagos por transferencia.

**Surfaces en MVP:** Cliente (móvil), Mostrador (tablet 9-11"), Cocina (tablet montada, lista vertical simplificada), Admin con UI básica. **Vista Domiciliario diferida a Fase 2.**

**Non-Functional Requirements:**
- **Performance:** <2s carga inicial 4G, <5s actualización Cola FIFO realtime, comunicación de estado al cliente vía **polling cada 10s** (no push en MVP)
- **Privacidad:** Cumplimiento Ley 1581 (Habeas Data) — consent explícito, comprobantes cifrados 30 días, derecho de eliminación
- **Seguridad:** HTTPS exclusivo, bcrypt para contraseñas, sesiones 90 días, rate limiting en OTP/login
- **Confiabilidad:** Backups diarios, prioridad Mostrador en restauración, Sentry para errors
- **Costo:** <$100k COP/mes MVP, <$500k COP/mes a escala 25 comercios
- **Sin modo offline en MVP** — errores simples "Sin conexión, intenta de nuevo"

**Scale & Complexity:** Complejidad media para solo developer post-scope cut. Multi-tenant + real-time + multi-rol + PWA cross-browser.

- **Dominio primario:** Full-stack PWA + BaaS
- **Nivel de complejidad:** Media (acotada por scope MVP recortado)
- **Componentes arquitectónicos estimados:** ~7-8 (sin Push provider, sin Domiciliario surface)

### Technical Constraints & Dependencies

- **Form-factor:** PWA única, Android 9+ / iOS 16.4+
- **UI System:** shadcn/ui + Tailwind (heredado de UX)
- **Equipo:** 1 persona (juanpis) usando Claude Code como aliado
- **Timeline:** **9 semanas para MVP funcional con 1 piloto en Barbosa** (revisado post-D-20)
- **Sin pasarela de pago:** Cliente paga directo al Comercio, app solo gestiona el flujo
- **Sin gig economy:** Repartidores son empleados/contratados del Comercio (gestionados fuera de app en MVP)
- **Multi-vertical futuro:** MVP solo restaurantes; arquitectura debe permitir farmacias en Fase 2

### Cross-Cutting Concerns Identified

1. **Real-time updates** (Cola FIFO Mostrador, Cocina): Requiere websockets (Supabase Realtime). Polling como fallback si WS se cae.
2. **Polling del Cliente para estado del Pedido** (10s): Reemplaza Push en MVP. Necesita ser eficiente (queries indexed por `pedido_id`).
3. **Multi-tenancy estricto** (cada Comercio aislado): Row Level Security mandatory, no solo lógica de app.
4. **Sistema de roles granular** (3 roles en MVP — Cliente, Mostrador, Cocina — más Admin): RBAC con JWT custom claims.
5. **File storage seguro y efímero**: Signed URLs con TTL corto (5-10 min) + lifecycle policies para comprobantes.
6. **SMS OTP cost control**: Diseño defensivo — circuit breaker si el costo escala mal. Considerar LabsMobile/Hablame.co (proveedores locales más baratos) sobre Twilio.
7. **Habeas Data compliance**: Privacy by design en modelo de datos.
8. **Audit trail**: Tabla inmutable `payment_audit` con hash de imagen del comprobante para disputas/auditoría.

### Riesgos arquitectónicos identificados en Party Mode (Winston + Amelia)

1. **RLS performance**: políticas con JOINs anidados degradan queries 10-50x. Usar `auth.jwt() ->> 'tenant_id'` (custom claim), NO subqueries. Tests con EXPLAIN ANALYZE desde día 1.
2. **Realtime + RLS bug sutil**: payloads pueden filtrarse si las policies no se evalúan antes del broadcast. Test de seguridad explícito (Cliente A NO recibe evento de Cliente B).
3. **FIFO ordering bajo carga**: `created_at` no garantiza orden determinista. Usar columna `sequence_number` (bigserial) y ordenar en cliente.
4. **Supabase Realtime connection limits**: 200 conexiones free, 500 pro. Modelar uso por comercio × usuarios desde día 1.
5. **Vercel egress sin CDN**: imágenes de comprobantes pueden disparar factura. Usar Supabase Storage con transformations o Cloudflare R2.
6. **Edge Functions cold starts** (~300-800ms): OK para flujos asíncronos (envío OTP), no para hot paths.

### Stack pre-validado (a confirmar en step-03)

- **Frontend:** Next.js 15 App Router + Tailwind + shadcn/ui
- **Backend/BaaS:** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Hosting:** Vercel
- **SMS:** LabsMobile o Hablame.co (proveedores Colombia, 3-5x más baratos que Twilio) — fallback Twilio
- **Monitoreo:** Sentry
- **NO en MVP:** Push provider (FCM/Web Push) — diferido a Fase 2 por polling.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack PWA + BaaS (Next.js + Supabase + Vercel).

### Starter Options Considered

- **Supabase Official Next.js Starter** (`-e with-supabase`) — Auth pre-configurada con `@supabase/ssr`, cookies-based, Server Components, RLS-ready. ✅ **ELEGIDA**
- **create-next-app default + Supabase manual** — Más control, ~1-2 días extras de cableado de auth.
- **next-supabase-starter (terceros)** — Trae shadcn/ui + React Query, pero lock-in adicional con mantenedor externo.
- **T3 Stack (create-t3-app)** — tRPC + Prisma. Redundante con Supabase, demasiado complejo para solo dev en 9 semanas.

### Selected Starter: Supabase Official Next.js Starter

**Rationale for Selection:**
Auth pre-configurada con cookies (`@supabase/ssr`), compatible con Server Components y middleware. Ahorra ~1-2 días de cableado de auth + tokens refresh. Mantenimiento oficial por Supabase + Vercel. Mínimo opinado, máxima compatibilidad con shadcn/ui y el stack confirmado.

**Initialization Commands (en orden):**

```bash
# 1. Crear proyecto desde plantilla oficial de Supabase
npx create-next-app@latest domicilios-norte-aburra -e with-supabase

# 2. Instalar shadcn/ui (sistema confirmado en DESIGN.md)
cd domicilios-norte-aburra
npx shadcn@latest init

# 3. Instalar componentes core
npx shadcn@latest add button card dialog input form label select badge dropdown-menu sheet skeleton table tabs toast avatar separator

# 4. Instalar Supabase CLI
npm install -D supabase

# 5. Inicializar Supabase local (Postgres + Auth + Realtime + Storage en Docker)
npx supabase init
npx supabase start
```

**Architectural Decisions Provided by Starter:**

| Capa | Decisión |
|---|---|
| **Language** | TypeScript estricto (`tsconfig.json` pre-configurado) |
| **Runtime** | Node.js 20+ (default Vercel) |
| **Styling** | Tailwind CSS v4 (incluido) + shadcn/ui (post-init) |
| **Bundler** | Turbopack (default Next.js 15+/16) |
| **Linter** | ESLint con Next.js rules |
| **Auth** | `@supabase/ssr` (cookies, no localStorage) — compatible con Server Components, middleware, Server Actions |
| **Token refresh** | Middleware automático en `middleware.ts` |
| **Supabase clients** | `lib/supabase/server.ts` (Server Components / Actions) + `lib/supabase/client.ts` (Client Components) |
| **Deploy** | Vercel con env vars automáticas vía integración |

### ⚠️ Important 2026 — API Keys

Usar las nuevas **`sb_publishable_*`** (cliente, anteriormente `anon`) y **`sb_secret_*`** (server, anteriormente `service_role`). Las keys legacy se deprecan a fines de 2026.

### Code Organization (estructura definitiva — sin paréntesis, route groups NO usados)

```
app/                          # Next.js App Router
├── page.tsx                  # Landing pública del Cliente (lista de Comercios)
├── cliente/                  # Surface Cliente (móvil)
│   ├── pedido/[id]/
│   ├── carrito/
│   ├── checkout/
│   ├── mis-pedidos/
│   └── cuenta/
├── mostrador/                # Surface Mostrador (tablet)
│   ├── page.tsx              # Cola FIFO (default landing)
│   ├── pedidos/[id]/
│   ├── catalogo/
│   │   └── productos/[id]/
│   ├── domiciliarios/        # NOTA: vista UI básica solo (sin app del Domiciliario en MVP)
│   └── configuracion/
├── cocina/                   # Surface Cocina (tablet montada)
│   └── page.tsx              # Vista única — lista de Tiquetes
├── admin/                    # Surface Admin (web)
│   ├── page.tsx              # Dashboard
│   ├── comercios/
│   └── comercios/[id]/
├── auth/                     # Flows de autenticación
│   ├── login/
│   ├── registro-cliente/     # OTP por SMS
│   └── callback/
└── api/                      # API routes mínimas (la mayoría en Server Actions)
    └── webhooks/             # Para integraciones externas si surgen

components/
├── ui/                       # shadcn primitives (heredado)
└── domicilios/               # Componentes específicos del producto
    ├── pedido-card.tsx       # Card de Pedido en Cola FIFO
    ├── tiquete-cocina.tsx    # Tiquete grande para Cocina
    ├── status-badge.tsx      # Badge semántico por Estado
    └── upload-comprobante.tsx

lib/
├── supabase/                 # Clientes y middleware
│   ├── server.ts
│   ├── client.ts
│   └── middleware.ts
└── domicilios/               # Lógica de negocio AGNÓSTICA de Supabase
    ├── pedidos.ts            # Reglas de Estado, validaciones
    ├── comercios.ts
    ├── catalogo.ts
    └── auth.ts               # Validación de roles

types/                        # Tipos generados por Supabase CLI + custom
└── supabase.ts               # Auto-generado: npx supabase gen types typescript

supabase/
├── migrations/               # Schema SQL versionado
├── seed.sql                  # Data de prueba para dev local
└── config.toml               # Config local de Supabase

public/                       # Assets estáticos
├── manifest.json             # PWA manifest
├── sw.js                     # Service Worker (referenciado, no autogenerado en MVP)
└── icons/                    # PWA icons (varias resoluciones)
```

**Decisión clave de routing:** NO usar route groups con paréntesis `(cliente)` — el usuario lo prefiere así, y resulta en URLs explícitas que comunican el rol:
- `/cliente/comercios/123` — el cliente sabe en qué surface está
- `/mostrador/pedidos` — Don Luis sabe que está en el panel operativo
- `/cocina` — Lucía sabe que es la vista cocina
- `/admin/comercios` — juanpis sabe que está administrando

Trade-off aceptado: la app del Cliente final tiene `/cliente` en la URL en lugar de `/` raíz. Mitigación: el landing en `app/page.tsx` puede ser la misma vista que `/cliente`, así el cliente que llega por dominio raíz no tiene que ver `/cliente`.

### Development Experience

- Hot reload con Turbopack
- Supabase local con Docker (Postgres + Realtime + Auth + Storage corriendo igual que producción)
- Type generation desde DB schema: `npx supabase gen types typescript --local > types/supabase.ts`
- Migrations versionadas con `npx supabase migration new <nombre>` → SQL plano commitado en git

**Nota:** La ejecución de `npx create-next-app -e with-supabase` debería ser la **primera historia** en el sprint planning de implementación.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (block implementation):**
1. Postgres RLS con JWT custom claim `tenant_id` (multi-tenancy estricto)
2. Supabase Auth con cookies (`@supabase/ssr`) — OTP SMS Cliente, email/pass Comercio
3. Server Actions como API default
4. Supabase Realtime con canal-per-`comercio_id` para Cola FIFO
5. `sequence_number bigserial` en Pedido para garantizar FIFO ordering bajo carga

**Important Decisions (shape architecture):**
- TanStack Query v5 (server state) + Zustand (client state ligero)
- React Hook Form + Zod resolver para forms y validación
- LabsMobile como SMS provider Colombia (Twilio como fallback)
- Sentry para monitoring de errores
- next-pwa plugin para Service Worker
- App Router SIN route groups (URLs explícitas con rol visible)

**Deferred Decisions (Post-MVP):**
- Push notifications reales (Web Push + flujo de install PWA en iOS) → Fase 2
- OCR para comprobantes de pago (Google Vision API u otra) → Fase 2 si volumen lo justifica
- Logflare/Axiom para logs estructurados → Fase 2
- CDN externo (Cloudflare R2) si Vercel egress se dispara
- Stripe/Wompi/ePayco para cobro automático de suscripción → Fase 2 (>5 comercios pagando)

### Data Architecture

| Decisión | Elección | Rationale |
|---|---|---|
| **Migrations** | Supabase Migrations CLI (`npx supabase migration new`) | SQL plano versionado en git, mismo schema local/prod |
| **Validación** | Zod (peer de React Hook Form) | Estándar shadcn, type-safe end-to-end, schemas reutilizables |
| **ID strategy** | UUID v4 para entidades + `sequence_number bigserial` en Pedido | UUIDs evitan adivinar IDs entre tenants; `sequence_number` garantiza FIFO determinista |
| **Caching cliente** | TanStack Query v5 | Revalidación inteligente, optimistic updates, integración con Supabase Realtime |
| **Multi-tenancy** | Postgres RLS con `auth.jwt() ->> 'tenant_id'` (NO subqueries) | Performance 10-50x mejor que JOIN-based RLS |
| **Audit trail** | Tabla `payment_audit` inmutable (append-only, SHA-256 hash de comprobante) | Habeas Data + resolución de disputas |

### Authentication & Security

| Decisión | Elección | Rationale |
|---|---|---|
| **Auth provider** | Supabase Auth (cookies con `@supabase/ssr`) | Pre-configurado por starter |
| **Token strategy** | JWT con custom claim `tenant_id` | Habilita RLS performante |
| **Authorization** | Postgres RLS + middleware Next.js | Defense in depth |
| **Rate limiting** | Upstash Ratelimit (Redis serverless) en OTP/login | Bloquea abuso de SMS |
| **Encryption at rest** | Supabase default | Cero esfuerzo |
| **Comprobantes URLs** | Signed URLs con TTL 5-10 min | Defensa contra link sharing |
| **Comprobantes bucket** | Privado + lifecycle policy 30 días | Habeas Data NFR §9.2 |
| **Headers seguridad** | `next-safe` + CSP estricto | Cero overhead |

### API & Communication Patterns

| Decisión | Elección | Rationale |
|---|---|---|
| **API style** | Next.js Server Actions (default), Route Handlers solo para webhooks | Type-safe end-to-end |
| **Realtime** | Supabase Realtime con canal `comercio:${id}` | Escala mejor que filtros por fila |
| **Realtime fallback** | Polling cada 10s si WS se cae (vía TanStack Query) | Cocinas con WiFi flojo |
| **Estado del Cliente** | Polling cada 10s al endpoint `/api/pedidos/[id]/estado` (TanStack Query) | Reemplaza push en MVP |
| **Error handling** | try/catch → Sentry capture + Toast con copy amigable | Coherente con EXPERIENCE.md voz/tono |
| **Request validation** | Zod schemas compartidos `lib/domicilios/schemas/*.ts` | Reuso client + server |
| **API docs** | Ninguna formal en MVP | No es API pública, tipos TS son la doc |

### Frontend Architecture

| Decisión | Elección | Rationale |
|---|---|---|
| **Server state** | TanStack Query v5 | Estándar, cache + revalidation + optimistic |
| **Client state** | Zustand | Mínimo overhead para UI state ligero |
| **Forms** | React Hook Form + Zod resolver | Estándar shadcn |
| **Routing** | App Router SIN route groups | Preferencia del usuario, URLs explícitas |
| **PWA** | `next-pwa` plugin + manifest manual | Service Worker auto-generado para cache |
| **Code splitting** | Dynamic imports en `/admin/*` | Admin no se carga para Cliente |
| **Iconografía** | `lucide-react` (default shadcn) | Cero decisión adicional |
| **Toasts** | shadcn Toast (sonner) | Heredado |
| **Imágenes** | `next/image` con Supabase Storage loader | Optimización + lazy load |

### Infrastructure & Deployment

| Decisión | Elección | Rationale |
|---|---|---|
| **Frontend hosting** | Vercel (Hobby → Pro cuando >100k req/mes) | Integración 1-click con Supabase + GitHub |
| **Backend BaaS** | Supabase (Free → Pro $25 USD/mes) | Postgres + Auth + Realtime + Storage + Edge Functions |
| **CI/CD** | GitHub Actions + Vercel preview deploys automáticos por PR | Cero config |
| **Entornos** | local (Supabase Docker) / preview (Vercel branch + Supabase staging) / production | Estándar SaaS |
| **Monitoreo errores** | Sentry (Developer plan free) | Errores + performance |
| **Logs** | Vercel logs + console.log estructurado | Suficiente para MVP |
| **Analytics** | Vercel Analytics (Web Vitals) | Privacy-friendly |
| **SMS Provider primario** | LabsMobile (Colombia local, ~$50 COP/SMS) | ~5x más barato que Twilio |
| **SMS Provider fallback** | Twilio (feature flag) | Resiliencia |
| **Image CDN** | Supabase Storage con transformations | Evita Vercel egress |
| **DB Backups** | Supabase daily backups (Pro plan) | Incluido en $25/mes |
| **Secrets** | Vercel env vars + Supabase Vault | Cero gestión manual |

### Decision Impact Analysis

**Implementation Sequence (orden de implementación):**
1. Setup proyecto desde starter Supabase
2. Schema SQL inicial con RLS policies para multi-tenancy
3. Custom JWT claim `tenant_id` configurado en Supabase Auth
4. Helpers Supabase verificados (`server.ts`, `client.ts`, `middleware.ts`)
5. Upstash Ratelimit configurado en endpoints OTP
6. Cuenta LabsMobile + cuenta backup Twilio
7. Sentry inicializado
8. shadcn/ui components instalados
9. Estructura de carpetas (`cliente/`, `mostrador/`, `cocina/`, `admin/`)
10. Forms con RHF + Zod schemas comunes
11. TanStack Query provider
12. Supabase Realtime subscription helpers

**Cross-Component Dependencies:**
- `lib/domicilios/*` (lógica de negocio) NO debe importar `lib/supabase/*` directamente — separación para permitir migración de BaaS sin reescribir lógica (mitigación de lock-in).
- Zod schemas viven en `lib/domicilios/schemas/` y se importan tanto en Server Actions como en client forms.
- RLS policies referencian el JWT custom claim `tenant_id` — cualquier cambio en cómo se setea el claim afecta TODAS las queries.
- Supabase Realtime canales se nombran `comercio:${comercio_id}` consistentemente — convención compartida client + server.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

Identificadas ~8 áreas críticas donde distintos AI agents (o un mismo agent en sesiones distintas) podrían tomar decisiones distintas sin guías explícitas. Cada categoría tiene reglas mandatorias para garantizar consistencia.

### Naming Patterns

**Base de Datos (Postgres):**
- Tablas: plural, `snake_case`, en español de dominio (`pedidos`, `comercios`, `usuarios_comercio`, `domiciliarios`, `productos`, `adiciones_estructuradas`, `comprobantes_pago`, `payment_audit`)
- Columnas: `snake_case` (`comercio_id`, `created_at`, `estado_actual`, `sequence_number`)
- Foreign keys: `<entidad>_id` (`comercio_id`, `pedido_id`)
- Enums: `snake_case` español, coherente con Glosario PRD (`pendiente_pago`, `en_cocina`, `listo`, etc.)
- Índices: `idx_<tabla>_<columnas>` (`idx_pedidos_comercio_estado`)
- RLS policies: `<tabla>_<acción>_<rol>` (`pedidos_select_mostrador`)

**TypeScript / React:**
- Tipos / interfaces: `PascalCase`, español para dominio (`Pedido`, `EstadoPedido`)
- Funciones: `camelCase`, español para dominio (`crearPedido`, `validarPago`)
- Constantes: `UPPER_SNAKE_CASE` (`MAX_PEDIDOS_ACTIVOS_POR_CLIENTE`)
- Variables: `camelCase` (`pedidoActual`, `comercioId`)
- Booleans con prefijo: `is/has/can/should` (`isLoading`, `hasComprobante`, `canValidarPago`)

**Archivos (convención shadcn):**
- Componentes: `kebab-case.tsx` con export `PascalCase` (`pedido-card.tsx` → `export PedidoCard`)
- Utilidades: `kebab-case.ts` (`calcular-total.ts`)
- Server Actions: `actions.ts` coubicado con la ruta (`app/mostrador/pedidos/actions.ts`)
- Schemas Zod: `kebab-case.ts` en `lib/domicilios/schemas/`
- Tipos: `kebab-case.ts` en `types/`

**URLs / Routing:**
- Rutas: `kebab-case`, SIN paréntesis (sin route groups), params en `camelCase` dentro de `[]` (`/mostrador/pedidos/[pedidoId]`)
- Query params: `snake_case` (`?estado=en_cocina&desde=2026-05-30`)
- API Route Handlers: `kebab-case` (`/api/webhooks/labsmobile-status`)

### Structure Patterns

**Tests (co-located, simple para solo dev):**
- Component tests: `pedido-card.test.tsx` junto al componente
- Lib tests: `calcular-total.test.ts` junto al módulo
- SQL/RLS tests: `supabase/tests/rls-pedidos.test.sql` usando pgtap

**Components por feature (NO por tipo):**
- ✅ `components/domicilios/pedido-card.tsx`
- ❌ `components/cards/pedido-card.tsx`

**Server Actions por surface:**
- `app/mostrador/pedidos/actions.ts` (validarPago, asignarDomiciliario, etc.)
- Componentes solo-de-esta-ruta con prefijo `_` (`app/mostrador/pedidos/_components/cola-fifo.tsx`)

### Format Patterns

**Server Action Response (discriminated union estándar único):**
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string }
```

**Formato de datos:**

| Tipo | Formato | Ejemplo |
|---|---|---|
| Fechas | ISO 8601 string en JSON, Date en TS | `"2026-05-30T14:32:00Z"` |
| IDs | UUID v4 string | `"a1b2c3d4-..."` |
| Sequence | bigint | `1234` |
| Dinero (COP) | Integer entero (sin decimales) | `15000` (= 15.000 COP) |
| Null | `null` para "ausente conocido", `undefined` para "no consultado" | — |

**JSON field naming:**
- `snake_case` end-to-end (DB → Server → Client). NO conversión automática a camelCase.
- Zod schemas reflejan la DB exactamente.

### Communication Patterns

**Supabase Realtime channels:**
- Convención: `<recurso>:<id>` (`comercio:${comercioId}`, `cocina:${comercioId}`)
- Filtros server-side con `filter: 'comercio_id=eq.${id}'` (NO filtrar en cliente — RLS + filter es defensa en profundidad)

**TanStack Query keys (tuple coarse-to-fine):**
```typescript
['pedidos', { comercio_id }]                       // Cola Mostrador
['pedidos', { comercio_id, estado: 'en_cocina' }]  // Vista Cocina
['pedidos', { id: pedidoId }]                       // Detalle
['catalogo', { comercio_id }]
```

**Naming de eventos (cuando broadcast manual):**
- Verb-Noun en `kebab-case` (`pedido-creado`, `pago-validado`, `pedido-listo`)

### Process Patterns

**Error Handling (estándar único):**
```typescript
try {
  // operación
  revalidatePath('/mostrador')
  return { success: true, data }
} catch (e) {
  captureException(e, { tags: { action: 'validarPago', pedidoId } })
  return { success: false, error: 'Mensaje amigable para el usuario' }
}
```

**Loading States (heredado de EXPERIENCE.md):**
- Initial load → `<Skeleton />` (shadcn)
- Action in progress → Spinner en botón con `disabled`
- Auto-refresh → silencioso (TanStack Query refetch)

**Auth Check estándar (en cada layout protegido):**
```typescript
export default async function MostradorLayout({ children }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const rol = await getUserRole(user.id)
  if (rol !== 'mostrador' && rol !== 'admin') redirect('/')
  return <>{children}</>
}
```

**Validación estándar:**
1. Schema Zod en `lib/domicilios/schemas/`
2. Cliente: React Hook Form + zodResolver
3. Server Action: re-validar con `Schema.safeParse()` (nunca confiar en cliente)

### Enforcement Guidelines

**All Implementations (juanpis + Claude Code) MUST:**

1. **Toda Server Action retorna `ActionResult<T>`** — predictibilidad cliente, manejo de errores uniforme.
2. **Schemas Zod son la única fuente de verdad de validación** — compartidos client+server, DRY.
3. **Lógica de negocio en `lib/domicilios/*` NO importa `lib/supabase/*` directo** — separación que mitiga lock-in (advertencia Winston).
4. **RLS policies SIEMPRE testeadas con pgtap antes de merge** — multi-tenancy isolation es crítico (advertencia Amelia).
5. **Cualquier mutación que afecte Pedido pasa por `lib/domicilios/pedidos.ts`** — single source of truth para reglas de Estado.
6. **Errores capturados con Sentry SIEMPRE incluyen tags `{ action, ... }`** — debugging futuro.
7. **Components shadcn NO se modifican directamente** — se extienden/wrappean en `components/domicilios/`.
8. **Spanish para dominio (Pedido, Comercio, Domiciliario), English para infra (Component, Service, Helper)** — coherencia con PRD Glosario.

### Pattern Examples

**✅ Good — Server Action correcta:**
```typescript
'use server'
import { z } from 'zod'
import { captureException } from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ValidarPagoSchema = z.object({ pedido_id: z.string().uuid() })

export async function validarPago(input: unknown): Promise<ActionResult<Pedido>> {
  const parsed = ValidarPagoSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Datos inválidos' }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: 'en_cocina' })
      .eq('id', parsed.data.pedido_id)
      .select()
      .single()
    if (error) throw error

    revalidatePath('/mostrador')
    return { success: true, data }
  } catch (e) {
    captureException(e, { tags: { action: 'validarPago', pedidoId: parsed.data.pedido_id } })
    return { success: false, error: 'No se pudo validar el pago. Intenta de nuevo.' }
  }
}
```

**❌ Anti-patterns:**
- Server Action que lanza excepciones en vez de retornar `ActionResult<T>` (rompe contrato cliente).
- Validación duplicada (Zod en cliente + manual en servidor con shape distinto).
- Lógica de negocio embebida en componentes React (debería estar en `lib/domicilios/`).
- RLS policies con subqueries a tablas de members (degradan performance 10-50x).
- Modificar archivos en `components/ui/*` (rompe shadcn updates).
- Naming mezclado (`pedidoId` y `pedido_id` en mismo flow).

## Project Structure & Boundaries

### Complete Project Directory Structure

```
domicilios-norte-aburra/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts                      # next-pwa configurado aquí
├── tailwind.config.ts                  # tokens shadcn + colores brand
├── postcss.config.js
├── components.json                     # shadcn config
├── middleware.ts                       # Supabase auth refresh + role-based redirect
├── .env.local                          # secrets locales (gitignored)
├── .env.example                        # template público de variables
├── .gitignore
├── eslint.config.mjs
├── instrumentation.ts                  # Sentry init
│
├── .github/workflows/                  # CI/CD
│   ├── ci.yml                          # lint + typecheck + tests
│   └── pgtap-tests.yml                 # tests de RLS en CI
│
├── app/                                # Next.js App Router (SIN route groups, sin paréntesis)
│   ├── globals.css
│   ├── layout.tsx                      # root layout: Toaster, providers, Sentry
│   ├── page.tsx                        # landing pública = vista Cliente
│   ├── icon.png, manifest.json
│   │
│   ├── auth/                           # Flows autenticación
│   │   ├── login/page.tsx              # FR-2 (Cliente OTP), FR-3 (Comercio email/pass)
│   │   ├── registro-cliente/page.tsx   # FR-1
│   │   ├── verificar-otp/page.tsx      # FR-1
│   │   ├── callback/route.ts           # Supabase auth callback
│   │   └── actions.ts                  # iniciarLoginOTP, verificarOTP, loginComercio
│   │
│   ├── cliente/                        # Surface Cliente (móvil)
│   │   ├── layout.tsx                  # bottom tab nav, auth check
│   │   ├── page.tsx                    # FR-8
│   │   ├── comercios/[comercioId]/page.tsx  # FR-9
│   │   ├── carrito/                    # FR-9, FR-10
│   │   ├── checkout/                   # FR-11, FR-12, FR-13
│   │   ├── mis-pedidos/                # FR-22
│   │   └── cuenta/                     # perfil + Habeas Data
│   │
│   ├── mostrador/                      # Surface Mostrador (tablet) — CORAZÓN
│   │   ├── layout.tsx                  # sidebar nav, auth check rol mostrador
│   │   ├── page.tsx                    # FR-14 (Cola FIFO, default landing)
│   │   ├── pedidos/[pedidoId]/         # FR-15, FR-16
│   │   ├── catalogo/                   # FR-5, FR-6, FR-7
│   │   ├── domiciliarios/              # FR-25 (datos básicos, sin app del Domiciliario)
│   │   └── configuracion/              # FR-17, FR-23, FR-24
│   │
│   ├── cocina/                         # Surface Cocina — CORAZÓN
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # FR-18, FR-20 (lista vertical simplificada)
│   │   └── actions.ts                  # FR-19
│   │
│   ├── admin/                          # Surface Admin (web)
│   │   ├── layout.tsx                  # auth check rol admin
│   │   ├── page.tsx                    # FR-32 dashboard
│   │   ├── comercios/                  # FR-30, FR-31
│   │   └── usuarios-comercio/page.tsx
│   │
│   └── api/                            # Route Handlers mínimos
│       ├── pedidos/[id]/estado/route.ts   # endpoint polling Cliente (reemplaza push MVP)
│       └── webhooks/labsmobile-status/route.ts
│
├── components/
│   ├── ui/                             # shadcn primitives (NO modificar)
│   │   ├── button, card, dialog, input, ...
│   │
│   └── domicilios/                     # Componentes brand-específicos
│       ├── pedido-card.tsx             # Card en Cola FIFO
│       ├── pedido-card-nuevo.tsx       # variante destacada
│       ├── tiquete-cocina.tsx
│       ├── status-badge.tsx
│       ├── upload-comprobante.tsx
│       ├── pago-data-display.tsx
│       ├── adicion-libre-textarea.tsx
│       ├── modalidad-selector.tsx
│       ├── bottom-nav.tsx              # Nav móvil Cliente
│       └── sidebar-mostrador.tsx
│
├── lib/
│   ├── supabase/                       # Capa de infraestructura (BaaS)
│   │   ├── server.ts                   # createClient Server Components/Actions
│   │   ├── client.ts                   # createClient Client Components
│   │   ├── middleware.ts               # refresh tokens helper
│   │   └── admin.ts                    # service role (solo admin)
│   │
│   ├── domicilios/                     # LÓGICA DE NEGOCIO — agnóstica de Supabase
│   │   ├── pedidos.ts                  # reglas de Estado, transiciones válidas
│   │   ├── comercios.ts
│   │   ├── catalogo.ts
│   │   ├── auth.ts                     # getUserRole, requireRole
│   │   ├── realtime.ts                 # canal-per-comercio helpers
│   │   ├── push.ts                     # estructura futura (no-op MVP)
│   │   ├── audit.ts                    # log payment_audit
│   │   ├── calcular-total.ts
│   │   └── schemas/                    # Zod schemas compartidos
│   │       ├── pedido.ts, comercio.ts, producto.ts, comprobante.ts, auth.ts
│   │
│   ├── sms/                            # Abstracción proveedor SMS
│   │   ├── index.ts                    # interfaz SmsProvider
│   │   ├── labsmobile.ts               # primario
│   │   ├── twilio.ts                   # fallback (feature flag)
│   │   └── send-otp.ts                 # high-level con failover
│   │
│   ├── ratelimit.ts                    # Upstash Ratelimit
│   ├── tanstack-query.ts               # QueryClient + providers
│   ├── sentry.ts                       # captureException con tags
│   └── utils.ts                        # cn() shadcn + helpers
│
├── types/
│   ├── supabase.ts                     # auto-generado: npx supabase gen types
│   └── domicilios.ts                   # tipos derivados + helpers
│
├── supabase/
│   ├── config.toml                     # config local
│   ├── seed.sql                        # data de prueba dev
│   ├── migrations/                     # SQL versionado
│   │   ├── 20260530000001_initial_schema.sql
│   │   ├── 20260530000002_rls_policies.sql
│   │   ├── 20260530000003_realtime_setup.sql
│   │   ├── 20260530000004_storage_buckets.sql
│   │   └── 20260530000005_audit_table.sql
│   └── tests/                          # pgtap tests RLS
│       ├── rls-pedidos.test.sql
│       ├── rls-comercios.test.sql
│       └── rls-multi-tenant.test.sql
│
├── public/
│   ├── manifest.json, sw.js (next-pwa)
│   ├── icons/                          # PWA icons (192, 512, etc.)
│   └── images/placeholder-producto.png
│
└── docs/                               # Documentación interna
    ├── deployment.md
    └── onboarding-comercio.md
```

### Architectural Boundaries

**Capa de Negocio vs Infraestructura (lock-in mitigation):**

```
app/* + components/domicilios/*  →  lib/domicilios/*  →  lib/supabase/*
(UI brand-específica)              (LÓGICA AGNÓSTICA)    (INFRA BaaS)
```

**Regla crítica:** `lib/domicilios/*` recibe `SupabaseClient` como parámetro pero NO importa `lib/supabase/*` directamente. Permite reemplazar BaaS sin reescribir lógica.

**Componentes:**
- `components/ui/*` = shadcn primitives, NO se modifican (se actualizan con `npx shadcn@latest update`).
- `components/domicilios/*` = componentes brand-específicos wrappeando shadcn.
- `_components/` con underscore dentro de rutas = solo de esa ruta, NO reutilizables.

**Data:**
- Postgres RLS = primera línea de defensa multi-tenant (JWT `tenant_id`).
- Server-side filters (`comercio_id=eq.${id}`) = defensa en profundidad.
- Cliente nunca confiable — toda mutación re-valida en Server Action con Zod.
- Comprobantes = bucket privado + signed URLs cortas (5-10 min) + lifecycle 30 días.

### Requirements to Structure Mapping

**Mapeo completo FR → ubicación (28 FRs efectivos en MVP, post D-20):**

| Surface | FRs | Carpetas principales |
|---|---|---|
| **Cliente** (10 FRs) | FR-1, FR-2, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-21, FR-22 | `app/auth/`, `app/cliente/`, `app/api/pedidos/[id]/estado/` |
| **Mostrador** (12 FRs) | FR-3, FR-4, FR-5, FR-6, FR-7, FR-14, FR-15, FR-16, FR-17, FR-23, FR-24, FR-25 | `app/mostrador/`, `lib/domicilios/pedidos.ts` |
| **Cocina** (3 FRs) | FR-18, FR-19, FR-20 | `app/cocina/`, `components/domicilios/tiquete-cocina.tsx` |
| **Admin** (3 FRs) | FR-30, FR-31, FR-32 | `app/admin/comercios/` |
| **Diferidos Fase 2** | FR-26, FR-27, FR-28, FR-29 (Vista Domiciliario) | ❌ NO en MVP |

**Cross-cutting concerns:**
- **Autenticación:** `app/auth/`, `lib/supabase/middleware.ts`, `middleware.ts` (root), `lib/domicilios/auth.ts`
- **Habeas Data:** `app/cliente/cuenta/privacidad/page.tsx`, `lib/domicilios/audit.ts`
- **Realtime FIFO:** `lib/domicilios/realtime.ts` consumido por `app/mostrador/page.tsx` y `app/cocina/page.tsx`
- **Polling estado cliente:** `app/api/pedidos/[id]/estado/route.ts` + TanStack Query en `app/cliente/mis-pedidos/[pedidoId]/page.tsx`
- **Audit trail pagos:** `lib/domicilios/audit.ts` invocado desde `app/mostrador/pedidos/actions.ts::validarPago`

### Integration Points

**Servicios Externos:**

| Servicio | Propósito | Ubicación |
|---|---|---|
| Supabase | DB + Auth + Realtime + Storage | `lib/supabase/*`, `supabase/migrations/*` |
| LabsMobile | SMS OTP primario (Colombia) | `lib/sms/labsmobile.ts` |
| Twilio | SMS OTP fallback (feature flag) | `lib/sms/twilio.ts` |
| Upstash Redis | Rate limiting OTP/login | `lib/ratelimit.ts` |
| Sentry | Error tracking + performance | `instrumentation.ts`, `lib/sentry.ts` |
| Vercel | Hosting + CDN + Analytics | Auto (sin código integración) |

**Webhooks entrantes:**
- `/api/webhooks/labsmobile-status` — confirmaciones de entrega de SMS

**Data Flow típico (validar pago):**

```
Cliente sube comprobante
  → Storage Supabase (bucket privado)
  → Mostrador tap en pedido
  → app/mostrador/pedidos/actions.ts::validarPago()
  → lib/domicilios/pedidos.ts::validarPago(client, pedidoId)
  → Supabase UPDATE pedidos SET estado='en_cocina'
  → lib/domicilios/audit.ts::registrarValidacionPago()
  → Realtime broadcast canal cocina:${comercio_id}
  → Cocina recibe Tiquete (sin reload)
  → Cliente polling cada 10s recibe estado actualizado
```

### File Organization Patterns

**Configuration:** Root level — `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `components.json` (shadcn). Secretos en `.env.local` (gitignored), template en `.env.example`. CI en `.github/workflows/*.yml`.

**Tests:**
- Unit/component: co-located (`pedido-card.test.tsx`)
- Lógica de negocio: `lib/domicilios/*.test.ts`
- RLS: `supabase/tests/*.test.sql` con pgtap
- E2E: diferido (testing manual del flujo crítico en MVP)

**Assets:**
- PWA icons: `public/icons/`
- Placeholders: `public/images/`
- Imágenes de productos (subidas por comercios): Supabase Storage bucket público
- Comprobantes: Supabase Storage bucket PRIVADO + signed URLs

### Development Workflow Integration

**Development Server:**
- `npm run dev` (Turbopack)
- `npx supabase start` (Postgres + Auth + Realtime + Storage en Docker local)
- `npx supabase gen types typescript --local > types/supabase.ts` después de cada migration

**Build Process:**
- Vercel: `next build` con Turbopack
- Supabase: migrations aplicadas con `npx supabase db push --remote`

**Deployment:**
- PR a `main` → Vercel preview deploy automático + Supabase staging
- Merge a `main` → Vercel production deploy + migrations a Supabase production (manual o GitHub Action)

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** Stack maduro y probado (Next.js 15+/16 + Supabase + Vercel). Todas las versiones compatibles. shadcn/ui + Tailwind v4 + lucide-react sin conflictos. TanStack Query + Zustand + RHF + Zod combo estándar sin overlapping concerns. RLS Postgres + Custom JWT claims es el patrón nativo de Supabase.

**Pattern Consistency:** Naming `snake_case` end-to-end (DB → API → cliente) sin conversiones automáticas. Spanish para dominio (`Pedido`, `Comercio`) alineado con Glosario PRD. File naming kebab-case + PascalCase exports siguiendo convención shadcn. `ActionResult<T>` único en Server Actions.

**Structure Alignment:** App Router SIN route groups (URLs explícitas reflejando rol). `lib/domicilios/` agnóstico de Supabase mitigando lock-in (advertencia Winston). Tests co-located + pgtap separado para RLS. Componentes por feature (`components/domicilios/`).

### Requirements Coverage Validation ✅

**Cobertura efectiva MVP: 28/32 FRs (87.5%).** Los 4 diferidos (FR-26 a FR-29 Vista Domiciliario completa) están explícitamente documentados en D-20 del PRD decision log.

| Categoría | FRs | Status |
|---|---|---|
| Auth Cliente + Comercio | FR-1 a FR-4 | ✅ |
| Catálogo Comercio | FR-5 a FR-7 | ✅ |
| Toma de Pedido Cliente | FR-8 a FR-13 | ✅ |
| Gestión Pedido Mostrador ⭐ | FR-14 a FR-17 | ✅ |
| Vista Cocina ⭐ | FR-18 a FR-20 | ✅ simplificada |
| Comunicación al Cliente | FR-21, FR-22 | ✅ vía polling (no push MVP) |
| Configuración Comercio | FR-23 a FR-25 | ✅ |
| Vista Domiciliario | FR-26 a FR-29 | ❌ DIFERIDO Fase 2 |
| Admin Plataforma | FR-30 a FR-32 | ✅ UI básica |

**NFRs Coverage:**

| NFR | Estrategia arquitectónica |
|---|---|
| Performance <2s carga 4G | Vercel CDN + Next.js SSR + Turbopack |
| Real-time <5s FIFO | Supabase Realtime canal `comercio:${id}` + fallback polling |
| Privacidad Ley 1581 | Bucket privado + signed URLs cortas + lifecycle 30d + `payment_audit` |
| Seguridad | HTTPS Vercel + bcrypt Supabase + Upstash Ratelimit + CSP |
| Confiabilidad | Backups diarios + Sentry + prioridad Mostrador en restauración |
| Costo <$100k/$500k COP/mes | Stack BaaS + LabsMobile sobre Twilio |

### Implementation Readiness Validation ✅

**Decision Completeness:** Críticas documentadas con versiones (Next 15+/16, Supabase actual, Tailwind v4). Patrones comprehensive (8 reglas mandatory + ejemplos buenos/malos). Reglas de enforcement claras.

**Structure Completeness:** Árbol detallado completo. Todos los archivos y carpetas definidos. Integration points mapeados (6 servicios externos). Component boundaries explícitos.

**Pattern Completeness:** Naming conventions DB + TS + URLs cubiertos. Communication patterns (Realtime channels, TanStack Query keys) explícitos. Process patterns (error handling, loading, auth, validation) documentados.

### Gap Analysis Results

**🔴 Critical Gaps: Ninguno.** Todas las decisiones bloqueantes están tomadas.

**🟡 Medium Gaps:**
1. **Costo real de SMS OTP no validado** (OQ-2 PRD) — Validar con LabsMobile/Twilio en Semana 1. Mitigación: `SmsProvider` interface permite cambiar proveedor.
2. **Política de privacidad pendiente** (OQ-5 PRD) — Redactar antes de onboardear primer comercio. No bloquea desarrollo.
3. **Capacity planning Supabase Realtime** — 200 conn Free / 500 Pro. Con 25 comercios × 4 conn = 100. OK para piloto. Monitorear desde Semana 7.

**🟢 Minor Gaps:**
4. Sin E2E testing automatizado — justificado por solo dev + MVP. Testing manual del flujo crítico.
5. Sin plan de disaster recovery formal — backups Supabase diarios son suficientes para MVP.
6. Sin estrategia de feature flags estructurada — solo SMS provider con flag simple.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (post D-20)
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

**Total: 16/16 ✅**

### Architecture Readiness Assessment

**Overall Status: READY WITH MINOR GAPS**

16/16 checklist items completados. 3 gaps medium son externos al control arquitectónico (validación SMS Semana 1, política de privacidad antes de piloto, monitoreo capacity Semana 7+). Ninguno bloquea inicio de implementación.

**Confidence Level: ALTA**

Stack boring + maduro. Decisiones validadas en party mode (Winston + Amelia). Patrones específicos basados en advertencias reales (sequence_number, audit table, JWT custom claims, LabsMobile). Scope realista post D-20 (28 FRs efectivos en 9 semanas).

**Key Strengths:**
1. Lock-in moderado y reversible (lib/domicilios agnóstica)
2. Multi-tenancy estricto desde día 1 (RLS + JWT + pgtap tests)
3. Defensive design (sequence_number FIFO, audit inmutable, signed URLs cortas)
4. Cost-conscious (BaaS + LabsMobile sobre Twilio)
5. Estructura mapeada al PRD (cada FR tiene ubicación específica)

**Areas for Future Enhancement (Fase 2):**
- Push notifications reales (Web Push + PWA install onboarding)
- Vista Domiciliario completa con GPS opcional
- OCR para comprobantes (Google Vision API)
- Pasarela de cobro automático (Wompi/ePayco)
- Logflare/Axiom para logs estructurados
- E2E testing con Playwright
- Dashboard de métricas para Comercio

### Implementation Handoff

**Guidelines para juanpis + Claude Code:**
1. Seguir TODAS las decisiones arquitectónicas exactamente como documentadas
2. Usar patrones de implementación consistentemente (8 reglas mandatory en sección Enforcement)
3. Respetar boundaries (lib/domicilios NO importa lib/supabase directo)
4. Consultar este documento antes de cualquier decisión arquitectónica
5. Cualquier cambio de stack/patrón debe documentarse en un nuevo decision log

**First Implementation Priority:**

```bash
# Historia #1 — Setup proyecto base
npx create-next-app@latest domicilios-norte-aburra -e with-supabase
cd domicilios-norte-aburra
npx shadcn@latest init
npx shadcn@latest add button card dialog input form label select badge dropdown-menu sheet skeleton table tabs toast avatar separator
npm install -D supabase
npx supabase init
npx supabase start
```

**Después:**
- Historia #2 — Schema SQL inicial + RLS policies + pgtap tests
- Historia #3 — Custom JWT claim `tenant_id` configurado en Supabase Auth
- Historia #4 — Helpers Supabase verificados + Upstash Ratelimit
- Historia #5 — Sentry inicializado + `lib/sms/*` abstracción
- Historia #6+ — Surfaces empezando por Cliente
