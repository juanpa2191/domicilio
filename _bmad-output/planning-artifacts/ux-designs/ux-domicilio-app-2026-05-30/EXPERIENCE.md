---
name: Domicilios Norte Aburrá
status: final
created: 2026-05-30
updated: 2026-05-30
description: Especificación de comportamiento, IA, flows, voz/tono, accesibilidad e interacción para la PWA de Domicilios Norte Aburrá. Peer de DESIGN.md.
sources:
  - file:../../prds/prd-domicilio-app-2026-05-30/prd.md
  - file:../../prds/prd-domicilio-app-2026-05-30/addendum.md
  - file:./DESIGN.md
---

## Foundation

### Form-factor

**PWA (Progressive Web App)** — única forma de distribución. Soporte mínimo:
- Android 9+ (Chrome / Samsung Internet)
- iOS 16.4+ (Safari, requerido para push notifications en PWA)

Sin app nativa, sin React Native, sin instalable desde App Store/Play Store. Usuarios pueden "Agregar a pantalla de inicio" desde el navegador.

### UI System

**shadcn/ui + Tailwind CSS** como base. Tokens y deltas en `DESIGN.md`. Cualquier patrón de componente no documentado aquí hereda comportamiento shadcn default.

### Surfaces (4)

La PWA renderiza una de cuatro surfaces según el rol autenticado:

1. **Cliente** — Pública/autenticada. Móvil (smartphone). Pedir, pagar, seguir Pedido.
2. **Mostrador** — Autenticada. Tablet 9-11" (principal). Gestionar Cola FIFO, validar pagos, asignar Domiciliarios.
3. **Cocina** — Autenticada. Tablet montada (principal). Ver Tiquetes, marcar listos.
4. **Domiciliario** — Autenticada. Móvil (smartphone). Ver entregas asignadas, marcar entregadas.
5. **Admin Plataforma** — Autenticada. Web/desktop. Solo juanpis en MVP.

Una sesión = un rol. Cambiar de rol requiere logout/login.

## Information Architecture

### Cliente (móvil)

```
[Splash] → ¿Autenticado?
  ├─ NO → [Login/Registro con OTP]
  └─ SÍ → [Home: Lista de Comercios]
              ├─ [Comercio detalle / Catálogo]
              │     └─ [Carrito]
              │           └─ [Checkout: dirección + pago]
              │                 ├─ Pago transferencia → [Subir comprobante]
              │                 └─ Pago efectivo → [Confirmar]
              │                       └─ [Seguimiento del Pedido]
              ├─ [Mis Pedidos] (lista de pedidos activos + historial)
              │     └─ [Pedido detalle / Seguimiento]
              └─ [Cuenta] (perfil, direcciones, logout, política de privacidad)
```

**Navegación principal:** Bottom tab nav con 3 tabs: **Home** (lista comercios), **Mis Pedidos** (activos), **Cuenta**.

### Mostrador (tablet)

```
[Login] → [Dashboard Mostrador]
            ├─ [Cola FIFO de Pedidos]  ← VISTA PRINCIPAL (default landing)
            │     └─ [Pedido seleccionado: panel lateral]
            │           ├─ Validar pago (si validando_pago)
            │           ├─ Cambiar Estado
            │           └─ Asignar Domiciliario (si va a en_domicilio)
            ├─ [Catálogo]
            │     ├─ [Lista de productos]
            │     │     └─ [Producto detalle / editar]
            │     └─ [Adiciones por producto]
            ├─ [Domiciliarios]
            │     ├─ [Lista de Domiciliarios]
            │     └─ [Crear / Editar Domiciliario]
            └─ [Configuración]
                  ├─ Info básica del Comercio
                  ├─ Horario
                  ├─ Formas de pago aceptadas
                  └─ Toggle "Cerrado temporalmente"
```

**Navegación principal:** Sidebar izquierdo persistente con 4 ítems: **Pedidos** (default), **Catálogo**, **Domiciliarios**, **Configuración**.

### Cocina (tablet montada)

```
[Login simplificado]
  └─ [Vista única: Grid de Tiquetes activos]
        └─ [Tap en Tiquete → confirmación "¿Listo?" → Tiquete desaparece]
```

**Sin navegación.** Una sola vista. Botón de logout discreto en esquina (escondido detrás de tap largo para evitar logout accidental).

### Domiciliario (móvil)

