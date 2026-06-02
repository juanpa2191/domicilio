"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { getUserSurface } from "@/lib/domicilios/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const SURFACE_PATHS = {
  admin: "/admin",
  mostrador: "/mostrador",
  cocina: "/cocina",
  cliente: "/cliente",
} as const;

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [showComercioForm, setShowComercioForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleComercioLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("No se pudo obtener la sesión.");

      // Si es primer login (password temporal) → forzar cambio
      if (data.user.user_metadata?.must_change_password === true) {
        router.push("/auth/cambiar-password");
        return;
      }

      const surface = await getUserSurface(supabase, data.user.id);
      router.push(SURFACE_PATHS[surface]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos iniciar tu sesión. Revisa tus datos."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>
            Entra con tu cuenta de Google. Si eres parte de un Comercio,
            usa tu cuenta de empleado. Al continuar aceptas nuestra{" "}
            <Link
              href="/privacidad"
              target="_blank"
              className="text-primary underline-offset-4 hover:underline"
            >
              política de privacidad
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <GoogleSignInButton className="w-full" />

            <div className="relative my-2">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                o
              </span>
            </div>

            {!showComercioForm ? (
              <Button
                type="button"
                variant="ghost"
                className="text-sm"
                onClick={() => setShowComercioForm(true)}
              >
                Soy parte de un Comercio (entrar con email)
              </Button>
            ) : (
              <form onSubmit={handleComercioLogin} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="don.luis@restaurante.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComercioForm(false)}
                >
                  Volver
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
