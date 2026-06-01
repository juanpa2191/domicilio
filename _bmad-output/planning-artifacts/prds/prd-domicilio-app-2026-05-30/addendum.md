# Addendum — Domicilios Norte Aburrá PRD

Documento complementario al PRD principal. Contiene profundidad técnica, alternativas consideradas, justificaciones de decisiones y contexto que el PRD no debe cargar pero que es valioso preservar para los workflows downstream (UX, arquitectura, implementación).

---

## A.1 — Justificación de PWA como form-factor

### Alternativas consideradas

| Opción | Pros | Contras | Veredicto |
|---|---|---|---|
| **PWA (web)** | 1 codebase, sin App Store/Play Store, deploy instantáneo, sin fees de plataforma, mantenimiento simple | Push en iOS limitado a iOS 16.4+, no acceso a algunas APIs nativas | ✅ **ELEGIDA** |
| **React Native** | Compartir lógica entre iOS/Android, mejor performance que PWA | Necesita publicar en stores (fee Apple $99/año, Play $25 único), revisiones, complejidad | ❌ Solo developer no lo sostiene |
| **Apps nativas (Swift/Kotlin)** | Mejor performance, mejor UX | 2 codebases, 2x tiempo de mantenimiento | ❌ Imposible para solo developer |
| **App híbrida (Capacitor)** | PWA empaquetada como app nativa | Lo peor de ambos mundos (complejidad + limitaciones) | ❌ |

### Implicaciones de elegir PWA
- Limitación de soporte: iOS 16.4+ y Android 9+ (alineado con restricción del usuario).
- Service Workers necesarios para push notifications.
- Manifest correcto para que el usuario pueda "instalar" la PWA desde el navegador.
- Diseño responsive obligatorio (mismo código en móvil, tablet, TV de cocina).

---

## A.2 — Stack técnico sugerido (a confirmar en `bmad-create-architecture`)

### Frontend
- **Framework:** Next.js 15+ (App Router) — SSR, optimización automática, ecosistema maduro.
- **Styling:** Tailwind CSS + shadcn/ui — componentes pre-estilizados sin necesidad de diseñador.
- **State management:** TanStack Query (server state) + Zustand (client state ligero).
- **Forms:** React Hook Form + Zod (validación).

### Backend / Database
- **Opción A (recomendada):** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions).
  - Pros: BaaS completo, realtime para Cola FIFO, auth con OTP integrado, storage para comprobantes, RLS para seguridad multi-tenant.
  - Contras: Lock-in moderado a Supabase.
- **Opción B:** Firebase (Firestore + Auth + Storage + Cloud Functions).
  - Pros: Madurez de Google, push notifications integradas (FCM).
  - Contras: NoSQL puede complicar reportes; costos pueden escalar mal.

### Servicios externos
- **SMS OTP:** Twilio Verify, MessageBird, o AWS SNS (validar costo en Colombia).
- **Push notifications:** Web Push API (estándar) o FCM (Firebase Cloud Messaging).
- **Hosting frontend:** Vercel (deploy automático desde Git, free tier generoso).
- **Monitoreo:** Sentry (errores) + Vercel Analytics (performance).

### Estimación de costos mensuales (MVP, 1-3 comercios)
| Servicio | Costo estimado |
|---|---|
| Vercel (Hobby plan) | $0 |
| Supabase (Free → Pro $25/mo cuando crezca) | $0-100k COP |
| SMS OTP (~50-100 SMS/mes inicial) | $5-15k COP |
| Sentry (Developer plan) | $0 (10k events/mes free) |
| Dominio | $5k COP/mes (anualizado) |
| **TOTAL estimado MVP** | **~$10-130k COP/mes** |

A escala (25 comercios, ~500 pedidos/día):
- Vercel Pro: ~$80k COP/mes
- Supabase Pro: ~$100k COP/mes
- SMS: ~$50-100k COP/mes
- Sentry: ~$0 (probablemente aún free tier)
- **TOTAL ~$230-280k COP/mes** (bajo el límite de $500k COP/mes en NFR §9.5)

---

## A.3 — Modelo de datos sugerido (alto nivel)