```
[Login]
  └─ [Lista de Entregas Asignadas]
        └─ [Entrega seleccionada]
              ├─ Ver dirección + abrir en Maps
              ├─ Llamar al Cliente
              └─ Marcar "Entregado"
```

**Navegación principal:** Sin tabs. Una sola lista. Tap en entrega abre detalle full-screen con botón gigante "Entregado" abajo.

### Admin Plataforma (web)

```
[Login]
  └─ [Dashboard]
        ├─ [Lista de Comercios]
        │     ├─ [Crear nuevo Comercio]
        │     └─ [Comercio detalle: estado suscripción, métricas básicas]
        └─ [Métricas globales] (opcional MVP)
```

**Surface más simple.** Solo juanpis. UI tipo dashboard tradicional con tabla.

## Voice and Tone

### Principios

- **Cercano, no corporativo.** "Listo, Don Luis recibió tu pedido" ✅ vs "Su orden ha sido recibida exitosamente" ❌
- **Directo, sin jerga.** "Tu pedido está en cocina" ✅ vs "Estado: EN_PREPARACION" ❌
- **Cálido pero no infantil.** Trato de "tú", no de "usted". Alineado con informalidad antioqueña.
- **Operacional para Mostrador, conversacional para Cliente.** El Mostrador necesita info dura ("7 pedidos en cola, 3 esperando pago"). El Cliente necesita lenguaje humano ("Don Luis ya está preparando tu pedido").

### Microcopy por Estado del Pedido

Notificación push al Cliente, indexada por Estado:

| Estado anterior | Estado nuevo | Push notification (Cliente) |
|---|---|---|
| (creado) | `pendiente_pago` | (sin push — el cliente está en la app) |
| `pendiente_pago` | `validando_pago` | "Recibimos tu comprobante. {Comercio} lo está validando." |
| `validando_pago` | `en_cocina` | "{Comercio} confirmó tu pago. Tu pedido está en cocina." |
| `en_cocina` | `listo` (pickup) | "Tu pedido está listo. Pasa a recogerlo." |
| `en_cocina` | `en_domicilio` (domicilio) | "Tu pedido salió a domicilio. Llega en {tiempo_estimado}." |
| `en_domicilio` | `entregado` | "Tu pedido fue entregado. ¡Buen provecho!" |
| cualquiera | `cancelado` | "{Comercio} canceló tu pedido. Motivo: {motivo_texto}." |

### Microcopy en estados vacíos

- Cliente sin pedidos: *"Aún no has pedido nada. ¡Echa un vistazo a los comercios disponibles!"*
- Mostrador sin pedidos: *"Sin pedidos en cola. Esto está más tranquilo que un lunes."*
- Cocina sin tiquetes: *"Sin pedidos en cocina. Buen momento para tomar agua. 💧"*
- Domiciliario sin entregas: *"Sin entregas asignadas. Don Luis te avisará cuando salga la próxima."*

### Errores

| Situación | Copy |
|---|---|
| Sin conexión | "Sin conexión. Vuelve a intentar en un momento." |
| Error 500 | "Algo salió mal. No es tu culpa. Inténtalo de nuevo." |
| Validación form | "Falta el nombre del producto." (específico, accionable) |
| OTP expirado | "El código ya venció. Te enviamos uno nuevo." |

### Lo que NO hacemos

- ❌ Lenguaje técnico ("token expirado", "404 not found")
- ❌ Gamificación falsa ("¡Ganaste 50 puntos!" cuando no hay programa de puntos)
- ❌ Emojis decorativos en mensajes importantes (sí en empty states amigables)
- ❌ Mayúsculas para "enfatizar" (uso quirúrgico para tags como `LISTO` en Cocina)

## Component Patterns (behavioral)

*Especificaciones visuales en `DESIGN.md`. Aquí solo el delta de comportamiento.*

### `pedido-card` (Mostrador Cola FIFO)

- **Click/tap:** Expande detalle del Pedido en panel lateral derecho (landscape) o full-screen drawer (portrait).
- **Sin hover-states funcionales** — es interfaz táctil principalmente.
- **El click NO mueve el Pedido en la cola** (FIFO estricto — FR-14).
- **Long-press:** No usado. Evitar conflictos con scroll.

### `pedido-card-nuevo` (variante destacada)

