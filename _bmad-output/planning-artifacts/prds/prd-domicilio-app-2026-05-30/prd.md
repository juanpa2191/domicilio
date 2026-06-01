---
title: Domicilios Norte Aburrá
status: final
created: 2026-05-30
updated: 2026-05-30
reviewer_gate_verdict: PASA con fixes aplicados (1 HIGH + 3 MEDIUM resueltos)
brainstorming_source: _bmad-output/brainstorming/brainstorming-session-2026-05-29-1842.md
---

# PRD: Domicilios Norte Aburrá

*Nombre de trabajo — pendiente decisión final de marca post-MVP.*

---

## 0. Propósito del Documento

Este PRD es para **juanpis** (developer solo) como guía única de qué construir en las próximas **9 semanas** (scope ajustado post-revisión de arquitectura — ver D-20 en `.decision-log.md`). También sirve como input directo para los workflows de UX (`bmad-ux`), arquitectura técnica (`bmad-create-architecture`) y desglose en historias (`bmad-create-epics-and-stories`).

Está estructurado con un vocabulario anclado al Glosario (§3), features agrupadas con FRs anidados (§4), y supuestos marcados inline con `[ASSUMPTION]` que se consolidan en el §10 Índice de Assumptions. **No duplica** la sesión de brainstorming previa (`_bmad-output/brainstorming/brainstorming-session-2026-05-29-1842.md`) — la asume como contexto base y construye sobre ella.

---

## 1. Visión

**Domicilios Norte Aburrá** es una plataforma web (PWA) de gestión de pedidos a domicilio diseñada para comercios de pueblos antioqueños donde Rappi y Uber Eats no operan bien o no llegan. El producto reemplaza el caos operativo de gestionar pedidos por WhatsApp con una herramienta organizada que estructura la cola de pedidos, valida pagos, y comunica el estado al cliente — sin desplazar la relación directa entre el comercio y su cliente.

Para el cliente, la experiencia es **familiar** (catálogo + checkout, similar a Rappi) para minimizar fricción de aprendizaje. Para el comercio, la experiencia es **transformadora**: una cola FIFO de pedidos entrantes, validación de comprobantes de transferencia, y tiquetes para cocina que eliminan los puntos de quiebre del modelo actual basado en WhatsApp.

El modelo de negocio es **SaaS B2B**: suscripción mensual fija al comercio (no comisión por pedido como Rappi), sin pasarela de pago integrada (el cliente le transfiere al comercio directo). El lanzamiento es en Barbosa, Antioquia, con plan de replicación a municipios cercanos del Norte del Valle de Aburrá (Bello, Copacabana, Girardota, Don Matías) y luego al resto de Antioquia.

---

## 2. Usuario Objetivo

### 2.1 Jobs To Be Done

**Para el Comercio (Restaurante en MVP):**
- **Funcional:** Recibir pedidos de domicilio de forma organizada, sin que se pierdan en hora pico.
- **Funcional:** Validar pagos por transferencia sin tener que cambiar entre apps (WhatsApp → Nequi → WhatsApp).
- **Funcional:** Comunicar al cliente el estado del pedido sin interrumpir la cocina.
- **Social:** Mantener la relación directa con el cliente (no ser intermediado por un gigante extranjero).
- **Emocional:** Sentir control y orden en hora pico, no caos.

**Para el Cliente Final:**
- **Funcional:** Pedir comida a comercios del pueblo desde una sola app, sin tener que llamar o navegar WhatsApp.
- **Funcional:** Saber en qué estado está su pedido sin tener que preguntar.
- **Social:** Apoyar a los comercios locales del pueblo (no a Rappi).
- **Contextual:** Hacer un pedido rápido cuando llega del trabajo, sin pensarlo demasiado.

### 2.2 No-Usuarios (v1)

- **Comercios fuera de Barbosa** — La adopción en v1 es exclusiva del piloto en Barbosa.
- **Comercios que NO son restaurantes** — Farmacias, papelerías, mercados, ferreterías, etc., se difieren a Fase 2+.
- **Clientes que NO tienen smartphone moderno** — La app exige Android 9+ o iOS 14+. Clientes con teléfonos viejos siguen usando WhatsApp.
- **Repartidores como "rider gig"** — El modelo NO contempla repartidores independientes tipo Rappi. Solo domiciliarios propios del comercio.
- **Comercios que quieren integración con su POS de facturación electrónica** — Diferido a Fase 2.

### 2.3 User Journeys Clave

**UJ-1. María pide el almuerzo del trabajo (cliente, domicilio).**
María, secretaria en una notaría de Barbosa, son las 12:00 m. y tiene 30 minutos para almorzar. Abre Domicilios Norte Aburrá en su celular (ya está autenticada de pedidos anteriores), busca "Restaurante Don Luis", elige el almuerzo del día ($15.000), agrega en el campo de adiciones libres *"sin cebolla, doble arepa"*, confirma su dirección guardada, y elige "Pago por transferencia". La app le muestra los datos de transferencia de Don Luis (Nequi: 300xxx) y un botón "Ya transferí, subir comprobante". María hace la transferencia, sube el screenshot, y aparece un mensaje *"Esperando confirmación de Don Luis"*. Dos minutos después recibe push: *"Don Luis confirmó tu pago. Pedido en cocina."* Veinte minutos después: *"Tu pedido salió a domicilio. Llega en 5-10 min."* María almuerza sin haber tenido que llamar ni navegar WhatsApp. **Realiza JTBD: pedir comida del pueblo sin fricción.**

**UJ-2. Carlos pide pizza para recoger (cliente, pickup).**
Carlos sale de la oficina a las 6:30 pm en bicicleta, pasa por el centro de Barbosa. Abre la app, va a "Pizzería La Esquina", elige pizza familiar mixta, selecciona modalidad **"Recoger en local"**. La app le muestra: *"Pago en local al recoger. Tiempo estimado: 25 min. Te avisamos cuando esté lista."* A las 6:55 pm recibe push: *"Tu pizza está lista. Recógela cuando puedas."* Carlos llega, paga en efectivo, recoge, y se va. **Realiza JTBD: pedir sin esperar domiciliario y sin comisión adicional.**

