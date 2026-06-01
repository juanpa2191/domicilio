---
name: Domicilios Norte Aburrá
status: final
created: 2026-05-30
updated: 2026-05-30
description: Plataforma SaaS B2B de gestión de pedidos a domicilio para comercios de pueblos antioqueños. PWA construida sobre shadcn/ui + Tailwind. Este DESIGN.md especifica solo el brand-layer delta.
sources:
  - file:../../prds/prd-domicilio-app-2026-05-30/prd.md
  - file:../../prds/prd-domicilio-app-2026-05-30/addendum.md
colors:
  # Brand override sobre shadcn defaults. Todos los tokens no listados heredan
  # de shadcn (background, foreground, muted, muted-foreground, popover,
  # popover-foreground, card, card-foreground, border, input, ring, destructive).
  primary: '#F97316'
  primary-foreground: '#FFFFFF'
  accent: '#FFF7ED'
  accent-foreground: '#9A3412'
  # Status colors (overrides ligeros sobre defaults para semántica de Pedido)
  status-pending: '#F59E0B'        # ámbar — pendiente_pago, validando_pago
  status-cooking: '#F97316'        # naranja — en_cocina (mismo que primary)
  status-ready: '#10B981'          # esmeralda — listo
  status-delivering: '#3B82F6'     # azul — en_domicilio
  status-delivered: '#6B7280'      # gris — entregado
  status-cancelled: '#EF4444'      # rojo — cancelado
typography:
  # Body, label, muted, caption heredan de shadcn (Geist Sans).
  # Solo display se sobrescribe para títulos grandes en estados clave.
  display:
    fontFamily: 'Geist Sans'
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  display-lg:
    fontFamily: 'Geist Sans'
    fontSize: 42px
    fontWeight: '700'
    lineHeight: '1.15'
    letterSpacing: -0.02em
  # Vista Cocina necesita tipografía más grande para legibilidad desde 2-3m
  cocina-title:
    fontFamily: 'Geist Sans'
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  cocina-body:
    fontFamily: 'Geist Sans'
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  # Heredamos shadcn defaults excepto en cards de pedido que se vuelven más cuadradas
  # para sensación "operacional/POS" en lugar de "consumer app blandito".
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
spacing:
  # Heredamos Tailwind/shadcn escala 4-based completa (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).
  # Sin overrides.
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  pedido-card:
    background: 'white'
    border: '{colors.border}'
    radius: '{rounded.md}'
    padding: '16px'
  pedido-card-nuevo:
    background: '{colors.accent}'
    border: '{colors.primary}'
    radius: '{rounded.md}'
    padding: '16px'
  status-badge:
    radius: '{rounded.full}'
    padding: '2px 8px'
    fontSize: '12px'
    fontWeight: '500'
  tiquete-cocina:
    background: 'white'
    border: '2px solid {colors.border}'
    radius: '{rounded.lg}'
    padding: '24px'
    minHeight: '200px'
---

## Brand & Style

**Domicilios Norte Aburrá** es una herramienta operativa SaaS para comercios de pueblos antioqueños. La premisa del producto es que **el comercio del pueblo no necesita una app más bonita — necesita una herramienta que organice el caos del WhatsApp en hora pico**. La expresión de marca lo refleja: minimalismo funcional al estilo Linear/Vercel, un solo color de acento cálido que evoca comida y energía, y discreción visual en todo lo demás. No es una app "consumer cute" — es una **herramienta de trabajo** que da control y orden.

Domicilios Norte Aburrá hereda shadcn/ui prácticamente entero. Este DESIGN.md especifica solo el brand-layer delta — color primario naranja, badges de estado para la semántica del Pedido, tipografía grande para la vista Cocina, y un puñado de componentes brand-específicos (`pedido-card`, `tiquete-cocina`, `status-badge`). El 85% de los componentes vienen de shadcn (Button, Card, Dialog, Sheet, Toast, Tabs, Avatar, Input, Form, Table) sin modificar — esa es la disciplina.

El producto no busca diferenciarse visualmente de Rappi. Busca diferenciarse **funcionalmente**. La estética minimalista refuerza el mensaje: "esto es una herramienta seria, no marketing".

## Colors

La paleta es **un solo color de marca + status colors semánticos + shadcn defaults para todo lo demás**.

- **Primary Orange (`#F97316`)** — Color de marca. Naranja Tailwind 500. Evoca comida, calidez, energía. Usado en botones primarios, navegación activa, links, y badges de estado "en cocina". Reemplaza el `primary` default de shadcn.
- **Accent (`#FFF7ED`)** — Naranja muy suave (orange-50). Solo para destacar la **tarjeta del pedido recién entrado** en la Cola FIFO (FR-14). Llama atención sin gritar.
- **Status Colors** — Set semántico que mapea a los Estados del Pedido (PRD Glosario):
  - `pendiente_pago`, `validando_pago` → `status-pending` ámbar
  - `en_cocina` → `status-cooking` naranja (mismo que primary)
  - `listo` → `status-ready` verde
  - `en_domicilio` → `status-delivering` azul
  - `entregado` → `status-delivered` gris
  - `cancelado` → `status-cancelled` rojo
- **Todos los otros tokens** (`background`, `foreground`, `muted`, `border`, `input`, `ring`, `card`, `popover`, `destructive`) heredan shadcn default. Si la marca no justifica override, no lo hace.

