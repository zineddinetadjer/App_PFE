"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, FileText, Printer, Calendar, Award, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

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

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
    fetchProjectDetail(e.target.value);
  };

  const latestReport = projectDetail?.reports?.[0];

  // Parse details
  let insights: string[] = [];
  if (latestReport?.keyInsights) {
    insights = JSON.parse(latestReport.keyInsights);
  }

  let conclusions: string[] = [];
  if (latestReport?.conclusions) {
    conclusions = JSON.parse(latestReport.conclusions);
  }

  const handlePrint = () => {
    window.print();
  };

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
        <h3 className="text-xl font-bold text-white mb-2">Aucun rapport disponible</h3>
        <p className="max-w-md text-slate-400 mb-6 font-medium">Configurez un espace de travail et lancez les pipelines pour voir les rapports générés.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:p-0 print:bg-white print:text-black">
      {/* Header Controls (Hidden on Print) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Rapports SaaS</h1>
          <p className="text-slate-400">Générez des rapports PDF de synthèse et des résumés de vos campagnes de veille</p>
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

          {latestReport && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
            >
              <Printer className="h-4 w-4" />
              Imprimer / PDF
            </button>
          )}
        </div>
      </div>

      {detailLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : !latestReport ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center print:hidden">
          <FileText className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Aucun rapport généré</h3>
          <p className="text-sm text-slate-400">Veuillez lancer le scraping et le traitement NLP pour construire un rapport.</p>
        </div>
      ) : (
        /* Report Paper Sheet Container */
        <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-8 md:p-12 backdrop-blur-xl space-y-8 max-w-4xl mx-auto shadow-2xl print:border-none print:bg-white print:p-0 print:text-slate-900">
          
          {/* Paper Header */}
          <div className="border-b border-slate-800 pb-6 print:border-slate-300">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest print:text-violet-700">Analyses de Synthèse InsightFlow</span>
                <h2 className="text-3xl font-extrabold text-white mt-1 print:text-slate-900">{latestReport.title}</h2>
              </div>
              <div className="text-right text-xs text-slate-400 print:text-slate-500">
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(latestReport.createdAt)}</span>
                </div>
                <div className="mt-1">
                  <span>Réf : IF-REP-{latestReport.id.substring(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Parameters Info */}
          <div className="grid grid-cols-3 gap-4 rounded-xl bg-slate-950 p-4 border border-slate-900 text-xs text-slate-400 print:bg-slate-100 print:border-slate-300 print:text-slate-700">
            <div>
              <span className="block font-semibold text-slate-500 print:text-slate-500 uppercase tracking-wider text-[10px]">Thématique</span>
              <span className="block font-bold text-white text-sm mt-0.5 print:text-slate-900">{projectDetail.topic}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-500 print:text-slate-500 uppercase tracking-wider text-[10px]">Mot-clé cible</span>
              <span className="block font-bold text-white text-sm mt-0.5 print:text-slate-900">"{projectDetail.keyword}"</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-500 print:text-slate-500 uppercase tracking-wider text-[10px]">Sources interrogées</span>
              <span className="block font-bold text-white text-sm mt-0.5 print:text-slate-900 uppercase">{projectDetail.sources.replace(/,/g, ", ")}</span>
            </div>
          </div>

          {/* Executive summary block */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white border-l-4 border-violet-500 pl-3 print:text-slate-900 print:border-violet-700">1. Synthèse globale</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap print:text-slate-700">
              {latestReport.summary}
            </p>
          </div>

          {/* Key Insights List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white border-l-4 border-violet-500 pl-3 print:text-slate-900 print:border-violet-700">2. Analyses clés</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {insights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className="rounded-xl border border-slate-900/60 bg-slate-900/20 p-4 flex gap-3 text-sm text-slate-300 print:border-slate-200 print:bg-white print:text-slate-700"
                >
                  <Award className="h-5 w-5 text-violet-400 shrink-0 mt-0.5 print:text-violet-700" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Conclusions */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white border-l-4 border-violet-500 pl-3 print:text-slate-900 print:border-violet-700">3. Recommandations stratégiques</h3>
            <div className="space-y-3.5">
              {conclusions.map((conclusion, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3.5 text-sm text-slate-300 print:text-slate-700"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 print:text-emerald-700" />
                  <span>{conclusion}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Report Footer */}
          <div className="border-t border-slate-800 pt-6 flex justify-between items-center text-[10px] text-slate-500 print:border-slate-300 print:text-slate-400">
            <span>Propulsé par les moteurs d'IA InsightFlow • Projet de Fin d'Études (PFE)</span>
            <span>Page 1 sur 1</span>
          </div>

        </div>
      )}
    </div>
  );
}