**UJ-3. Don Luis procesa la hora pico (comercio, gestión de cola).**
Viernes 7:30 pm en el Restaurante Don Luis. En el panel de mostrador (un tablet detrás de la caja) ya hay **7 pedidos en cola FIFO**, el más viejo arriba. Don Luis ve el primero: María, almuerzo del día con adiciones, paga transferencia. Hace click en el pedido, ve el comprobante que María subió, valida que sí llegó la plata a su Nequi (lo comprueba en su otra ventana), hace click en **"Confirmar pago"**. El pedido pasa automáticamente a estado "En cocina" — María recibe push, y el tiquete aparece en la pantalla de cocina (un TV viejo conectado por HDMI a un celular Android). Don Luis ya no se distrae con WhatsApp explotando: los pedidos llegan ordenados, validar pagos es un click, la cocina ve los tiquetes en pantalla. **Realiza JTBD: organizar el caos sin desplazar la relación con el cliente.**

**UJ-4. Lucía marca el pedido listo (cocina, vista cocina).**
Lucía es la cocinera del Restaurante Don Luis. En la pantalla de cocina ve 4 tiquetes activos. El de María dice: *"Almuerzo del día — sin cebolla, doble arepa — para domicilio"*. Lo prepara. Cuando está listo, toca el tiquete en pantalla y aparece el botón **"Listo"**. Toca el botón, el tiquete desaparece de su vista, y Don Luis (en mostrador) recibe alerta de que ese pedido ya puede salir a domicilio. **Realiza JTBD: marcar el flujo de cocina sin interrumpir a Don Luis.**

**UJ-5. Pedro entrega el almuerzo de María (domiciliario, vista propia).**
Pedro es el domiciliario del Restaurante Don Luis, contratado fijo de 11am a 3pm. Tiene la app abierta en su celular. Cuando Lucía marcó el pedido de María como listo y Don Luis se lo asignó a Pedro, aparece en su pantalla: *"Almuerzo del día para María — Calle 12 #34-56 Barrio Centro — Pago: ya pagó por transferencia"*. Pedro toca el pedido, ve la dirección, toca el botón **"Llamar a María"** si la necesita (la app abre el dialer con el número), monta en la moto y va. Cuando entrega, toca **"Entregado"** en la app. María recibe push: *"Tu pedido fue entregado"*. Pedro queda libre para la siguiente entrega. **Realiza JTBD: cumplir entregas sin tener que coordinar por WhatsApp con Don Luis.**

---

## 3. Glosario

*Términos canónicos. Downstream workflows y readers DEBEN usarlos exactos. Introducir un sinónimo en cualquier parte del PRD es violación de disciplina.*

- **Comercio** — Negocio (restaurante en MVP, farmacia en Fase 2) que paga la suscripción y recibe pedidos a través de la plataforma. Tiene 1+ cuentas de usuario asociadas (rol Mostrador, rol Cocina).
- **Cliente** — Persona que hace un pedido a través de la app. NO paga suscripción.
- **Pedido** — Solicitud de productos hecha por un Cliente a un Comercio. Tiene un Estado a lo largo de su ciclo de vida.
- **Estado del Pedido** — Posición del Pedido en su ciclo de vida. Estados válidos en MVP: `pendiente_pago`, `validando_pago`, `en_cocina`, `listo`, `en_domicilio`, `entregado`, `cancelado`.
- **Cola FIFO** — Lista ordenada por timestamp de creación de los Pedidos no completados de un Comercio. El Pedido más viejo aparece primero. Su orden NO cambia por interacción posterior.
- **Tiquete** — Representación visual de un Pedido para la vista de Cocina, mostrando los items y adiciones. Puede ser virtual (en pantalla) o impreso (impresora térmica, opcional, fuera de MVP).
- **Adición Libre** — Texto en formato libre que el Cliente escribe sobre su Pedido para indicar customizaciones no listadas en el catálogo (ej: "sin cebolla, doble arepa").
- **Modalidad de Entrega** — Cómo recibe el Cliente su Pedido. Valores válidos: `domicilio` (entrega por domiciliario del Comercio) o `recoger_en_local` (Cliente recoge en el establecimiento).
- **Comprobante de Pago** — Imagen/screenshot subida por el Cliente que evidencia la transferencia realizada al Comercio. Es validada manualmente por el rol Mostrador del Comercio.
- **Suscripción** — Acuerdo mensual entre un Comercio y la plataforma. Precio único: **$80.000 COP/mes**. Incluye 2 meses gratis al inicio. *Precio elegido para optimizar velocidad de adopción en fase piloto — subir es más fácil que bajar después de validar con los primeros 5 comercios.*
- **Hora pico** — Ventanas operativas donde el volumen de Pedidos es más alto. Definición operacional en MVP: **12:00-14:00** (almuerzo) y **19:00-21:00** (cena), hora local de Colombia. Usado en SM-4 y otras métricas de performance.
- **Rol Mostrador** — Usuario del Comercio responsable de gestionar la cola de pedidos, validar pagos y administrar el catálogo.
- **Rol Cocina** — Usuario del Comercio responsable de ver los Tiquetes activos y marcarlos como listos.
- **Domiciliario** — Persona que entrega físicamente los Pedidos del Comercio al Cliente. En MVP, es un **usuario autenticado** asociado a un Comercio con una vista propia (ver sus entregas asignadas, marcarlas como completadas). NO incluye tracking GPS en MVP.
- **Catálogo** — Lista de productos vendibles de un Comercio, gestionada por el rol Mostrador. Cada producto tiene nombre, descripción opcional, precio, foto opcional, y disponibilidad on/off.
- **Adiciones (Estructuradas)** — Opciones predefinidas en el Catálogo que el Cliente puede agregar a un producto (ej: "extra queso $2.000"). Diferente de Adición Libre.

