"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Play, 
  Terminal as TerminalIcon, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  Database,
  Info
} from "lucide-react";
import Link from "next/link";

export default function ScraperPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [reddit, setReddit] = useState(true);
  const [twitter, setTwitter] = useState(true);
  const [news, setNews] = useState(true);
  const [limit, setLimit] = useState(10);
  const [mock, setMock] = useState(true); // default to true since social networks have login walls/bot blockers

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, running, scraping, parsing, analyzing, completed, failed
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // Scroll terminal to bottom when new logs are added
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const startScrape = async () => {
    if (!selectedProjectId) return;
    
    setRunning(true);
    setLogs([]);
    setStatus("running");
    setMessage("Initialisation du processus de scraping...");

    const activeSources = [];
    if (reddit) activeSources.push("reddit");
    if (twitter) activeSources.push("twitter");
    if (news) activeSources.push("news");

    if (activeSources.length === 0) {
      setStatus("failed");
      setMessage("Veuillez sélectionner au moins une source de données.");
      setRunning(false);
      return;
    }

    try {
      const response = await fetch("/api/scrape/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          keyword: selectedProject?.keyword,
          topic: selectedProject?.topic,
          sources: activeSources.join(","),
          limit: limit,
          mock: mock,
        }),
      });

      if (!response.body) {
        throw new Error("Aucun corps de réponse reçu du serveur.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Read SSE stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const payload = JSON.parse(line.substring(6));
              
              if (payload.status) {
                setStatus(payload.status);
              }
              if (payload.message) {
                setMessage(payload.message);
              }
              if (payload.log) {
                setLogs((prev) => [...prev, payload.log]);
              }
            } catch (err) {
              // Fail silently on line parsing errors
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatus("failed");
      setMessage(`Erreur de connexion: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Module de Scraping</h1>
        <p className="text-slate-400">Lancez des tâches Selenium automatisées pour récupérer les mentions de mots-clés</p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center">
          <Database className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Créer d'abord un projet</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
            Vous devez configurer un projet contenant les mots-clés cibles et les thématiques avant de pouvoir lancer le scraping.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Créer un projet
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Controls Form Column */}
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-xl space-y-6">
            <h3 className="text-lg font-bold text-white">Configurations</h3>

            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-slate-300">Sélectionner le projet cible</label>
              <select
                disabled={running}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.keyword})
                  </option>
                ))}
              </select>
            </div>

            {selectedProject && (
              <div className="rounded-lg bg-slate-950 p-4 border border-slate-900 space-y-2 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Thématique :</span>
                  <span className="font-semibold text-white">{selectedProject.topic}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mot-clé cible :</span>
                  <span className="font-semibold text-white">"{selectedProject.keyword}"</span>
                </div>
              </div>
            )}

            <div className="space-y-3.5">
              <label className="text-sm font-semibold text-slate-300">Sélectionner les sources actives</label>
              
              <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={running}
                  checked={reddit}
                  onChange={(e) => setReddit(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                />
                Reddit
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={running}
                  checked={twitter}
                  onChange={(e) => setTwitter(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                />
                Twitter/X
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={running}
                  checked={news}
                  onChange={(e) => setNews(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                />
                Google Actualités
              </label>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm font-semibold text-slate-300">
                <span>Limite de publications par source</span>
                <span className="text-violet-400">{limit} publications</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                disabled={running}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            </div>

            <div className="space-y-3 border-t border-slate-900 pt-4">
              <label className="flex items-start gap-3 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={running}
                  checked={mock}
                  onChange={(e) => setMock(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <span className="block font-semibold">Activer le mode simulé (Recommandé)</span>
                  <span className="block text-xs text-slate-400 mt-0.5">
                    Génère des mentions synthétiques correspondant aux structures DOM exactes des scrapers. Évite les blocages de requêtes (rate limits/captchas) sur Reddit et X.
                  </span>
                </div>
              </label>
            </div>

            <button
              onClick={startScrape}
              disabled={running}
              className="flex w-full items-center justify-center rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50 active:scale-[0.98]"
            >
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exécution du pipeline...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4 fill-white" />
                  Lancer les Scrapers
                </>
              )}
            </button>
          </div>

          {/* Terminal / Live progress Column */}
          <div className="lg:col-span-2 flex flex-col h-[650px] rounded-xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-xl">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div className="flex items-center gap-2">
                <TerminalIcon className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-bold text-white">Terminal d'opérations en direct</h3>
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Statut :</span>
                {status === "idle" && (
                  <span className="rounded-full bg-slate-950 border border-slate-800 px-2.5 py-0.5 text-xs text-slate-400">En attente</span>
                )}
                {running && status !== "completed" && status !== "failed" && (
                  <span className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs text-violet-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {status.toUpperCase()}
                  </span>
                )}
                {status === "completed" && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    TERMINÉ
                  </span>
                )}
                {status === "failed" && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs text-red-400">
                    <AlertTriangle className="h-3 w-3" />
                    ÉCHEC
                  </span>
                )}
              </div>
            </div>

            {/* Active message display */}
            {message && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-950 p-3 border border-slate-900 text-sm text-slate-300">
                <Info className="h-4 w-4 text-violet-400 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Terminal body */}
            <div className="flex-1 mt-4 overflow-y-auto rounded-lg bg-slate-950 p-4 border border-slate-900 font-mono text-xs text-slate-300 space-y-1">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 font-sans text-center">
                  Le terminal est prêt. Configurez les options de la tâche et cliquez sur "Lancer les Scrapers" pour afficher les journaux d'exécution.
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                    {log}
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
