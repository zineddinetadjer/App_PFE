"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  BrainCircuit, 
  Loader2,
  AlertCircle,
  FileText
} from "lucide-react";
import Link from "next/link";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  // États réactifs pour stocker les projets, le projet sélectionné et ses détails analysés
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // Charger les projets au montage du composant
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projectIdParam = params.get("projectId");
    fetchProjects(projectIdParam);
  }, []);

  // Récupère la liste de tous les projets de veille depuis l'API
  const fetchProjects = async (preselectedId?: string | null) => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
        if (data.length > 0) {
          // Sélectionne le projet demandé ou par défaut le premier projet
          const activeProj = (preselectedId && data.find(p => p.id === preselectedId)) || data[0];
          setSelectedProject(activeProj);
          fetchProjectDetail(activeProj.id);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Récupère les métriques, datasets et rapports détaillés d'un projet spécifique
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

  // Gestionnaire de changement de projet sélectionné dans le menu déroulant
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const proj = projects.find(p => p.id === e.target.value);
    if (proj) {
      setSelectedProject(proj);
      fetchProjectDetail(proj.id);
    }
  };

  // État de chargement initial de la page
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // État d'absence complète de projets (redirection vers la création de projet)
  if (projects.length === 0) {
    return (
      <div className="flex h-[85vh] flex-col items-center justify-center text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-400 border border-violet-500/20 mb-6">
          <BrainCircuit className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Aucun projet configuré</h3>
        <p className="max-w-md text-slate-400 mb-8">
          Créez votre premier projet de veille pour définir des mots-clés, lancer le scraping Selenium et générer des analyses par IA.
        </p>
        <Link 
          href="/projects" 
          className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98]"
        >
          Créer un projet
        </Link>
      </div>
    );
  }

  // Extraction des informations les plus récentes (Analyse IA, Rapport, Dataset)
  const latestAnalysis = projectDetail?.analyses?.[0];
  const latestReport = projectDetail?.reports?.[0];
  const latestDataset = projectDetail?.datasets?.[0];

  // Restructuration des statistiques sentimentales pour les graphiques Recharts (Donut)
  let sentimentData: any[] = [];
  let totalMentions = latestDataset?.itemCount || 0;
  if (latestAnalysis?.sentimentDistribution) {
    const dist = JSON.parse(latestAnalysis.sentimentDistribution);
    sentimentData = [
      { name: "Positif", value: dist.positive || 0, color: "#10b981" },
      { name: "Neutre", value: dist.neutral || 0, color: "#64748b" },
      { name: "Négatif", value: dist.negative || 0, color: "#ef4444" },
    ].filter(d => d.value > 0);
  }

  // Restructuration des mentions temporelles (Volume quotidien)
  let timelineData: any[] = [];
  if (latestAnalysis?.temporalData) {
    timelineData = JSON.parse(latestAnalysis.temporalData);
  }

  // Restructuration des groupes thématiques identifiés (BERTopic)
  let clusters: any[] = [];
  if (latestAnalysis?.topicClusters) {
    clusters = JSON.parse(latestAnalysis.topicClusters).clusters || [];
  }

  // Restructuration des insights clés
  let insights: string[] = [];
  if (latestReport?.keyInsights) {
    insights = JSON.parse(latestReport.keyInsights);
  }

  return (
    <div className="space-y-8">
      {/* Barre d'en-tête et sélecteur d'espace de travail */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Tableau de bord InsightFlow</h1>
          <p className="text-slate-400">Suivi en temps réel de la distribution des sentiments et des analyses NLP</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-400">Espace de travail :</label>
          <select
            value={selectedProject?.id || ""}
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

      {detailLoading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : !latestAnalysis ? (
        /* État si aucun scraping n'a encore été lancé pour ce projet */
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Aucune donnée d'analyse disponible</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
            Vous devez lancer le scraper et l'analyse sur ce projet pour générer des tableaux de bord.
          </p>
          <Link
            href="/scraper"
            className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Lancer le Scraper
          </Link>
        </div>
      ) : (
        <>
          {/* Cartes d'indicateurs clés de performance (KPI Cards) */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Mentions Totales</span>
                <MessageSquare className="h-5 w-5 text-violet-400" />
              </div>
              <div className="mt-2.5">
                <span className="text-3xl font-extrabold text-white">{totalMentions}</span>
                <span className="ml-2 text-xs text-emerald-400 font-medium">Messages synchronisés</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Nombre de thèmes</span>
                <BrainCircuit className="h-5 w-5 text-fuchsia-400" />
              </div>
              <div className="mt-2.5">
                <span className="text-3xl font-extrabold text-white">{clusters.length}</span>
                <span className="ml-2 text-xs text-fuchsia-400 font-medium">Catégories actives</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Score de Sentiment</span>
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="mt-2.5">
                <span className="text-3xl font-extrabold text-white">
                  {sentimentData.find(d => d.name === "Positif")?.value || 0}
                </span>
                <span className="ml-2 text-xs text-emerald-400 font-medium">Réponses positives</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">Dernière action</span>
                <FileText className="h-5 w-5 text-amber-400" />
              </div>
              <div className="mt-2.5">
                <span className="block truncate text-sm font-extrabold text-white">
                  {latestReport?.title || "Aucun rapport"}
                </span>
                <span className="block text-[10px] text-slate-400 mt-1">
                  Généré le {latestReport ? formatDate(latestReport.createdAt) : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Section Graphiques : Volume temporel et Donut des sentiments */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Graphique d'aire (Area Chart) pour le volume des mentions */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 lg:col-span-2">
              <h3 className="text-lg font-bold text-white mb-4">Volume au fil du temps</h3>
              <div className="h-80">
{timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc" }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Area type="monotone" dataKey="mentions" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorMentions)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">Aucune donnée temporelle</div>
              )}
              </div>
            </div>

            {/* Graphique en camembert (Pie Chart / Donut) pour la répartition sentimentale */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Distribution des sentiments</h3>
              <div className="h-64">
                {sentimentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">
                    Aucune statistique de sentiment
                  </div>
                )}
              </div>
              {/* Légende interactive des couleurs sous le Donut */}
              <div className="mt-4 flex justify-around text-xs">
                {sentimentData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-slate-300 font-medium">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section NLP & IA : Synthèse stratégique et clusters de thématiques */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Boîte de résumé de l'IA (Executive Summary) */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Synthèse de l'IA</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {latestReport?.summary}
              </p>
              
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Analyses clés</h4>
              <ul className="space-y-2.5">
                {insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                     <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Clusters thématiques (pourcentage d'apparition + mots-clés associés) */}
            <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 space-y-5">
              <h3 className="text-lg font-bold text-white">Groupes de thèmes dominants</h3>
              <div className="space-y-4.5">
                {clusters.map((cluster, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-200">{cluster.topic}</span>
                      <span className="text-slate-400 font-medium">{cluster.percentage}%</span>
                    </div>
                    {/* Barre de progression avec dégradé moderne */}
                    <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-900">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full" 
                        style={{ width: `${cluster.percentage}%` }}
                      />
                    </div>
                    {/* Tags individuels des mots-clés du cluster */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {cluster.keywords.map((kw: string) => (
                        <span key={kw} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