---

## 4. Features

### 4.1 Autenticación y Cuentas

**Descripción:** El Cliente y el Comercio acceden a la plataforma con cuentas separadas. La autenticación es minimalista: para Cliente, registro con celular + nombre (sin contraseña — OTP por SMS o WhatsApp). Para Comercio, registro con email + contraseña (gestionada por el admin de la plataforma durante el onboarding inicial). El Cliente puede usar la app sin registrarse para navegar el catálogo, pero debe autenticarse antes de confirmar un Pedido.

**Decisión:** OTP por SMS confirmado como mecanismo de autenticación del Cliente. Validar costo real con proveedor (Twilio/MessageBird/AWS SNS) en semana 1 — si excede ~$200 COP/SMS, evaluar alternativa (WhatsApp OTP o email/contraseña).

**Functional Requirements:**

#### FR-1: Registro de Cliente
El Cliente puede crear una cuenta proporcionando nombre y número de celular. La plataforma envía un código OTP de 6 dígitos al celular. El Cliente lo ingresa para confirmar. Realiza UJ-1.

**Consecuencias (testeables):**
- El Cliente queda autenticado en la sesión hasta logout explícito o 90 días de inactividad.
- Si el OTP no es ingresado en 5 minutos, expira y debe pedir uno nuevo.
- Un mismo número de celular no puede crear 2 cuentas.

#### FR-2: Login de Cliente
El Cliente puede iniciar sesión proporcionando su celular. Recibe OTP por SMS. Lo ingresa para autenticarse.

**Consecuencias:**
- El Cliente recupera su historial de Pedidos y direcciones guardadas al iniciar sesión.

#### FR-3: Cuenta de Comercio (onboarding manual)
Un Comercio nuevo es creado por el admin de la plataforma (juanpis en MVP) ingresando email, nombre del comercio, dirección y persona de contacto. Se genera una contraseña temporal que el Comercio debe cambiar en el primer login.

**Consecuencias:**
- NO hay self-signup para Comercios en MVP — la adopción es relacional, no automática.
- El Comercio puede crear cuentas adicionales para el rol Cocina con permisos limitados.

#### FR-4: Roles dentro del Comercio
Un Comercio puede tener múltiples usuarios con tres roles:
- **Mostrador** — acceso completo: catálogo, cola de pedidos, validación de pagos, configuración, asignación de domiciliarios.
- **Cocina** — solo ve Tiquetes activos y los marca como listos.
- **Domiciliario** — solo ve los Pedidos que le fueron asignados, datos del cliente (nombre, celular, dirección), y puede marcarlos como entregados.

El rol Mostrador puede crear usuarios Cocina y Domiciliario.

**Consecuencias:**
- Un usuario Cocina NO puede ver datos del Cliente ni del pago.
- Un usuario Cocina NO puede modificar el catálogo.
- Un usuario Domiciliario solo ve Pedidos asignados a él (no ve la Cola completa).
- Un usuario Domiciliario NO puede modificar el catálogo, validar pagos, ni gestionar configuración.

---

### 4.2 Catálogo del Comercio

**Descripción:** Cada Comercio gestiona su propio Catálogo desde la vista Mostrador. Puede crear productos con nombre, precio, descripción opcional y foto opcional. Cada producto puede tener Adiciones Estructuradas (ej: "extra queso $2.000", "porción doble $5.000"). El Catálogo es lo que el Cliente ve en la app. Productos pueden estar marcados como "no disponible hoy" sin necesidad de borrarlos.

**Functional Requirements:**

#### FR-5: Crear y editar producto
El rol Mostrador puede crear un producto con: nombre (obligatorio), precio (obligatorio), descripción (opcional, texto libre hasta 200 caracteres), foto (opcional, JPG/PNG hasta 2MB).

**Consecuencias:**
- Cambios en el Catálogo se reflejan en la app del Cliente en menos de 60 segundos.
- Productos sin foto se muestran con un placeholder genérico al Cliente.

#### FR-6: Adiciones Estructuradas por producto
El rol Mostrador puede agregar a un producto N adiciones predefinidas, cada una con nombre y precio adicional. Ejemplo: producto "Hamburguesa $15.000" + adición "Extra queso +$2.000" + adición "Doble carne +$5.000".

**Consecuencias:**
- El Cliente puede marcar 0+ adiciones por producto al hacer el Pedido.
- El precio total del item refleja las adiciones seleccionadas.

#### FR-7: Disponibilidad on/off de producto
El rol Mostrador puede marcar un producto como "no disponible hoy" sin borrarlo. El producto deja de aparecer en la app del Cliente hasta que se reactive.

**Consecuencias:**
- Productos no disponibles desaparecen para Clientes en menos de 60 segundos.

---

### 4.3 Toma de Pedido (Cliente) — *UX familiar tipo Rappi*

**Descripción:** El Cliente navega el listado de Comercios (en MVP solo restaurantes en Barbosa), elige uno, ve su Catálogo, agrega productos al "carrito", define adiciones (estructuradas y libres), elige Modalidad de Entrega (domicilio o recoger), confirma dirección si aplica, elige método de pago, confirma. La UX es deliberadamente similar a Rappi para minimizar curva de aprendizaje.

**Functional Requirements:**

#### FR-8: Navegar comercios
El Cliente ve un listado de Comercios disponibles, ordenado por proximidad o por relevancia para Barbosa en MVP. Cada Comercio muestra: nombre, foto opcional, estado (abierto/cerrado según horario), tiempo estimado de entrega.

**Consecuencias:**
- Comercios cerrados aparecen visibles pero sin permitir hacer Pedido.

#### FR-9: Agregar productos al carrito
El Cliente puede agregar productos del Catálogo del Comercio elegido a un "carrito". Por cada producto puede seleccionar Adiciones Estructuradas y cantidad. Realiza UJ-1, UJ-2.