**Anti-patrones de color:** gradientes decorativos, dark mode "porque sí" (solo claro en MVP), colores extra para nada (rojo solo es `cancelado` o `destructive` — nunca decoración).

## Typography

Body, label, caption, button text heredan **Geist Sans** (shadcn default). Geist tiene excelente legibilidad y soporte para español/acentos.

Overrides:

- **display / display-lg** — Geist Sans 28-42px, weight 600-700. Usado en empty states ("Sin pedidos aún") y headers de surfaces principales (no en cada pantalla).
- **cocina-title / cocina-body** — Tamaño aumentado (32px / 20px) específicamente para la vista Cocina. Lucía la ve desde 2-3 metros mientras cocina, las manos ocupadas. La legibilidad NO es estética en esta vista, es funcional.

Sin tipografía serif. Sin variable fonts custom. La disciplina es Geist Sans + tamaños.

## Layout & Spacing

Escala Tailwind/shadcn heredada al completo (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Sin overrides.

**Layouts por surface:**
- **Cliente (móvil):** Single-column, max-w-md (448px) en pantallas grandes — la app del cliente NO se expande en tablet/desktop, mantiene su forma móvil para evitar surface bloat.
- **Mostrador (tablet):** Two-column layout en landscape: izquierda = Cola FIFO (60% width), derecha = detalle del Pedido seleccionado (40% width). Portrait: single-column con drawer.
- **Cocina (tablet/TV):** Grid 2 columnas en tablet, 3 columnas en TV. Tiquetes grandes que no se cortan.
- **Domiciliario (móvil):** Single-column, lista vertical de entregas asignadas, max-w-md.
- **Admin (web):** Centrado, max-w-5xl (1024px), tabla densa estilo dashboard.

## Elevation & Depth

shadcn defaults heredados: sombra sutil en hover/active. Sin elevación como jerarquía visual.

**Excepción:** El pedido recién entrado en la Cola FIFO (`pedido-card-nuevo`) tiene border naranja + animación de slide-in desde abajo (300ms). Es la única "elevación de atención" del producto.

## Shapes

Heredamos shadcn defaults excepto para componentes operacionales:

- **Inputs, buttons, dropdowns** → `rounded/sm` (4px) — heredado.
- **Cards genéricas, dialogs** → `rounded/md` (6px) — heredado.
- **Pedido-card y tiquete-cocina** → `rounded/md` (6px) — mantenido cuadrado para sensación "POS/operacional", no "consumer cute".
- **Status badges** → `rounded/full` — píldoras pequeñas para estados.

## Components

Componentes shadcn usados as-is, sin override: `Button` (excepto variant primary), `Card`, `Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Toast`, `Tabs`, `Avatar`, `Separator`, `Input`, `Form`, `Label`, `Select`, `Checkbox`, `Switch`, `Skeleton`, `Table`.

Brand-layer overrides y componentes custom:

- **Button (primary variant)** — Fill `{colors.primary}` naranja, foreground blanco, `{rounded.md}`. Otras variantes (secondary, outline, ghost, destructive) heredan shadcn defaults.
- **pedido-card** — Card de Pedido en la Cola FIFO del Mostrador. Background blanco, border `{colors.border}`, `{rounded.md}`, padding `16px`. Contiene: timestamp, nombre Cliente, items resumidos, Modalidad, Estado badge, botón acción contextual.
- **pedido-card-nuevo** — Variante del pedido-card cuando entra fresco (FR-14). Background `{colors.accent}` (naranja suave), border `{colors.primary}` (naranja sólido). Aplica solo los primeros 5 segundos desde la creación del Pedido, después transiciona a `pedido-card` normal.
- **status-badge** — Píldora pequeña usando uno de los `{colors.status-*}` según el Estado del Pedido. `{rounded.full}`, padding `2px 8px`, font 12px medium.
- **tiquete-cocina** — Card grande para vista Cocina. Background blanco, border `2px solid {colors.border}` (más grueso para visibilidad desde lejos), `{rounded.lg}` (8px), padding `24px`, minHeight `200px`. Tipografía `{typography.cocina-title}` para título y `{typography.cocina-body}` para items y Adición Libre.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Heredar shadcn defaults para todo lo no especificado | Sobrescribir tokens shadcn que la marca no justifique |
| Usar `{colors.primary}` (naranja) solo para acciones principales y elemento "en cocina" | Usar naranja decorativamente, en chrome o en hover |
| Status badges con un color por Estado, semántica clara | Inventar colores nuevos para "casos especiales" |
| Vista Cocina con `{typography.cocina-*}` grande para legibilidad desde 2-3m | Asumir que Lucía puede acercarse a la pantalla — no puede, tiene manos ocupadas |
| Pedido nuevo destacado los primeros 5 segundos, después normal | Mantener el destacado permanente — pierde el efecto de "novedad" |
| Single-column en Cliente (max-w-md) incluso en pantallas grandes | Expandir la app Cliente para llenar tablet/desktop |
| Two-column en Mostrador landscape (Cola + Detalle) | Forzar single-column en tablet de 10 pulgadas |
| Geist Sans en todos los pesos disponibles | Agregar fuente serif decorativa "porque queda elegante" |
| Solo modo claro en MVP | Dark mode en Fase 2 si los usuarios lo piden |
