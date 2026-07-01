import Link from "next/link";

export const metadata = { title: "Page introuvable" };

// Branded 404 — also the export's 404.html (referenced by .htaccess ErrorDocument).
// Uses Brutal Grey, the one palette swatch the main page didn't otherwise call for.
export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] flex-col justify-center bg-brutal px-5 py-24 text-ink md:px-8">
      <p className="font-display text-sm tracking-[0.2em] opacity-70">Erreur 404</p>
      <h1 className="font-display mt-4 text-[clamp(4rem,22vw,15rem)] leading-none">404</h1>
      <p className="mt-6 max-w-xl text-xl md:text-2xl">
        Cette page a disparu. L’émotion, elle, est toujours là.
      </p>
      <Link
        href="/"
        className="font-display mt-8 inline-block w-fit bg-ink px-6 py-4 text-lg uppercase tracking-wide text-lemon hover:opacity-80"
      >
        Retour à l’accueil
      </Link>
    </section>
  );
}