**Consecuencias:**
- El carrito persiste entre sesiones hasta que se confirma o se vacía.
- NO se pueden mezclar productos de 2 Comercios distintos en el mismo Pedido.

#### FR-10: Adición Libre por pedido
Al confirmar el carrito, el Cliente puede agregar UNA Adición Libre en formato texto que aplica al Pedido completo (no por producto). Ejemplo: *"sin cebolla en todo, doble arepa en la bandeja"*.

**Consecuencias:**
- El texto se muestra textual al Comercio en el Pedido, sin parseo ni interpretación.
- Límite: 280 caracteres.

#### FR-11: Selección de Modalidad de Entrega
El Cliente elige entre `domicilio` o `recoger_en_local`. Si elige domicilio, debe confirmar una dirección (nueva o guardada). Si elige recoger, no necesita dirección. Realiza UJ-1, UJ-2.

**Consecuencias:**
- El precio del Pedido NO cambia entre modalidades (no hay costo de domicilio explícito en MVP — el Comercio define si lo incluye en sus precios).

#### FR-12: Confirmación de Pedido y forma de pago
El Cliente ve un resumen del Pedido y elige forma de pago:
- Si Modalidad = `domicilio` → forma de pago: **Transferencia** (cliente sube comprobante después) o **Efectivo al recibir** (solo si el Comercio lo habilitó).
- Si Modalidad = `recoger_en_local` → forma de pago: **Transferencia** o **Pago en local al recoger**.

Al confirmar, el Pedido entra al Estado `pendiente_pago` (si paga por transferencia) o `validando_pago` (si paga en efectivo/al recoger, donde no aplica validación de transferencia).

**Consecuencias:**
- Si el Cliente cierra la app antes de subir comprobante, el Pedido permanece en `pendiente_pago` hasta 30 min, después se cancela automáticamente.

#### FR-13: Subir Comprobante de Pago
Cuando el Cliente elige pagar por transferencia, después de confirmar el Pedido la app muestra los datos de transferencia del Comercio (Nequi, Bancolombia, Daviplata según lo que el Comercio haya configurado) + un botón "Subir comprobante". Sube imagen (JPG/PNG hasta 5MB). El Pedido pasa a Estado `validando_pago`.

**Consecuencias:**
- Solo se acepta una imagen por Pedido.
- Si el Cliente sube imagen ≠ comprobante (foto de un gato), el problema se resuelve en validación humana del Comercio (rechaza pago).

---

### 4.4 Gestión del Pedido (Comercio) — *CORAZÓN DEL MVP*

**Descripción:** El rol Mostrador del Comercio tiene un panel donde ve la **Cola FIFO** de Pedidos entrantes. Cada Pedido aparece como una tarjeta con: hora de llegada, nombre del Cliente, items del Pedido, Adición Libre, Modalidad, forma de pago, y acciones contextuales según el Estado. La Cola NO cambia su orden por interacción — el Pedido más viejo siempre arriba hasta que el Mostrador lo procese.

Este es el feature **diferenciador del producto**. Es donde el Comercio siente el valor de pagar la suscripción. La UX debe ser brutal en simplicidad y velocidad: un Mostrador en hora pico debe poder procesar 5+ pedidos por minuto sin perderse.

**Functional Requirements:**

#### FR-14: Cola FIFO de Pedidos entrantes
El rol Mostrador ve una lista de Pedidos no completados de su Comercio, ordenada por timestamp de creación ascendente (más viejo arriba). La lista se actualiza en tiempo real (nuevos Pedidos aparecen al pie sin recargar). Realiza UJ-3.

**Consecuencias:**
- Un Pedido nuevo entrante dispara una alerta sonora discreta + visual.
- El orden de la Cola NO cambia cuando el Mostrador hace click en un Pedido o cuando el Cliente envía actualización.
- La Cola muestra como máximo 50 Pedidos al tiempo (paginación si hay más).

#### FR-15: Validar Comprobante de Pago
Para Pedidos en Estado `validando_pago`, el rol Mostrador ve el Comprobante de Pago subido por el Cliente y tiene dos acciones: **"Confirmar pago"** o **"Rechazar pago"**. Si confirma, el Pedido pasa a Estado `en_cocina` y aparece automáticamente un Tiquete en la vista Cocina. Si rechaza, debe escribir motivo (texto libre 140 char) y el Pedido se cancela; el Cliente recibe notificación con el motivo. Realiza UJ-3.

**Consecuencias:**
- La acción Confirmar/Rechazar es UN solo click + opcionalmente un texto. NO debe requerir más pasos.
- Una vez confirmado el pago, NO se puede revertir (decisión deliberada para evitar errores en hora pico).
- El Comprobante se almacena por 30 días desde la fecha del Pedido (para resolución de disputas).

#### FR-16: Cambio manual de Estado por el Comercio
El rol Mostrador puede mover el Pedido a los siguientes Estados manualmente:
- De `en_cocina` → `listo` (si la cocina no usa la vista propia, o como fallback)
- De `listo` → `en_domicilio` — **asignando un Domiciliario específico** del Comercio (de la lista de Domiciliarios activos). El Pedido aparece automáticamente en la vista del Domiciliario asignado.
- De `en_domicilio` → `entregado` (puede ser hecho por el Mostrador o por el Domiciliario — ver FR-29)
- De cualquier Estado → `cancelado` (con motivo)

Cada cambio dispara push notification al Cliente. Realiza UJ-3.

**Consecuencias:**
- Cancelar un Pedido después de validar el pago: la devolución del dinero se gestiona **fuera de la app**, mediante comunicación directa Comercio→Cliente (decisión confirmada). La app solo notifica la cancelación con el motivo al Cliente y registra el evento.

#### FR-17: Modo "Cerrado temporalmente"
El rol Mostrador puede cerrar el Comercio temporalmente con un toggle. Mientras esté cerrado, NO se pueden recibir nuevos Pedidos (la app del Cliente lo muestra como cerrado). Pedidos en curso siguen su flujo normal.

