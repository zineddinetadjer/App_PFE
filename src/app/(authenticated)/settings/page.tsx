"use client";

import { useSession } from "next-auth/react";
import { Settings as SettingsIcon, Info, Database, Shield, Server, Check } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Paramètres</h1>
        <p className="text-slate-400">Gérez les profils de votre espace de travail et visualisez les paramètres d'analyse de l'IA</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* User Card */}
        <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">Profil utilisateur actif</h3>
              <p className="text-xs text-slate-400">Détails du compte authentifié</p>
            </div>
          </div>

          <div className="space-y-3.5 border-t border-slate-950 pt-4 text-sm">
            <div className="space-y-0.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nom</span>
              <span className="block text-white font-medium">{session?.user?.name || "Utilisateur Premium"}</span>
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Adresse e-mail</span>
              <span className="block text-white font-medium">{session?.user?.email || "user@insightflow.ai"}</span>
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Rôle d'accès</span>
              <span className="block text-violet-400 font-bold">Évaluateur PFE</span>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="lg:col-span-2 rounded-xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="h-5 w-5 text-violet-400" />
            Architecture & Diagnostics de la plateforme
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Database Diagnostics */}
            <div className="rounded-lg bg-slate-950 p-4 border border-slate-900 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Database className="h-4 w-4 text-violet-400" />
                Moteur de base de données
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exécution d'instances de base de données via <strong>Prisma ORM</strong> et l'adaptateur de pilote local <strong>LibSQL / SQLite</strong>.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 rounded px-2 py-1 w-fit">
                <Check className="h-3 w-3" />
                EN LIGNE (dev.db)
              </div>
            </div>

            {/* Python / Selenium status */}
            <div className="rounded-lg bg-slate-950 p-4 border border-slate-900 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Info className="h-4 w-4 text-fuchsia-400" />
                Moteurs de scraping & IA
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scripts NLP Python utilisant <strong>TextBlob</strong>, le pilote <strong>Selenium</strong> et Chrome Headless.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 rounded px-2 py-1 w-fit">
                <Check className="h-3 w-3" />
                VENV ACTIVÉ (.venv)
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/60 border border-slate-900 p-4 text-xs text-slate-400 space-y-2">
            <span className="block font-semibold text-white uppercase tracking-wider text-[10px]">Notes académiques</span>
            <p className="leading-relaxed">
              Ce système est développé dans le cadre d'un Projet de Fin d'Études (PFE) universitaire.
              Le backend gère les opérations concurrentes des services Node.js qui exécutent des sous-processus de scripts Python. 
              Les journaux (logs) sont traités en temps réel par redirection de la sortie standard (stdout).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