- **Animación de entrada:** Slide-in desde abajo, 300ms ease-out.
- **Alerta sonora:** Sonido discreto al entrar (configurable on/off en Configuración del Comercio).
- **Transición a estado normal:** Después de 5 segundos O después de que el Mostrador haga click (lo que ocurra primero). Border + background regresan a defaults.

### `status-badge`

- **No interactivo** — solo lectura.
- **Texto:** Estado en lenguaje natural ("En cocina", "Listo", "En domicilio") — NO el id técnico (`en_cocina`).

### `tiquete-cocina` (vista Cocina)

- **Tap único:** Muestra modal de confirmación "¿Listo?".
- **Confirmación:** Modal con botones grandes (min 80px alto): "Sí, listo" (verde) / "Cancelar". Tap fuera del modal cancela.
- **Después de confirmar:** Tiquete hace fade-out (200ms), desaparece de la vista.
- **Sin botones de "Editar pedido" desde Cocina** — Lucía no edita. Si hay problema, llama a Don Luis verbalmente.

### Botón "Entregado" (Domiciliario)

- **Tamaño:** Mínimo 64px de alto (fácil tap con guantes/manos sucias).
- **Posición:** Fijo abajo de la pantalla (sticky bottom).
- **Confirmación:** Modal ligero ("¿Confirmar entrega?") con 2 botones grandes. Sin necesidad de foto/firma en MVP.

### Botón "Confirmar Pago" / "Rechazar Pago" (Mostrador)

- **Diseño:** Lado a lado, ambos grandes (min 48px alto).
- **Confirmar Pago:** UN solo tap. Sin modal de confirmación (es la acción "happy path" y el Mostrador la hace seguido).
- **Rechazar Pago:** DOS taps. Primer tap abre input de motivo (textarea, max 140 char). Segundo tap (botón "Enviar") confirma rechazo.
- **Asimetría intencional:** Confirmar = fast path (un tap), Rechazar = friction path (dos taps).

## State Patterns

### Estados universales (todas las surfaces)

| Estado | Patrón visual |
|---|---|
| **Loading inicial** | Skeleton screens (no spinners) usando el componente shadcn `Skeleton`. |
| **Loading inline** | Spinner pequeño (shadcn) reemplaza el texto del botón mientras se procesa. |
| **Empty state** | Ilustración minimalista (texto + emoji opcional) + acción primaria si aplica. |
| **Error de red** | Toast persistente con botón "Reintentar". |
| **Error de validación** | Inline bajo el field afectado, rojo `{colors.destructive}`. |
| **Éxito** | Toast efímero verde (auto-dismiss 3s). |
| **Conexión recuperada** | Toast efímero discreto "Conexión recuperada" + auto-refresh de la vista. |

### Estados específicos del Pedido

Cada Estado del Pedido tiene representación visual mediante `status-badge` (ver Component Patterns) y notificación al Cliente (ver Voice and Tone).

### Loading vs Optimistic UI

- **Acciones críticas (validar pago, confirmar pedido):** NO optimistic. Mostrar spinner hasta confirmación del servidor. La plata no admite errores silenciosos.
- **Acciones operativas (cambiar Estado, marcar listo):** Optimistic UI — la vista actualiza inmediato, rollback si el servidor falla con toast de error.
- **Auto-refresh:** Cola FIFO del Mostrador y vista Cocina usan websockets o polling cada 10s (FR-20). NO auto-refresh en Cliente — eso es invasivo.

## Interaction Primitives

### Inputs

- **Texto:** shadcn `Input` default. Foco con `{colors.ring}` (heredado).
- **Adición Libre (FR-10):** Textarea con contador de caracteres visible cuando excede 200/280 (último 30%).
- **Comprobante de pago (upload):** Área drag-and-drop en desktop / botón "Tomar foto / Elegir de galería" en móvil. Preview de la imagen subida antes de confirmar.

### Selección

- **Productos en carrito:** Stepper +/- para cantidad. Tap directo en producto agrega 1 por default.
- **Adiciones Estructuradas:** Checkbox shadcn con label que incluye precio adicional ("Extra queso +$2.000").
- **Modalidad de Entrega:** Radio buttons grandes (no select dropdown) — solo 2 opciones, mejor visibles.

### Navegación