**Consecuencias:**
- Útil para horas de descanso, días sin servicio, o saturación inesperada.
- El toggle es reversible en cualquier momento.

---

### 4.5 Vista Cocina — *parte del CORAZÓN*

**Descripción:** El rol Cocina ve una pantalla simplificada con solo los **Tiquetes activos** (Pedidos en Estado `en_cocina`). Cada Tiquete muestra: items del Pedido con cantidades, Adición Libre, y un botón grande **"Listo"**. La vista está optimizada para verse desde lejos (TV/tablet/celular conectado en cocina). Sin distracciones de pagos, clientes, ni configuración. Realiza UJ-4.

**Functional Requirements:**

#### FR-18: Lista de Tiquetes activos
El rol Cocina ve una lista en grid de Tiquetes activos del Comercio, ordenada por timestamp del Pedido (más viejo arriba). Cada Tiquete es una tarjeta grande, legible desde 2-3 metros de distancia.

**Consecuencias:**
- Información mostrada por Tiquete: items con cantidad, Adición Libre, hora de Pedido, Modalidad (domicilio/recoger — para que el cocinero sepa si va caja para llevar o plato).
- Información NO mostrada: precio, nombre del Cliente, datos de pago.

#### FR-19: Marcar Tiquete como Listo
El rol Cocina puede tocar el Tiquete y aparece confirmación "¿Listo?". Confirma. El Pedido pasa a Estado `listo`, el Tiquete desaparece de la vista Cocina, y el Mostrador recibe alerta.

**Consecuencias:**
- La acción es 2 clicks intencionales para evitar marcar listos accidentalmente.
- Un Tiquete marcado listo por error puede ser reactivado por el rol Mostrador (lo regresa a `en_cocina`).

#### FR-20: Auto-refresco de la vista Cocina
La vista Cocina se actualiza automáticamente cada 10 segundos (o vía websocket en tiempo real si la implementación lo permite).

**Consecuencias:**
- Nuevos Tiquetes aparecen sin intervención del cocinero.
- Si la conexión se pierde temporalmente, la vista muestra una advertencia visual.

---

### 4.6 Comunicación de Estado al Cliente

**Descripción:** Cada cambio de Estado del Pedido dispara una notificación push al Cliente, indicando el nuevo estado en lenguaje natural ("Don Luis confirmó tu pago", "Tu pedido salió a domicilio", etc.). El Cliente también puede entrar a la app y ver el estado actual del Pedido en cualquier momento.

**Functional Requirements:**

#### FR-21: Push notifications de Estado
Cada cambio de Estado (excepto cambios internos como `pendiente_pago` → `validando_pago`) dispara una push notification al Cliente con texto contextual. Realiza UJ-1, UJ-2.

**Consecuencias:**
- Mensajes son configurables a nivel global por el admin de la plataforma (no por Comercio en MVP).
- Si el Cliente no acepta permisos de push, solo ve el estado al abrir la app.

#### FR-22: Vista de seguimiento de Pedido del Cliente
El Cliente puede ver una pantalla "Mi pedido" con: estado actual, tiempo transcurrido desde que ordenó, items pedidos, Comercio, y forma de pago. Si el Pedido fue cancelado, ve el motivo.

**Consecuencias:**
- La vista se actualiza vía pull cuando el Cliente la abre.
- El Cliente puede tener máximo 3 Pedidos activos al tiempo (cualquier Estado excepto `entregado` o `cancelado`).

---

### 4.7 Configuración del Comercio

**Descripción:** El rol Mostrador tiene un panel de configuración para gestionar datos del Comercio: información básica (nombre, dirección, horario), formas de pago aceptadas (Nequi/Bancolombia/Daviplata con datos), si acepta efectivo al recibir o no, y datos de domiciliarios propios (nombre + celular, opcional — sin tracking GPS en MVP).

**Functional Requirements:**

#### FR-23: Editar información básica del Comercio
El rol Mostrador puede editar: nombre del Comercio, dirección, horario de operación (días + rango de horas), foto principal.

**Consecuencias:**
- Cambios reflejados en app del Cliente en menos de 60 segundos.
- Fuera del horario configurado, el Comercio aparece como "cerrado" automáticamente.

#### FR-24: Configurar formas de pago aceptadas
El rol Mostrador puede activar/desactivar y configurar:
- **Nequi:** número de celular asociado
- **Bancolombia:** número de cuenta + tipo (ahorros/corriente)
- **Daviplata:** número de celular asociado
- **Efectivo al recibir:** toggle (sí/no)
- **Pago en local al recoger:** toggle (sí/no, solo aplica si soporta modalidad recoger)

**Consecuencias:**
- Las formas de pago configuradas son las que ve el Cliente al confirmar el Pedido.
- Mínimo 1 forma de pago debe estar activa para que el Comercio pueda recibir Pedidos.

#### FR-25: Gestionar domiciliarios propios
El rol Mostrador puede crear, editar y desactivar Domiciliarios del Comercio. Cada Domiciliario tiene: nombre, celular, email (para login), contraseña (generada y enviada al Domiciliario en su primer onboarding). El Mostrador puede marcar a un Domiciliario como activo/inactivo (sin borrarlo) — los inactivos no aparecen en la lista de asignación de Pedidos.

**Consecuencias:**
- Sin Domiciliarios configurados, el Comercio igual puede operar (solo modalidad recoger).
- Un Domiciliario puede estar asociado a un solo Comercio.
- Eliminar un Domiciliario que tiene Pedidos activos NO es permitido — primero deben completarse o reasignarse.

---

### 4.8 Vista del Domiciliario — *parte del CORAZÓN extendido*

