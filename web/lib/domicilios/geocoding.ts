// Geocoding via Google Maps Geocoding API. Server-side only.
// Devuelve null si la dirección no se puede geocodificar — el caller decide
// si bloquear o seguir sin coordenadas.

type LatLng = { lat: number; lng: number };

const COMPONENTS = "country:CO|administrative_area:Antioquia";

export async function geocodificarDireccion(
  texto: string
): Promise<LatLng | null> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) {
    console.warn("[geocoding] GOOGLE_MAPS_SERVER_KEY no configurada");
    return null;
  }
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", texto);
  url.searchParams.set("components", COMPONENTS);
  url.searchParams.set("region", "co");
  url.searchParams.set("language", "es");
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      results: { geometry: { location: LatLng } }[];
    };
    if (data.status !== "OK" || data.results.length === 0) return null;
    return data.results[0].geometry.location;
  } catch {
    return null;
  }
}
