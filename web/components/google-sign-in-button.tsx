"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Botón reutilizable para login con Google OAuth.
 * Después del callback, el handler decide a qué surface redirigir según el rol.
 */
export function GoogleSignInButton({
  className,
  label = "Continuar con Google",
}: {
  className?: string;
  label?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      // Si todo va bien, el browser navega a Google. No llegamos aquí.
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos conectarte con Google. Inténtalo de nuevo."
      );
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={isLoading}
      onClick={handleClick}
    >
      {isLoading ? (
        "Conectando..."
      ) : (
        <>
          <GoogleIcon className="size-4" />
          {label}
        </>
      )}
    </Button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.351Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.405 13.9a6.014 6.014 0 0 1 0-3.8V7.51H3.064a10 10 0 0 0 0 8.977l3.341-2.587Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.977c1.47 0 2.786.505 3.823 1.495l2.868-2.868C16.959 2.99 14.695 2 12 2A9.996 9.996 0 0 0 3.064 7.51l3.341 2.59C7.19 7.737 9.395 5.977 12 5.977Z"
        fill="#EA4335"
      />
    </svg>
  );
}
