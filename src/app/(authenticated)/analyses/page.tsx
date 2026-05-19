"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Calendar, User, Globe, MessageSquare, HelpCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AnalysesPage() {
  // États de sélection de projet et chargement
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // États de filtrage interactif (sentiment et source)
  const [sentimentFilter, setSentimentFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  // Charge les projets initiaux
  useEffect(() => {
    fetchProjects();
  }, []);

  // Récupère les projets de veille
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
          fetchProjectDetail(data[0].id);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Récupère les détails du projet pour isoler les datasets associés
  const fetchProjectDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      setProjectDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
      setLoading(false);
    }
  };

  // Handler de changement de sélection de projet
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
    fetchProjectDetail(e.target.value);
  };

  // Récupère l'ID du dataset le plus récent associé à ce projet
  const latestDataset = projectDetail?.datasets?.[0];
  const [datasetItems, setDatasetItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Recharge les publications dès que le dataset change
  useEffect(() => {
    if (latestDataset?.id) {
      fetchDatasetItems(latestDataset.id);
    } else {
      setDatasetItems([]);
    }
  }, [latestDataset]);

  // Récupère toutes les publications du dataset concerné
  const fetchDatasetItems = async (id: string) => {
    setItemsLoading(true);
    try {
      const res = await fetch(`/api/datasets/${id}`);
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        setDatasetItems(data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  };

  // Applique les filtres de sentiment et de source sur les publications récupérées
  const filteredItems = datasetItems.filter(item => {
    const sentimentMatch = sentimentFilter === "ALL" || item.sentiment === sentimentFilter;
    const sourceMatch = sourceFilter === "ALL" || item.source.toLowerCase() === sourceFilter.toLowerCase();
    return sentimentMatch && sourceMatch;
  });

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-[85vh] flex-col items-center justify-center text-center">
        <h3 className="text-xl font-bold text-white mb-2">Aucun projet disponible</h3>
        <p className="max-w-md text-slate-400 mb-6">Créez un espace de travail de projet avant de pouvoir visualiser les données analysées.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête de la page d'analyses */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Analyses IA</h1>
          <p className="text-slate-400">Visualisez les publications récupérées et classées par sentiment</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-400">Projet :</label>
          <select
            value={selectedProjectId}
            onChange={handleProjectChange}
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-violet-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {detailLoading || itemsLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : !latestDataset ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Aucune base de données trouvée</h3>
          <p className="text-sm text-slate-400 mb-2">Vous devez d'abord récupérer des données dans le Module de Scraping.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Barre de filtrage interactif */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-900/30 p-4 border border-slate-900 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filtres :</span>
              
              {/* Filtre de sentiments */}
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500"
              >
                <option value="ALL">Tous les sentiments</option>
                <option value="POSITIVE">Positif</option>
                <option value="NEUTRAL">Neutre</option>
                <option value="NEGATIVE">Négatif</option>
              </select>
 
              {/* Filtre de sources */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500"
              >
                <option value="ALL">Toutes les sources</option>
                <option value="REDDIT">Reddit</option>
                <option value="TWITTER/X">Twitter/X</option>
                <option value="NEWS">Actualités</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Affichage de <span className="font-semibold text-white">{filteredItems.length}</span> sur {datasetItems.length} publications
            </div>
          </div>
 
          {/* Liste des publications trouvées */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Aucune publication ne correspond aux critères de filtrage actifs.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isReddit = item.source.toLowerCase() === "reddit";
                const isTwitter = item.source.toLowerCase() === "twitter/x" || item.source.toLowerCase() === "twitter";
                
                return (
                  <div 
                    key={item.id}
                    className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4 hover:border-slate-800 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {/* Macaron de couleur selon le canal (Source) */}
                          {isReddit && (
                            <span className="flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                              <MessageSquare className="h-3 w-3" />
                              Reddit
                            </span>
                          )}
                          {isTwitter && (
                            <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                              <MessageSquare className="h-3 w-3" />
                              Twitter/X
                            </span>
                          )}
                          {!isReddit && !isTwitter && (
                            <span className="flex items-center gap-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-400">
                              <Globe className="h-3 w-3" />
                              Actualités
                            </span>
                          )}
 
                          {/* Tag de sentiment labellisé par l'analyse IA */}
                          {item.sentiment === "POSITIVE" && (
                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              Positif
                            </span>
                          )}
                          {item.sentiment === "NEUTRAL" && (
                            <span className="rounded-full bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                              Neutre
                            </span>
                          )}
                          {item.sentiment === "NEGATIVE" && (
                            <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                              Négatif
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-bold text-white leading-tight">
                          {item.title}
                        </h3>
                      </div>
 
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-xs font-semibold text-violet-400 hover:text-violet-300 hover:underline"
                        >
                          Voir la publication
                        </a>
                      )}
                    </div>
 
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
 
                    <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-950 pt-4">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>{item.author || "anonyme"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
