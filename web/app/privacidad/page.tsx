import Link from "next/link";

/**
 * Política de Privacidad — Cumplimiento Ley 1581 de 2012 (Habeas Data Colombia).
 * Página pública (no requiere auth) accesible desde login y cualquier flujo de
 * registro/aceptación.
 *
 * ⚠️ MVP DRAFT — este texto debe ser revisado por asesoría legal antes del
 * lanzamiento del piloto público (OQ-5 del PRD).
 */
export default function PrivacidadPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          ← Volver
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última actualización: 1 de junio de 2026 · Cumplimiento Ley 1581 de 2012
        </p>
      </header>

      <article className="prose prose-sm max-w-none [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1">
        <h2>1. Responsable del tratamiento de datos</h2>
        <p>
          Domicilios Norte Aburrá (en adelante, &quot;la Plataforma&quot;) es responsable
          del tratamiento de los datos personales que recolecte de sus usuarios.
          Para cualquier solicitud relacionada con tus datos puedes contactarnos
          al correo <strong>privacidad@domiciliosnortearburrá.co</strong>.
        </p>
        <p className="text-xs text-muted-foreground italic">
          Nota MVP: este email es ilustrativo. Será reemplazado por el oficial
          antes del lanzamiento del piloto.
        </p>

        <h2>2. Datos que recolectamos</h2>
        <p>Recolectamos solo los datos necesarios para que la Plataforma funcione:</p>
        <ul>
          <li>
            <strong>Si eres Cliente:</strong> nombre, correo electrónico (a
            través de tu cuenta de Google), número de celular, dirección(es) de
            entrega, historial de Pedidos.
          </li>
          <li>
            <strong>Si eres usuario de un Comercio:</strong> nombre, correo
            electrónico, rol asignado por el administrador del Comercio.
          </li>
          <li>
            <strong>Datos transaccionales:</strong> Pedidos realizados,
            comprobantes de pago (imágenes), estados del Pedido, mensajes
            asociados.
          </li>
        </ul>
        <p>
          No recolectamos datos de tarjetas de crédito ni información bancaria.
          Los pagos los realizas directamente al Comercio mediante transferencia,
          fuera de la Plataforma.
        </p>

        <h2>3. Finalidad del tratamiento</h2>
        <p>Usamos tus datos exclusivamente para:</p>
        <ul>
          <li>Procesar y gestionar tus Pedidos.</li>
          <li>Comunicarte el estado de tu Pedido.</li>
          <li>Facilitar la entrega por parte del Comercio.</li>
          <li>Brindarte soporte cuando lo solicites.</li>
          <li>Cumplir con obligaciones legales aplicables.</li>
        </ul>
        <p>
          <strong>NO vendemos tus datos a terceros.</strong> No los compartimos
          con terceros excepto con el Comercio respectivo donde realizas el
          Pedido (que ya es parte de la transacción).
        </p>

        <h2>4. Comprobantes de pago</h2>
        <p>
          Los comprobantes de pago que subes a la Plataforma se almacenan
          cifrados en reposo y se eliminan automáticamente <strong>30 días</strong>
          después de la fecha del Pedido. Solo el Comercio al que enviaste el
          Pedido puede acceder a la imagen, mediante una URL firmada con
          expiración corta.
        </p>

        <h2>5. Tus derechos como titular</h2>
        <p>
          La Ley 1581 de 2012 te garantiza los siguientes derechos sobre tus
          datos personales:
        </p>
        <ul>
          <li>
            <strong>Acceso:</strong> conocer qué datos tenemos sobre ti.
          </li>
          <li>
            <strong>Rectificación:</strong> corregir datos imprecisos o
            incompletos.
          </li>
          <li>
            <strong>Supresión:</strong> solicitar la eliminación de tus datos.
          </li>
          <li>
            <strong>Revocar tu consentimiento</strong> en cualquier momento.
          </li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, envíanos un correo a{" "}
          <strong>privacidad@domiciliosnortearburrá.co</strong> desde la cuenta
          de email asociada a tu usuario. Responderemos en un plazo máximo de
          15 días hábiles, conforme a la ley.
        </p>

        <h2>6. Seguridad</h2>
        <p>
          Toda comunicación con la Plataforma se realiza mediante HTTPS. Las
          contraseñas (cuando aplican) se almacenan con hash bcrypt. La
          infraestructura de base de datos cifra los datos en reposo. Aplicamos
          el principio de mínimo privilegio: cada usuario solo ve los datos
          que le corresponden según su rol.
        </p>

        <h2>7. Menores de edad</h2>
        <p>
          La Plataforma está dirigida a personas mayores de edad. Si tienes
          menos de 18 años, debes contar con autorización expresa de tu
          representante legal para usar el servicio.
        </p>

        <h2>8. Cambios a esta política</h2>
        <p>
          Podemos actualizar esta política. Te notificaremos los cambios
          significativos por correo electrónico o mediante una notificación en
          la Plataforma. La fecha de última actualización aparece arriba.
        </p>

        <h2>9. Autorización del titular</h2>
        <p>
          Al registrarte y usar la Plataforma, autorizas expresamente el
          tratamiento de tus datos personales según lo descrito en esta
          política, conforme a lo establecido en la Ley 1581 de 2012 y sus
          decretos reglamentarios.
        </p>
      </article>

      <footer className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        <Link href="/auth/login" className="hover:text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </footer>
    </div>
  );
}
