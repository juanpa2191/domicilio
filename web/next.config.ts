import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Cache Components desactivado en MVP — la mayoría de páginas son
  // auth-protected con datos por-request (admin, mostrador, cocina).
  // Re-evaluar en Fase 2 para páginas públicas del Cliente.
  cacheComponents: false,

  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