- **Cliente:** Bottom tab bar persistente (3 tabs). Stack navigation dentro de cada tab.
- **Mostrador:** Sidebar persistente (4 items). Sin stack profundo — máximo 2 niveles.
- **Cocina:** Sin navegación. Una vista única.
- **Domiciliario:** Sin navegación. Lista + detalle.
- **Atrás:** Botón back-arrow visible en todas las vistas internas. NO confiar solo en gesto del navegador.

### Gestos

- **Swipe-to-refresh:** Solo en Cola FIFO del Mostrador y lista de Pedidos del Cliente.
- **Swipe-to-dismiss:** NO usado en MVP (puede generar acciones destructivas accidentales).
- **Long-press:** NO usado.

### Feedback táctil / sonoro

- **Vibración:** Pedido nuevo en Cola FIFO → vibración corta (50ms) en tablet/móvil.
- **Sonido:** Pedido nuevo → notificación sonora discreta. Configurable on/off por Comercio.

## Accessibility Floor

Cumplimiento mínimo: **WCAG 2.1 AA** en las superficies del Cliente. Las superficies del Comercio (Mostrador/Cocina/Domiciliario) cumplen los mismos estándares por simetría — son personas reales con posibles limitaciones también.

### Específicos

- **Contraste:** Todos los pares background/foreground cumplen ≥ 4.5:1 (texto normal) o ≥ 3:1 (texto grande). Especial atención a `status-badge` sobre fondos claros.
- **Touch targets:** Mínimo 44x44px en superficies táctiles. Vista Cocina y botón "Entregado" del Domiciliario van más arriba (mín 64-80px).
- **Foco visible:** shadcn `ring` heredado en todos los elementos interactivos.
- **Navegación por teclado:** Tab order lógico. Esc cierra modals. Enter confirma acciones primarias.
- **Screen readers:** `aria-label` en botones icon-only. Estados anunciados al cambiar ("Pedido nuevo recibido"). Imágenes (catálogo, comprobantes) con `alt` texto significativo.
- **Idioma:** `<html lang="es">` en todas las páginas.
- **Tamaño tipográfico:** Usuario puede aumentar zoom hasta 200% sin pérdida de funcionalidad.
- **Sin contenido dependiente solo de color:** Status badges tienen texto Y color. Errores tienen ícono Y color.
- **Animaciones:** Respetar `prefers-reduced-motion` — desactivar slide-in del pedido nuevo, usar fade simple en su lugar.

## Key Flows

Flows derivados de los User Journeys del PRD (UJ-1 a UJ-5). Cada flow tiene un **clímax** que es el momento donde se entrega valor.

### Flow F-1: María pide el almuerzo del trabajo

**Persona:** María, secretaria en notaría, 12:00 m, 30 min de almuerzo.
**Surfaces:** Cliente (móvil).
**Realiza:** UJ-1 del PRD.

1. María abre la PWA — ya autenticada (sesión activa). Aterriza en Home con lista de Comercios de Barbosa.
2. Tap en "Restaurante Don Luis". Ve el Catálogo.
3. Tap en "Almuerzo del día — $15.000". Modal con Adiciones Estructuradas (ninguna seleccionada).
4. Tap "Agregar al carrito". Botón flotante "Ver carrito (1)" aparece abajo.
5. Tap "Ver carrito". Pantalla de carrito con el item + campo "¿Algo más? (opcional)" donde escribe *"sin cebolla, doble arepa"* (FR-10 Adición Libre).
6. Tap "Continuar". Pantalla de Modalidad: selecciona "Domicilio". Confirma dirección guardada.
7. Tap "Continuar a pago". Elige "Pago por transferencia". Ve los datos de Nequi de Don Luis + botón "Ya transferí, subir comprobante".
8. María sale a Nequi, transfiere, vuelve a la PWA. Tap "Subir comprobante". Toma foto del screenshot. Confirma.
9. **🎯 CLÍMAX:** Pantalla de "Esperando confirmación de Don Luis" con animación sutil. Sabe que ya hizo su parte.
10. ~2 min después, push: *"Don Luis confirmó tu pago. Tu pedido está en cocina."*
11. ~20 min después, push: *"Tu pedido salió a domicilio. Llega en 5-10 min."*
12. María recibe el domicilio. Push: *"Tu pedido fue entregado. ¡Buen provecho!"*

**Edge case:** Si María cierra la app antes de subir el comprobante, el Pedido queda en `pendiente_pago` 30 min y se cancela automático. María no recibe push de cancelación (no era un compromiso firme aún).