### Entidades principales
```
Comercio (id, nombre, dirección, horario, fotos, configuración_pagos, activo, fecha_inicio_gratis, fecha_fin_gratis, estado_suscripción)
  ↓ 1:N
UsuarioComercio (id, comercio_id, email, rol [MOSTRADOR|COCINA], nombre)

Comercio
  ↓ 1:N
Producto (id, comercio_id, nombre, precio, descripción, foto_url, disponible)
  ↓ 1:N
AdicionEstructurada (id, producto_id, nombre, precio_adicional)

Cliente (id, celular, nombre, fecha_creación)
  ↓ 1:N
DireccionGuardada (id, cliente_id, dirección_texto, alias, default)

Pedido (id, cliente_id, comercio_id, modalidad [DOMICILIO|RECOGER],
        forma_pago [TRANSFERENCIA|EFECTIVO_RECIBIR|EFECTIVO_LOCAL],
        estado, adicion_libre, dirección_entrega, fecha_creación, fecha_actualización)
  ↓ 1:N
ItemPedido (id, pedido_id, producto_id, cantidad, precio_unitario_snapshot,
            adiciones_seleccionadas [JSON])

Pedido
  ↓ 0:1
ComprobantePago (id, pedido_id, imagen_url, fecha_subida)

Pedido
  ↓ 1:N
HistorialEstado (id, pedido_id, estado_anterior, estado_nuevo, timestamp, actor_id, motivo)
```

### Decisiones de modelado relevantes
- `precio_unitario_snapshot` en ItemPedido: capturar precio al momento del pedido. Si el Comercio cambia precio del Catálogo después, los pedidos viejos mantienen el precio original.
- `adiciones_seleccionadas` como JSON: simplifica vs tabla relacional adicional. Tradeoff: más difícil de queryear, pero el caso de uso es read-only por pedido.
- `HistorialEstado`: auditoría completa, útil para análisis y debugging. Esencial.
- Multi-tenancy con Row Level Security (Supabase RLS): cada Comercio solo ve sus propios datos.

---

## A.4 — Casos de uso de edge / errores que el PRD no detalla

### Edge cases del MVP

1. **Cliente sube imagen no válida como comprobante** (foto de un gato, comprobante de otra transacción, etc.).
   - Solución MVP: validación humana del Comercio. Comercio rechaza con motivo. Cliente recibe notificación.
   - Mejora futura: OCR para extraer monto y verificar contra el total del Pedido.

2. **Comercio NO valida el pago en X tiempo** (cliente queda esperando).
   - Solución MVP: timer visual al Comercio ("Pedido pendiente desde hace 5 min"). Sin escalación automática.
   - Mejora futura: notificación push al Comercio si lleva 10+ min sin validar.

3. **Cliente cierra la app antes de subir el comprobante.**
   - Solución MVP: Pedido en `pendiente_pago` durante 30 min, después se cancela automáticamente (cron job).
   - Comercio no ve estos Pedidos abandonados en la Cola.

4. **Dos miembros del Comercio (rol Mostrador) actúan sobre el mismo Pedido al tiempo.**
   - Solución MVP: optimistic UI + last-write-wins en el backend. Conflicto raro en 1 comercio piloto.
   - Mejora futura: locking por Pedido cuando uno está siendo procesado.

5. **El comprobante está cifrado / almacenado, pero alguien intenta acceder sin autorización.**
   - Solución MVP: URLs firmadas con tiempo de expiración (Supabase Storage signed URLs).

6. **PWA pierde conexión en medio del flujo del Cliente.**
   - Solución MVP: mensaje claro de "Sin conexión, intenta de nuevo". NO hay queue offline.

### Errores operativos esperados

- **OTP no llega:** Botón "Reenviar OTP" después de 30 segundos. Después de 3 intentos, sugerir contactar soporte.
- **Push notification no llega:** Cliente puede ver el estado al abrir la app (fallback). No es bloqueante.
- **Comercio olvidó marcar Pedido como `entregado`:** No bloqueante. La Cola muestra el Pedido como "en domicilio desde hace 1 hora" con visual de alerta.

---

## A.5 — Consideraciones de Habeas Data (Ley 1581 de 2012)

### Datos personales que recolectamos
- **Cliente:** nombre, celular, dirección(es) de entrega, historial de pedidos.
- **Usuario Comercio:** email, nombre, contraseña (hash).
- **Datos transaccionales:** Pedidos, comprobantes de pago (imagen).

### Obligaciones derivadas de la ley
1. **Autorización previa:** Checkbox + link a Política de Privacidad al registrarse. NO pre-marcado.
2. **Finalidad explícita:** La Política debe declarar para qué se usan los datos (procesar pedidos, comunicar estados, soporte).
3. **Derecho de acceso, rectificación, supresión:** El Cliente puede solicitar (manual en MVP, vía email a soporte).
4. **No transferencia a terceros sin autorización:** No vendemos datos. Solo se comparten con el Comercio respectivo (que YA es parte de la transacción).
5. **Seguridad:** Cifrado en tránsito (HTTPS) y reposo (Supabase encripta por defecto).
6. **Notificación de incidentes:** Si hay brecha, notificar a la SIC en 15 días hábiles.

