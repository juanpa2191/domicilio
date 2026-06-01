import { redirect } from "next/navigation";

/**
 * No hay sign-up público (D-21).
 * - Clientes se autentican con Google OAuth (cuenta se crea sola en el primer login).
 * - Usuarios de Comercio reciben credenciales del admin del Comercio.
 * - Admin (juanpis) es invitado manualmente.
 *
 * Redirigimos a login.
 */
export default function SignUpPage() {
  redirect("/auth/login");
}
