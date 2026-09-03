import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-5">
      <p className="u-eyebrow">Error 404</p>
      <h1 className="font-display mt-4 text-5xl">Esta página no existe</h1>
      <p className="mt-4 text-cocoa">
        Puede que el enlace haya cambiado o que la cita que buscas ya no esté
        disponible.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn btn-primary">
          Ir al inicio
        </Link>
        <Link href="/reservar" className="btn btn-ghost">
          Reservar cita
        </Link>
      </div>
    </div>
  );
}