### Acciones requeridas
- Redactar política de privacidad (template + asesoría legal puntual recomendada).
- Implementar checkbox de consentimiento en registro.
- Implementar página de "Solicitar eliminación de mis datos" (puede ser un mailto: para MVP).
- Documentar el proceso interno de respuesta a solicitudes de Habeas Data.

### Lo que NO necesitamos en MVP
- Registro como Responsable de Datos Personales en la SIC (obligatorio solo si manejamos > 100k registros — irrelevante para piloto).
- Designación formal de Oficial de Privacidad (no obligatorio para tamaño actual).
- Auditoría externa de cumplimiento.

---

## A.6 — Análisis de competencia (contexto para posicionamiento)

### Rappi
- **Modelo:** Marketplace, comisión 25-30% por pedido al Comercio + fee al Cliente.
- **Presencia en Barbosa:** Limitada (no opera bien fuera de Medellín metro).
- **Diferenciador nuestro:** Fijo mensual, foco en pueblos, anti-gig.

### Uber Eats
- **Modelo:** Igual que Rappi.
- **Presencia en Antioquia:** Concentrado en Medellín metro.

### DiDi Food
- **Modelo:** Marketplace.
- **Presencia:** Salió de Colombia en 2023. Vacío en el mercado.

### Apps locales / iniciativas similares
- A investigar: ¿Hay alguna app local en Barbosa o pueblos cercanos? (input pendiente del usuario).
- Históricamente algunas iniciativas regionales surgen pero mueren por sostenibilidad.

### "Competencia" real: WhatsApp
- El verdadero status quo. No es "la mejor opción", es "la única que estaba ahí".
- El insight del brainstorming: ganó por default, no por mérito.

---

## A.7 — Lo que se difirió a Fase 2 / 3 (con justificación)

### Fase 2 (post-MVP exitoso, meses 4-9)
- **Convenios con cooperativas de domiciliarios locales** — Requiere negociación + tiempo + estructura legal. MVP sin esto.
- **Integración WhatsApp Business para notificaciones** — Push primero, validar si efectivamente falla con cierto % de usuarios.
- **Activación de farmacias** — Segundo vertical. Requiere análisis de regulación adicional (medicamentos de venta libre vs. controlados).
- **Cobro automático de suscripción** — Integración con pasarela tipo Wompi o ePayco. Solo cuando haya 5+ comercios pagando recurrente.
- **Dashboard de métricas para el Comercio** — Después de validar qué métricas le interesan al comercio real.
- **Integración con facturación electrónica (Siigo, Alegra)** — Cuando el comercio piloto lo pida explícitamente.

### Fase 3 (escala, mes 10+)
- **Replicación a municipios cercanos** — Bello, Copacabana, Girardota, Don Matías.
- **Tracking GPS de domiciliarios** — Cuando el volumen lo justifique.
- **App nativa o React Native** — Solo si PWA muestra limitaciones críticas.
- **Multi-tenant operations** — Soportar > 100 comercios concurrentes con buena performance.

---

## A.8 — Riesgos identificados (no en PRD, pero registrados)

### Riesgo R-1: El comercio piloto NO valida la propuesta de valor
- **Impacto:** Alto. Si el primer restaurante no quiere pagar después de 2 meses gratis, el modelo está roto.
- **Mitigación:** Conversación cualitativa intensiva en semana 1 con 5 restaurantes ANTES de construir. Validar disposición a pagar con un compromiso verbal.

### Riesgo R-2: SMS OTP es prohibitivamente caro
- **Impacto:** Medio. Cambia el flujo de registro del cliente.
- **Mitigación:** Validar costos en semana 1. Tener alternativa lista (email/contraseña o WhatsApp OTP).

### Riesgo R-3: Solo developer = punto único de falla
- **Impacto:** Alto a largo plazo. Si juanpis se enferma/desaparece, no hay quien atienda.
- **Mitigación:** Documentación clara desde el día 1. Considerar buscar un cofundador técnico en Fase 2.

### Riesgo R-4: Volumen real en Barbosa es menor al asumido
- **Impacto:** Alto para unit economics. Si solo hay 8 restaurantes adoptables, no 30-60, el TAM colapsa.
- **Mitigación:** Mapeo real de comercios en semana 1.

### Riesgo R-5: Rappi entra a pueblos antes que tú escales
- **Impacto:** Medio. Rappi tiene recursos infinitos.
- **Mitigación:** El modelo es estructuralmente distinto (fijo vs comisión). Aún si Rappi llega, no resuelve el dolor del comerciante. El moat es cultural + económico, no técnico.

---

## A.9 — Personas extendidas (contexto para UX y empatía)

