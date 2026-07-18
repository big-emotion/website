import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion — Espace client" };

export default function LoginPage() {
  return (
    <section className="flex min-h-[80svh] flex-col justify-center bg-paper px-5 py-24 text-ink md:px-8">
      <p className="font-display text-sm tracking-[0.2em] opacity-70">
        Espace client
      </p>
      <h1 className="font-display mt-4 text-4xl md:text-5xl">Connexion</h1>
      <p className="mt-4 max-w-md">
        Entre ton e-mail professionnel, on t&apos;envoie un lien de connexion
        à usage unique.
      </p>
      <div className="mt-8 max-w-sm">
        <LoginForm />
      </div>
    </section>
  );
}