**Descripción:** El rol Domiciliario tiene una vista minimalista en su celular: lista de Pedidos asignados a él en Estado `en_domicilio`, ordenados por timestamp de asignación. Cada Pedido muestra solo lo que necesita para entregar: nombre del Cliente, dirección, celular (para llamar si se pierde), items del Pedido (referencial), forma de pago (para saber si debe cobrar al recibir). Cuando entrega, marca el Pedido como `entregado` con un solo botón. Realiza UJ-5.

La vista está pensada para celular con datos limitados — UI liviana, sin elementos innecesarios, optimizada para uso en moto (botones grandes).

**Functional Requirements:**

#### FR-26: Login del Domiciliario
El Domiciliario hace login con email + contraseña (creados por el Mostrador). Su sesión persiste hasta logout explícito o 30 días de inactividad.

**Consecuencias:**
- Si el Domiciliario olvida su contraseña, el Mostrador puede generar una nueva desde la configuración.

#### FR-27: Lista de Entregas Asignadas
El Domiciliario ve una lista en grid de Pedidos en Estado `en_domicilio` asignados a él. Cada Pedido muestra:
- Nombre del Cliente
- Dirección de entrega (texto + opción de abrir en Google Maps/Waze con un click)
- Botón para llamar al Cliente (abre el dialer nativo del teléfono)
- Lista referencial de items (para que el Domiciliario verifique al recoger en cocina)
- Forma de pago — si es `efectivo_recibir`, mostrar destacado el **monto a cobrar**
- Adición Libre del Pedido (si la hay)

Realiza UJ-5.

**Consecuencias:**
- Información NO mostrada: comprobante de pago del Cliente, datos sensibles, métricas del Comercio.
- Si el Domiciliario tiene 0 entregas asignadas, vista muestra "Sin entregas asignadas" con estado de descanso.

#### FR-28: Marcar Pedido como Entregado
El Domiciliario toca el Pedido y aparece un botón grande **"Entregado"**. Toca el botón, aparece confirmación rápida ("¿Confirmar entrega?"), confirma. El Pedido pasa a Estado `entregado`, desaparece de su lista, y el Cliente recibe push notification.

**Consecuencias:**
- Si el Pedido era pago `efectivo_recibir`, la app NO valida que el Domiciliario haya cobrado — esto es responsabilidad del Domiciliario y del Comercio (gestión interna, fuera de app).
- Una vez marcado como entregado, NO se puede deshacer desde la vista del Domiciliario (solo el Mostrador puede revertir, si fuera necesario).

#### FR-29: Asignación de Pedidos al Domiciliario
Cuando el Mostrador cambia un Pedido a Estado `en_domicilio` (FR-16), debe seleccionar al Domiciliario asignado de una lista (solo Domiciliarios activos). El Pedido aparece en la vista del Domiciliario seleccionado.

**Consecuencias:**
- El Mostrador puede reasignar un Pedido `en_domicilio` a otro Domiciliario si el primero no pudo (ej: se le dañó la moto). El Pedido desaparece del primero y aparece en el nuevo.
- Si no hay Domiciliarios activos en el Comercio, el Mostrador no puede cambiar el Pedido a `en_domicilio` — debe activar uno o cambiar la Modalidad a `recoger_en_local`.

---

### 4.9 Administración de la Plataforma

**Descripción:** El admin de la plataforma (juanpis en MVP) tiene un panel mínimo para: crear cuentas de Comercio, activar/desactivar Comercios, ver suscripciones activas y su estado (período gratis vs. pagando), y revisar métricas básicas.

**Functional Requirements:**

#### FR-30: Crear cuenta de Comercio
El admin puede crear una nueva cuenta de Comercio ingresando: nombre, email del responsable, dirección, fecha de inicio del período gratis (2 meses).

**Consecuencias:**
- El sistema envía email al Comercio con instrucciones de primer login.
- El período gratis inicia automáticamente.

#### FR-31: Vista de Comercios y suscripciones
El admin ve una tabla con: nombre del Comercio, estado (activo/inactivo), fecha de inicio del período gratis, fecha de fin del período gratis, estado de pago de suscripción (al día / pendiente / atrasado).

**Consecuencias:**
- Cobro de suscripción es **manual fuera del sistema** en MVP (juanpis llama o pasa cuenta). NO hay integración con pasarela ni cobro automático.
- Después del período gratis, el Comercio sigue activo hasta que admin lo desactive manualmente por falta de pago.

#### FR-32: Métricas básicas
El admin ve métricas agregadas por Comercio: número de Pedidos en últimos 7/30 días, valor total transado (suma del precio de Pedidos), Pedidos cancelados.

**Consecuencias:**
- Sirve para reportar al Comercio "mira cuánto te ayudó la app".
- NO hay dashboard por Comercio en MVP (Comercio NO ve estas métricas directamente).

---

## 5. Non-Goals (Explícitos)

- **NO somos un marketplace tipo Rappi.** No cobramos comisión por pedido. No optimizamos para "más pedidos para el comercio". Optimizamos para "menos caos operativo".
- **NO procesamos pagos.** El dinero NUNCA pasa por la plataforma. Cliente paga al Comercio directamente. No somos Payment Service Provider.
- **NO tenemos repartidores propios ni gig economy.** No reclutamos rappitenderos. El comercio usa sus domiciliarios o el cliente recoge.
- **NO operamos como flota logística.** No optimizamos rutas, no asignamos repartidores, no hacemos tracking GPS de domicilios en MVP.
- **NO sustituimos la relación humana entre Comercio y Cliente.** El Cliente sigue siendo del Comercio. No nos quedamos con los datos del Cliente para usarlos contra el Comercio (como hace Rappi).
- **NO somos una app de descuentos / cupones / fidelización.** Si el Comercio quiere promocionar, lo hace por sus medios. La app solo muestra los precios del Catálogo.
- **NO somos un POS de facturación electrónica.** El Comercio mantiene su sistema de facturación (Siigo/Alegra/etc.). Ver D-6 en decision-log.
- **NO operamos fuera de Barbosa en MVP.** Otros municipios son Fase 3.
- **NO atendemos verticales diferentes a restaurantes en MVP.** Farmacias en Fase 2; otros verticales en Fase 3+.
- **NO ofrecemos self-signup para Comercios.** La adopción en MVP es relacional, manual, conversada. Juanpis crea las cuentas.

