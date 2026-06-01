# PRD Quality Review — Domicilios Norte Aburrá

**Reviewer:** Inline review (rubric walker)
**Fecha:** 2026-05-30
**Documentos revisados:** `prd.md`, `addendum.md`, `.decision-log.md`

---

## Overall verdict

El PRD tiene una **tesis estratégica clara y coherente** ("adaptar Rappi a pueblos, foco en vista del comercio, SaaS B2B no marketplace"), está bien anclado a la realidad de Barbosa, y las decisiones críticas están explícitamente registradas con trade-offs. Sin embargo, tiene **un problema mecánico HIGH-severity** que romperá downstream workflows: la numeración de FRs se rompe en §4.8 y §4.9 (FR-25 → FR-29 → FR-26) tras agregar la sección Domiciliario, y el Índice de Assumptions tiene entradas que ya no tienen tag inline correspondiente. Fuera de eso, el PRD está listo para alimentar UX, Arquitectura, y Epic creation.

**Veredicto del gate:** **PASA con 1 fix HIGH obligatorio + 2-3 fixes medium recomendados antes de Finalize.**

---

## Decision-readiness — **adequate**

El PRD tiene decisiones explícitas y trazadas en `.decision-log.md` (19 decisiones D-1 a D-19, cada una con "Por qué" y a veces "Mitigación/Revisita"). Trade-offs se nombran en varios puntos (PWA vs nativo justificado en addendum §A.1; SMS cost flagged en OQ-2; cobro manual marcado como riesgo operativo en §6.2). Pero en el PRD principal, algunos trade-offs solo viven en el decision log y no se mencionan en el cuerpo del PRD — un lector que no abre el decision log puede no captar por qué se eligió X sobre Y.

Open Questions (7) son reales y accionables — no son retóricas. SM-2 (entrevista cualitativa al piloto) es un buen indicador de que el equipo planea verificar la propuesta de valor, no asumirla.

### Findings

- **medium** Trade-off de precio no surfaceado en el PRD (§ Glosario "Suscripción") — Solo dice "$80.000 COP/mes" sin contexto de por qué no $99k ni $120k. *Fix:* Agregar una línea en §1 Visión o §7 SM o pie de la entrada en Glosario: "Precio elegido para optimizar velocidad de adopción en fase piloto; subir es más fácil que bajar después de validar con 5 comercios en semana 1."
- **low** OQ-1 "Stack técnico definitivo" no es una pregunta abierta real — está respondida en addendum §A.2 con Next.js + Supabase + Vercel. *Fix:* Reformular OQ-1 como "Confirmar stack en bmad-create-architecture; sugerencia inicial en addendum §A.2".

---

## Substance over theater — **strong**

No detecto persona theater. Las 4 personas extendidas en addendum (Don Luis, Lucía, María, Carlos) son específicas y conectan a UJs concretos. Pedro (Domiciliario) aparece en UJ-5 sin necesitar persona extendida — bien.

Vision statement (§1) es **específica de este producto** — no es swap-able a cualquier otra PRD de domicilios. Menciona "pueblos antioqueños donde Rappi y Uber Eats no operan bien", "Norte del Valle de Aburrá", "Barbosa". Imposible que esto sea boilerplate.

NFRs (§9) son específicos: "< 2 segundos en 4G", "< $500k COP/mes en infraestructura para 25 comercios". No detecto NFR theater.

Diferenciación contra Rappi (§5 Non-Goals + Vision) está respaldada por decisiones concretas en el modelo de negocio. No es claim sin sustento.

### Findings

(ninguna — dimensión sólida)

---

## Strategic coherence — **strong**

El PRD tiene una **tesis explícita y bien defendida**:
> "El modelo de domicilio (catálogo → pedido → entrega → tracking → pago) funciona. Lo que falla en pueblos son las asunciones operativas. Adaptar > Reinventar."