### Persona 1: "Don Luis" — Dueño/Mostrador del Restaurante
- **Edad:** 45-55 años.
- **Rol:** Dueño del Restaurante Don Luis, atiende caja y a veces cocina.
- **Tecnología:** Usa WhatsApp diariamente, sabe pagar con Nequi, no muy técnico pero no es analfabeta digital.
- **Dolor actual:** En hora pico (almuerzo 12-2pm, cena 7-9pm) el celular del negocio explota. Se pierden pedidos. Reclamos.
- **Motivación de pago:** "Que dejen de explotarme el WhatsApp y se me pierdan pedidos."
- **No quiere:** Aprender una herramienta complicada. Una app más en su celular.

### Persona 2: "Lucía" — Cocinera del Restaurante
- **Edad:** 30-40 años.
- **Rol:** Prepara los pedidos. Trabaja en la cocina, no atiende clientes.
- **Tecnología:** Sabe usar smartphone básico. No le gusta complicarse.
- **Dolor actual:** No se entera bien de qué pedidos van. Don Luis le grita los pedidos. Errores frecuentes con adiciones.
- **Motivación:** Que los pedidos lleguen claros, escritos, sin tener que preguntar.
- **No quiere:** Una pantalla compleja. Quiere ver el pedido grande, claro, y un botón "listo".

### Persona 3: "María" — Cliente trabajadora
- **Edad:** 28-40 años.
- **Rol:** Trabaja en una oficina/notaría/banco en Barbosa.
- **Tecnología:** Usa apps a diario (WhatsApp, Instagram, Bancolombia, Nequi).
- **Dolor actual:** Llamar al restaurante para pedir es incómodo. WhatsApp es lento, a veces no contestan, tiene que mandar foto del comprobante, etc.
- **Motivación:** Pedir rápido. Saber cuánto demora. Sin sorpresas.
- **No quiere:** Otra app más que ocupe espacio. Que sea lenta o complicada.

### Persona 4: "Carlos" — Cliente joven
- **Edad:** 22-30 años.
- **Rol:** Trabaja, estudia, vive en Barbosa o cerca.
- **Tecnología:** Nativo digital. Pediría todo por app si pudiera.
- **Motivación:** Conveniencia. A veces pickup, a veces domicilio.
- **No quiere:** Pagar comisiones absurdas como en Rappi.

---

## A.10 — Voz y tono del producto (input para UX)

### Voz
- **Cercana**, no corporativa. Es un producto del pueblo.
- **Directa**, sin jerga técnica. "Tu pedido está listo" no "Su orden #4392 está en estado COMPLETED".
- **Cálida** pero no infantilizante. Trato de "tú", no de "usted" (alineado con la informalidad antioqueña).

### Ejemplos de copy
| Situación | ❌ Evitar | ✅ Preferir |
|---|---|---|
| Pedido confirmado | "Su pedido ha sido recibido exitosamente" | "Listo, Don Luis recibió tu pedido" |
| En cocina | "Su pedido está en estado: EN_PREPARACION" | "Tu pedido está en cocina" |
| Listo | "Su orden está completada" | "Tu pedido salió a domicilio" / "Tu pizza ya está lista para recoger" |
| Error | "Error 500. Intente de nuevo" | "Algo salió mal. Vuelve a intentarlo en un momento" |

### Tono visual (input para UX, a confirmar)
- Colores: cálidos pero no infantiles. Sugerencia: paleta inspirada en el pueblo antioqueño (verde montaña + amarillo café + acentos cálidos).
- Tipografía: legible, redondeada. Inter, Geist, o similar.
- Sin "gamificación" innecesaria (no badges, no streaks).

---

## A.11 — Open questions extendidas (referencia)

Estas se referencian en el PRD §8 pero aquí se elaboran:

### OQ-2 extendida: Costo real de OTP por SMS
- Twilio Verify: ~$0.05 USD por OTP (~$200 COP/mensaje).
- Si 50 comercios en Fase 2 con 10 clientes/día cada uno = ~500 OTPs/día = ~$3M COP/mes solo en SMS. **Insostenible.**
- Alternativas:
  - Email + contraseña (lo más simple, pero requiere que el cliente recuerde contraseña).
  - WhatsApp Business API OTP (más barato, ~$0.01 USD por mensaje).
  - OTP solo en primer registro, después login con biométrico.

### OQ-4 extendida: Devolución de pedido cancelado post-pago
- Caso: Cliente transfirió $30k, Comercio validó. Después algo pasa (se acabó el producto, error, etc.). Cancelan.
- Si la app no maneja la devolución, ¿cómo se hace?
- Opciones:
  - A) Manual: Comercio le transfiere de vuelta al Cliente fuera de app.
  - B) Crédito: El Cliente queda con $30k de crédito para su próximo pedido en ese Comercio.
  - C) App media: tracking de "saldos pendientes" entre Comercio y Cliente.
- MVP asume opción A. Validar con el primer comercio piloto.