### Flow F-2: Carlos pide pizza para recoger

**Persona:** Carlos, 26 años, viene de la oficina en bici.
**Surfaces:** Cliente (móvil).
**Realiza:** UJ-2 del PRD.

1. Carlos abre la PWA. Tap "Pizzería La Esquina".
2. Tap "Pizza Familiar Mixta — $35.000". Sin adiciones.
3. Va al carrito. Selecciona Modalidad: **"Recoger en local"**.
4. Forma de pago: "Pago en local al recoger" (porque el Comercio lo habilitó en su configuración).
5. Tap "Confirmar pedido". Pantalla: *"Pedido recibido. Te avisamos cuando esté lista. Tiempo estimado: 25 min."*
6. **🎯 CLÍMAX:** ~25 min después, push: *"Tu pizza está lista. Pasa a recogerla."*
7. Carlos llega, dice su nombre. Don Luis confirma manualmente en su lado.
8. (No hay push de "entregado" en pickup — se asume entregado cuando Don Luis lo marca).

### Flow F-3: Don Luis procesa hora pico

**Persona:** Don Luis, dueño/Mostrador. Viernes 7:30 pm.
**Surfaces:** Mostrador (tablet detrás de caja).
**Realiza:** UJ-3 del PRD.

1. Don Luis está en la vista **Cola FIFO de Pedidos**. Ve 7 pedidos en cola, el más viejo arriba.
2. Pedido nuevo entra: vibración + sonido discreto + slide-in del `pedido-card-nuevo` (background naranja suave). Al pie de la lista.
3. Don Luis hace tap en el primer pedido de la cola (Estado `validando_pago`). Panel lateral derecho muestra:
   - Items pedidos
   - Comprobante de pago subido por el Cliente
   - Botón grande "Confirmar pago" + botón "Rechazar pago"
4. Don Luis abre Nequi en otra ventana del navegador (split screen en tablet o pestaña), confirma que llegó la plata.
5. Vuelve a la app. **🎯 CLÍMAX:** Tap en "Confirmar pago" (UN tap). El Pedido instantáneamente pasa a `en_cocina`, el `status-badge` cambia a naranja, María recibe push, el Tiquete aparece en la pantalla de Cocina.
6. El Pedido desaparece del foco del Mostrador (queda en la cola como `en_cocina` pero sin acción pendiente). Don Luis ya está procesando el siguiente.
7. Más tarde, cuando Lucía marca el Pedido como `listo` (desde Cocina), Don Luis recibe alerta visual en la card del Pedido. Tap en el Pedido, panel lateral: botón "Asignar a Domiciliario" con dropdown (Pedro, Juan, etc.).
8. Don Luis selecciona "Pedro". Pedido cambia a `en_domicilio`. Aparece en la vista de Pedro instantáneamente.

### Flow F-4: Lucía marca el pedido listo

**Persona:** Lucía, cocinera. Manos ocupadas, ve la pantalla desde 2-3m.
**Surfaces:** Cocina (tablet montada).
**Realiza:** UJ-4 del PRD.

1. Lucía ve 4 Tiquetes activos en grid. El de María dice (tipografía grande):
   - Título: "Almuerzo del día"
   - Body: "Sin cebolla, doble arepa"
   - Tag pequeño: "PARA DOMICILIO"
2. Lucía prepara el plato.
3. Cuando termina, se acerca a la pantalla y hace tap en el Tiquete.
4. Modal grande aparece: *"¿Listo el almuerzo del día?"* con botones gigantes: **"Sí, listo"** (verde) / **"Cancelar"**.
5. **🎯 CLÍMAX:** Tap "Sí, listo". Modal cierra, Tiquete hace fade-out, desaparece del grid.
6. Don Luis (Mostrador) recibe alerta visual de que ese Pedido está listo para asignar a Domiciliario.

### Flow F-5: Pedro entrega el almuerzo

**Persona:** Pedro, domiciliario fijo de Don Luis (11am-3pm).
**Surfaces:** Domiciliario (móvil).
**Realiza:** UJ-5 del PRD.