Las features siguen el arco:
- §4.3 Toma de Pedido del Cliente es **deliberadamente conservadora** ("UX familiar tipo Rappi") — la innovación NO va aquí.
- §4.4 Gestión del Pedido (FIFO + validación), §4.5 Vista Cocina, §4.8 Vista Domiciliario son **marcadas como "CORAZÓN"** — la innovación SÍ va aquí.
- §4.7 Configuración y §4.9 Admin son infraestructura sostén, no propuesta de valor.

Esto es coherencia estratégica real, no decoración.

Success Metrics validan la tesis directamente: SM-1 (1 comercio activo procesando pedidos) y SM-2 (validación cualitativa "lo usaría"). Counter-metrics (SM-C1 NO optimizar pedidos por cliente, SM-C2 NO optimizar engagement) son honestas — explicitan "no somos marketplace, no nos importa esto" — alineadas con la tesis.

### Findings

(ninguna — dimensión sólida)

---

## Done-ness clarity — **adequate**

Cada FR tiene una sección "Consecuencias (testeables)" con bounds medibles ("< 60 segundos", "< 5 minutos", "< 30 segundos"). Esto es excelente para downstream story creation.

Sin embargo, algunas consecuencias quedan en lenguaje cualitativo:

- **FR-15** dice "La acción Confirmar/Rechazar es UN solo click + opcionalmente un texto. NO debe requerir más pasos." — "no debe requerir más pasos" es una restricción de diseño correcta, pero un engineer puede preguntarse: ¿qué pasa si el botón Confirmar requiere modal de confirmación? ¿Eso cuenta como "más pasos"?
- **SM-4** dice "Tiempo promedio desde Pedido confirmado hasta validación de pago < 3 minutos en hora pico" — "hora pico" no está definida operacionalmente. ¿11am-2pm? ¿7pm-9pm? Sin definición, el SM es inmedible.

### Findings

- **medium** SM-4 referencia "hora pico" sin definirla (§ 7 Métricas) — *Fix:* Agregar en Glosario o en SM-4: "Hora pico = ventana 12:00-14:00 y 19:00-21:00 horario local."
- **low** FR-15 "no más pasos" es ambiguo — *Fix:* Especificar "UN tap para Confirmar (sin modal); 2 taps para Rechazar (uno abre input motivo, segundo envía)."
- **low** FR-21 dice "≥90% de push llegan en < 30 segundos" en SM-5 pero el FR mismo no menciona target — *Fix:* Trasladar el target del SM al FR para que un engineer que solo lea el FR sepa el bound.

---

## Scope honesty — **strong**

Non-Goals (§5) es robusto: 10 declaraciones explícitas de qué NO somos. Cada una hace trabajo real (anti-marketplace, anti-gig, anti-PSP, anti-fidelización, etc.).

§6.2 Out of Scope for MVP es detallado con razón por cada item ("requiere negociación + tiempo", "validar comportamiento real primero", etc.).

Assumptions Index (§10) lista 8 assumptions con su location. Después de la revisión de assumptions, A-1, A-2, A-3 están marcadas como CONFIRMADAS con strike-through — bien.

`[NOTE FOR PM]` callouts: hay al menos uno explícito en §6.2 sobre cobro manual como riesgo. Podría haber más en puntos críticos (vista Domiciliario nueva, devolución manual de pagos cancelados).

### Findings

- **medium** Assumptions Index tiene desajuste con cuerpo del PRD — A-4 a A-8 están listadas pero NO tienen tag `[ASSUMPTION]` inline en el cuerpo (algunas son ahora decisiones confirmadas pero el index no refleja). *Fix:* O bien (a) agregar tags `[ASSUMPTION]` inline donde corresponda, o (b) reformular el index como "Decisiones de Discovery" e indicar cuáles eran originalmente assumptions y cuáles fueron confirmadas.

---

## Downstream usability — **adequate** (con un fix mecánico crítico)

Glosario presente con 16 términos. Términos usados consistentemente en FRs y UJs (verificado: "Cola FIFO", "Tiquete", "Adición Libre", "Comprobante de Pago", "Modalidad de Entrega" aparecen siempre con la misma forma).

