"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, FolderKanban, Search, Hash } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ProjectsPage() {
  // Liste des projets récupérés depuis la base de données
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États réactifs du formulaire et de la fenêtre modale de création
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keyword, setKeyword] = useState("");
  const [topic, setTopic] = useState("");
  const [reddit, setReddit] = useState(true);
  const [twitter, setTwitter] = useState(true);
  const [news, setNews] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Chargement initial des projets de veille
  useEffect(() => {
    fetchProjects();
  }, []);

  // Récupération de tous les projets existants
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Traitement et soumission du formulaire de création de projet
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Construction de la chaîne de sources actives (Reddit, Twitter/X, News)
    const activeSources = [];
    if (reddit) activeSources.push("reddit");
    if (twitter) activeSources.push("twitter");
    if (news) activeSources.push("news");

    if (activeSources.length === 0) {
      setError("Veuillez sélectionner au moins une source.");
      setSubmitting(false);
      return;
    }

    try {
      // Envoi de la requête POST de création
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          keyword,
          topic,
          sources: activeSources.join(","),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Échec de la création du projet");
      }

      // Réinitialisation des champs du formulaire
      setName("");
      setDescription("");
      setKeyword("");
      setTopic("");
      setShowForm(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête et bouton d'action pour ouvrir le formulaire modal */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Projets</h1>
          <p className="text-slate-400">Configurez les paramètres des mots-clés et les campagnes de veille</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Ajouter un projet
        </button>
      </div>

      {showForm && (
        /* Fenêtre modale de création d'un projet */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-4">Créer un nouveau projet</h3>
            
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nom du projet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex. Veille technologique Next.js"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
                <textarea
                  placeholder="Qu'est-ce que ce projet de veille sociale surveille ?"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500 h-20 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mot-clé de recherche</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex. Server Actions"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Thématique / Sujet</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex. Web Development"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              </div>

              {/* Sélection des réseaux et canaux par défaut à scraper */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">Sources par défaut</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reddit}
                      onChange={(e) => setReddit(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                    />
                    Reddit
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twitter}
                      onChange={(e) => setTwitter(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                    />
                    Twitter/X
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={news}
                      onChange={(e) => setNews(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                    />
                    Actualités
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Aucun projet trouvé</h3>
          <p className="text-sm text-slate-400">Cliquez sur le bouton en haut à droite pour configurer un espace de travail.</p>
        </div>
      ) : (
        /* Grille d'affichage des projets existants */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Hash className="h-3 w-3" />
                  {project.topic}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{project.name}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description || "Aucune description fournie."}</p>
              </div>

              <div className="space-y-3.5 border-t border-slate-950 pt-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Search className="h-4 w-4 text-slate-500" />
                  <span>Mot-clé :</span>
                  <span className="font-semibold text-white">"{project.keyword}"</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Sources :</span>
                  <span className="uppercase font-semibold text-violet-400">{project.sources.replace(/,/g, ", ")}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Créé le :</span>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