1. Pedro tiene la PWA abierta en su celular. Ve "Sin entregas asignadas".
2. Don Luis le asigna el Pedido de María. Vibración + push: *"Tienes una entrega nueva. Almuerzo para María — Calle 12 #34-56."*
3. Pedro abre la app. Ve el Pedido en la lista (una sola card grande).
4. Tap en la card. Detalle full-screen:
   - **Cliente:** María
   - **Dirección:** Calle 12 #34-56 Barrio Centro [botón "Abrir en Maps"]
   - **Teléfono:** [botón "Llamar a María"]
   - **Items:** Almuerzo del día (sin cebolla, doble arepa)
   - **Pago:** Ya pagó por transferencia (no cobrar)
   - **Botón gigante abajo (sticky bottom):** "Entregado"
5. Pedro monta en la moto y va. (Opcionalmente llama a María si no encuentra la dirección).
6. Al entregar, abre la app. **🎯 CLÍMAX:** Tap "Entregado". Modal: *"¿Confirmar entrega?"*. Tap "Sí". Vuelve a la lista vacía. María recibe push de entregado.

**Edge case:** Si el pago era `efectivo_recibir`, el detalle del Pedido muestra destacado en grande **"COBRAR: $15.000"** antes del botón "Entregado". La app no valida que Pedro cobró — es responsabilidad de Pedro y de Don Luis.

## Responsive & Platform

### Breakpoints (heredados de Tailwind)

| Breakpoint | Min width | Surfaces que aplican |
|---|---|---|
| `sm` | 640px | Cliente, Domiciliario (raro — son siempre < 640px) |
| `md` | 768px | Mostrador portrait (tablet) |
| `lg` | 1024px | Mostrador landscape, Cocina, Admin |
| `xl` | 1280px | Admin desktop |

### Comportamiento por surface

- **Cliente (móvil < 640px):** Layout fijo móvil. Si abre en desktop, mantiene max-w-md centrado — NO se expande.
- **Mostrador (768-1024px portrait):** Sidebar colapsa a sheet drawer. Cola FIFO ocupa todo el ancho. Detalle del Pedido se abre en bottom sheet en lugar de panel lateral.
- **Mostrador (1024px+ landscape):** Sidebar persistente. Two-column Cola + Detalle.
- **Cocina (cualquier tablet):** Grid 2 columnas. En TV 4K conectada (1920px+): Grid 3 columnas.
- **Domiciliario (móvil):** Single-column, max-w-md. Si abre en tablet, ignora el espacio extra.
- **Admin (768px+):** Tabla densa, sidebar fijo. Si abre en móvil, redirige a "Usa un computador para gestionar".

### Orientación

- **Mostrador:** Soporta ambas, optimizado para landscape.
- **Cocina:** Soporta ambas, optimizado para landscape en tablet 10".
- **Cliente y Domiciliario:** Solo portrait (lock CSS).

## Inspiration & Anti-patterns

### Inspiración (lo que admiramos sin copiar)

- **Linear** — minimalismo funcional, color de marca quirúrgico, tipografía neutra.
- **Square POS / Toast** — densidad operacional sin sentirse abrumador. Botones grandes para acciones críticas.
- **Notion** — voz cercana, copy claro, sin jerga técnica.

### Anti-patrones (lo que rechazamos)

- **Rappi / Uber Eats** — UI saturada de promociones, gamificación, push notifications de marketing constantes. NO somos eso.
- **Skip dialogs everywhere** — modales de confirmación para todo. Solo donde hay riesgo real (rechazar pago, cancelar pedido).
- **Onboarding tutorials largos** — no usar. Cada surface debe ser auto-explicativa con copy claro y empty states descriptivos.
- **Notificaciones de marketing** — push solo para estados reales del Pedido. NO "¡Restaurantes nuevos cerca!" ni "Don Luis tiene una promoción".
- **Animaciones decorativas** — animaciones solo cuando comunican algo (pedido nuevo entra, tiquete listo desaparece). No "porque queda bonito".

---

## Notas finales

Este EXPERIENCE.md es **peer de `DESIGN.md`** — leerlos juntos. EXPERIENCE.md tiene autoridad sobre comportamiento, DESIGN.md sobre identidad visual. En conflicto entre spines y cualquier mockup/wireframe futuro: **los spines ganan**.

Cualquier surface no documentada explícitamente aquí hereda los patrones de la surface más cercana de su rol (ej: cualquier vista nueva del Mostrador hereda sidebar nav + behavior de cards). Componentes shadcn no mencionados heredan comportamiento default.