---

## 6. MVP Scope

### 6.1 In Scope (MVP — 9 semanas, post-D-20 scope cut)

**Features (§4.1 a §4.9, con ajustes):**
- Autenticación Cliente (OTP por SMS) + onboarding manual de Comercios
- Catálogo del Comercio con productos, fotos, Adiciones Estructuradas
- Toma de Pedido del Cliente (tipo Rappi) con Adición Libre
- Modalidades: `domicilio` (gestionado por el Comercio fuera de app) y `recoger_en_local`
- Pago por transferencia con upload de Comprobante + validación humana del Comercio
- Pago efectivo al recibir / al recoger (si el Comercio lo habilita)
- Cola FIFO del Comercio (panel mostrador) — **CORAZÓN**
- Vista Cocina con Tiquetes activos en **lista vertical** (no grid) — **CORAZÓN simplificado**
- Admin de plataforma con UI básica (crear comercios, ver suscripciones, métricas básicas)
- Habeas Data: política de privacidad + consentimiento explícito al registrarse
- **Comunicación de estado al Cliente vía polling cada 10s** (no push notifications en MVP)

### 6.1.1 RECORTADO del MVP (movido a Fase 2 — ver D-20)
- ❌ **§4.8 Vista del Domiciliario completa (FR-26 a FR-29)** — Comercio coordina con su domiciliario por WhatsApp/llamada como antes.
- ❌ **Push notifications (FR-21)** → reemplazado por polling cada 10s en MVP.
- ❌ **Modo offline** — sin queue de mutaciones, sin service worker offline. Errores simples "Sin conexión".

### 6.1.2 SIMPLIFICADO en MVP
- Vista Cocina: lista vertical en lugar de grid 2-3 columnas
- Hardening reducido: testing manual del flujo crítico, no testing exhaustivo

**Plataforma:**
- PWA web (Progressive Web App) — decisión confirmada. Justificación detallada en `addendum.md §A.1`.
- Soporta solo Android 9+ / iOS 16.4+ (iOS 16.4 es el mínimo para push notifications en PWA).

**Alcance comercial:**
- 1 ciudad: Barbosa, Antioquia
- 1 vertical: Restaurantes
- Meta: 1 Comercio piloto activo al final de la semana 7

### 6.2 Out of Scope for MVP

- **Convenios con cooperativas locales de domiciliarios** — Fase 2 (D-8). Razón: requiere negociación + tiempo. Sin esto el Comercio usa su propio domiciliario o cliente recoge.
- **Integración con WhatsApp Business para notificaciones** — Fase 2 (D-9). Razón: push primero, validar comportamiento, decidir.
- **Farmacias y otros verticales** — Fase 2 (D-10).
- **Replicación a otros municipios** — Fase 3 (D-11).
- **Cobro automático de suscripción / integración con pasarela** — Fase 2. Cobro manual fuera de app en MVP. `[NOTE FOR PM]` — es punto de riesgo operativo. Revisita cuando hayan 5+ comercios pagando.
- **Tracking GPS de domiciliarios** — Fase 3.
- **Dashboard de métricas para el Comercio** — Fase 2. En MVP solo el admin las ve.
- **Integración con facturación electrónica (Siigo, Alegra)** — Fase 2.
- **Programa de fidelización / cupones / promociones** — Fuera de roadmap (Non-Goal explícito).
- **Self-signup de Comercios** — Fuera de roadmap por ahora; la adopción es relacional.
- **Impresión térmica de Tiquetes** — Diferida. En MVP solo vista virtual de Cocina.
- **Múltiples idiomas** — Solo español.
- **Modo offline** — Asumimos conectividad buena en Barbosa (confirmado por usuario). Si la sesión se cae, manejo de errores básico; sin queue persistente.

---

## 7. Métricas de Éxito

**Primarias:**
- **SM-1:** **Adopción piloto.** 1 Comercio activo procesando ≥10 Pedidos reales en la semana 7. Valida FR-14, FR-15, FR-18, FR-19.
- **SM-2:** **Validación del CORAZÓN del producto.** Don Luis (o el comercio piloto) responde "sí, la usaría sin la app sería peor" en entrevista cualitativa a las 4 semanas de uso. Valida la propuesta de valor general.

**Secundarias:**
- **SM-3:** **Procesamiento sin pérdida.** Menos del 5% de Pedidos confirmados terminan en Estado `cancelado` por problemas operativos (no incluye cancelaciones legítimas por el Cliente). Valida FR-14, FR-16.
- **SM-4:** **Velocidad de procesamiento del Mostrador.** Tiempo promedio desde Pedido confirmado hasta validación de pago < 3 minutos en hora pico. Valida FR-15.
- **SM-5:** **Entrega de notificaciones.** ≥90% de push notifications llegan al Cliente en menos de 30 segundos. Valida FR-21.

**Contra-métricas (NO optimizar):**
- **SM-C1:** **Número de Pedidos por Cliente.** NO optimizar — no somos marketplace, no nos importa que cada Cliente pida más. Lo que importa es que el flujo funcione para el Comercio. Contrabalancea SM-1.
- **SM-C2:** **Tiempo de uso del Cliente en la app.** NO optimizar — no queremos clientes "pegados" a la app. Queremos que pidan rápido y se vayan. Contrabalancea cualquier feature de "engagement".

---

## 8. Open Questions