UJs (1-5) son contiguos, todos con protagonista nombrado (María, Carlos, Don Luis, Lucía, Pedro). Bien.

**PROBLEMA MECÁNICO MAYOR:** La numeración de FRs se rompe al agregar la sección Domiciliario:
- §4.7 Configuración: FR-23 a FR-25 ✅
- §4.8 Vista del Domiciliario: **FR-29 a FR-32** ← debería ser FR-26 a FR-29
- §4.9 Administración: **FR-26 a FR-28** ← debería ser FR-30 a FR-32

Esto romperá `bmad-create-epics-and-stories` cuando intente referenciar FRs en orden, y romperá cualquier cross-reference. Un engineer leyendo §4.8 verá "FR-29" y asumirá que faltan FR-26, 27, 28.

### Findings

- **HIGH** FR numbering discontinuity entre §4.8 y §4.9 (mechanical) — *Fix:* Renumerar:
  - §4.8 Vista Domiciliario: FR-29 → FR-26, FR-30 → FR-27, FR-31 → FR-28, FR-32 → FR-29
  - §4.9 Administración: FR-26 → FR-30, FR-27 → FR-31, FR-28 → FR-32
  - Actualizar cross-references si las hay (revisar mención a FR-32 en FR-31 description: "marcar entregado por Mostrador o por Domiciliario — ver FR-32" → cambiar a "FR-29").
- **low** §4.4 FR-16 menciona "FR-32" como referencia al cambio de estado por Domiciliario; este número cambia con el fix HIGH. *Fix:* Verificar y actualizar.

---

## Shape fit — **strong**

PRD es para **consumer + B2B multi-stakeholder + meaningful UX**. La forma elegida es correcta:
- UJs con protagonistas nombrados ✅
- Glosario robusto ✅
- Features agrupadas con FRs anidados ✅
- NFRs cross-cutting separados ✅
- Addendum para profundidad técnica (stack, edge cases, personas extendidas) ✅
- Decision log para trazabilidad ✅

No está over-formalizado (no hay compliance audit innecesario, no hay Stakeholders & Approvals que no aplican). No está under-formalizado (no falta UJs como pasaría en un consumer product mal escrito).

Longitud del PRD (~14 páginas) es **apropiada para stakes "internal/early stage"**. Está en el rango sugerido (5-15 páginas).

### Findings

(ninguna — shape correcto)

---

## Mechanical notes

- **Glossary drift:** No detectada. Términos usados consistentemente.
- **ID continuity:** **ROTA** en FRs (ver Downstream usability HIGH finding). UJs OK.
- **Assumptions Index roundtrip:** Parcialmente roto (ver Scope honesty medium finding).
- **UJ protagonist naming:** OK (María, Carlos, Don Luis, Lucía, Pedro).
- **Required sections para stakes:** Todas presentes. Cross-cutting NFRs incluidos. Sin secciones boilerplate innecesarias.

---

## Resumen de Findings (priorizado)

| Severity | # Findings | Items |
|---|---|---|
| **HIGH** | 1 | FR numbering discontinuity §4.8/§4.9 (BLOQUEANTE para downstream) |
| **MEDIUM** | 3 | Trade-off de precio no surfaceado; SM-4 "hora pico" indefinido; Assumptions Index desajuste |
| **LOW** | 3 | OQ-1 ya respondido; FR-15 "no más pasos" ambiguo; FR-21 target en SM no en FR |

**Total: 7 findings.** 1 bloqueante, 3 importantes para calidad, 3 menores.

---

## Recomendación

**Aplicar el fix HIGH (renumeración) antes de Finalize.** Los 3 medium son recomendados. Los 3 low son opcionales — pueden quedar como deuda técnica menor o resolverse durante el polish.

Después de aplicar fixes HIGH + MEDIUM, el PRD está listo para marcarse como `final` y alimentar `bmad-ux` y `bmad-create-architecture`.
