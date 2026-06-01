import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components desactivado en MVP — la mayoría de páginas son
  // auth-protected con datos por-request (admin, mostrador, cocina).
  // Re-evaluar en Fase 2 para páginas públicas del Cliente (catálogo,
  // landing) donde el cache estático sí aporta valor.
  cacheComponents: false,
};

export default nextConfig;