1. **OQ-1: Stack técnico definitivo** — Se resuelve en `bmad-create-architecture`. Asumimos PWA con backend ligero (Supabase/Firebase) para reducir esfuerzo de solo developer.
2. **OQ-2: Costo real de OTP por SMS** — Validar con Twilio/MessageBird/AWS SNS los costos por SMS en Colombia. Si excede $50 COP/SMS, considerar alternativa (email + contraseña o WhatsApp OTP).
3. **OQ-3: Diseño visual y branding** — Sin diseñador. Definir paleta y componentes via `bmad-ux` o framework de componentes ya estilizado (shadcn/ui, Mantine, etc.).
4. **OQ-4: Cómo se gestiona devolución cuando un Pedido se cancela después de pago validado** — Asumido: comunicación directa Comercio-Cliente fuera de app. Confirmar con el primer Comercio piloto si esto les incomoda.
5. **OQ-5: Política de privacidad redactada** — Necesita texto legal real para Habeas Data. Considerar template estándar o asesoría legal puntual (~$200-500k).
6. ~~**OQ-6: Modelo definitivo de precio de suscripción**~~ → **RESUELTO**: $80.000 COP/mes. Validar disposición a pagar con 5 restaurantes en semana 1 — si hay resistencia, considerar bajar a $60k o subir a $100k según feedback.
7. **OQ-7: Hosting y costos operativos del MVP** — Estimar mensual (Supabase/Vercel/SMS/etc.) para asegurar que el margen de la suscripción cubra costos.

---

## 9. Cross-Cutting NFRs

### 9.1 Performance
- Tiempo de respuesta de la app del Cliente: páginas críticas (catálogo, confirmar pedido) cargan en < 2 segundos en 4G.
- Cola FIFO del Comercio: actualización en tiempo real (< 5 segundos de latencia desde creación del Pedido).
- Vista Cocina: refresh < 10 segundos.

### 9.2 Privacidad y Habeas Data (Ley 1581 de 2012)
- Consentimiento explícito del Cliente al registrarse (checkbox + link a política de privacidad).
- Cliente puede solicitar eliminación de sus datos (manual en MVP — vía email a soporte).
- Datos personales del Cliente NO se comparten con terceros.
- Comprobantes de pago se almacenan cifrados en reposo y se eliminan después de 30 días.
- Política de privacidad accesible desde la app en todo momento.

### 9.3 Seguridad
- Comunicaciones por HTTPS exclusivamente.
- Contraseñas de Comercio almacenadas con hash bcrypt (o equivalente).
- Tokens de sesión expiran después de 90 días de inactividad.
- Rate limiting en endpoints sensibles (OTP, login) para prevenir abuso.

### 9.4 Confiabilidad
- Backups diarios de la base de datos.
- Si el servicio cae, prioridad de restauración: vista Mostrador del Comercio (es donde el comercio sufre directo).
- Logs de errores accesibles para juanpis (Sentry o similar).

### 9.5 Cost / Sustainability (relevante para developer solo)
- Hosting + servicios deben costar < $100.000 COP/mes en MVP con 1-3 comercios activos.
- Escalar a 25 comercios activos (target Fase 2) no debe exceder $500.000 COP/mes en infraestructura.

---

## 10. Índice de Decisiones de Discovery y Assumptions

*Este índice consolida las decisiones tomadas durante Discovery (originalmente `[ASSUMPTION]` que se confirmaron) y las assumptions que aún quedan abiertas. El detalle completo de cada decisión vive en `.decision-log.md`.*

### Decisiones confirmadas en Discovery

- ✅ **D-A1 (§4.1, ref D-14):** Autenticación del Cliente vía OTP por SMS. Validar costo real en semana 1; si excede $200 COP/SMS, evaluar WhatsApp OTP o email/contraseña.
- ✅ **D-A2 (§6.1, ref D-15):** PWA confirmado como form-factor. Soporte mínimo Android 9+ / iOS 16.4+.
- ✅ **D-A3 (§4.4 FR-16, ref D-16):** Cancelación de Pedido post-validación de pago: devolución manual fuera de app, comunicación directa Comercio→Cliente.
- ✅ **D-A4 (§4.9 FR-31, ref D-17):** Cobro de la Suscripción es manual fuera de app en MVP. Pasarela (Wompi/ePayco) se evalúa cuando haya 5+ comercios pagando.
- ✅ **D-A5 (§4.8, ref D-18):** Vista del Domiciliario INCLUIDA en MVP (sin GPS tracking). Adds ~1 semana al cronograma → MVP total 8 semanas.
- ✅ **D-A6 (§4.4 FR-15, ref D-19):** Validación de comprobantes 100% manual en MVP. OCR diferido a Fase 2.

### Assumptions abiertas (a validar)

- 🟡 **A-1 (Implícita en §6.1):** Habeas Data básico (consent + privacy policy) es suficiente para MVP. No se requiere certificación SIC ni auditoría externa. *Validar con asesoría legal puntual antes del lanzamiento del piloto.*
- 🟡 **A-2 (§7 SM-2):** El comercio piloto está dispuesto a dar feedback cualitativo a las 4 semanas. *Confirmar verbalmente en el onboarding del primer comercio.*
- 🟡 **A-3 (§6.2):** Conectividad en Barbosa es estable (confirmado verbalmente por el usuario). Sin modo offline en MVP. *Si emerge como problema en el piloto, evaluar service worker + queue offline en Fase 2.*

---

## 11. Próximos Pasos (post-PRD)

Una vez aprobado este PRD, el flujo recomendado es:

1. **`/bmad-ux`** — Diseñar wireframes y patrones UX de las 3 vistas clave (Cliente, Mostrador, Cocina).
2. **`/bmad-create-architecture`** — Definir stack técnico (frontend, backend, base de datos, hosting, servicios externos).
3. **`/bmad-create-epics-and-stories`** — Desglosar los FRs en épicas e historias para implementación.
4. **`/bmad-dev-story`** o **`/bmad-quick-dev`** — Implementación iterativa de cada historia.

**Validación paralela (en paralelo a las primeras semanas):**
- Conversaciones con 5 dueños de restaurantes de Barbosa para validar disposición a pagar y features.
- Conversación con 2 cooperativas de domiciliarios locales (input para Fase 2).
- Definir política de privacidad y términos y condiciones.
