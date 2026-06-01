import { CrearComercioForm } from "./_components/crear-comercio-form";

export default function NuevoComercioPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Crear nuevo Comercio</h1>
      <CrearComercioForm />
    </div>
  );
}
