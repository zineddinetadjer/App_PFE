"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "Identifiants invalides" : res.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur inattendue est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[100px]" />

      <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
            <span className="text-2xl font-bold tracking-tight">IF</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Connexion</h2>
          <p className="mt-2 text-sm text-slate-400">
            Connectez-vous pour commencer la veille et l'analyse sociale par IA
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Se connecter
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-slate-400 mt-6">
          Vous n'avez pas de compte ?{" "}
          <Link href="/register" className="font-semibold text-violet-400 hover:text-violet-300">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
