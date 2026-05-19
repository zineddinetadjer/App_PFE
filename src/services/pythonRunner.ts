import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// Options de configuration pour le processus de scraping
export interface ScrapeOptions {
  keyword: string;
  topic: string;
  sources: string;
  limit: number;
  mock: boolean;
}

/**
 * Lance le script de scraping principal run_scrapers.py dans le sous-processus Python.
 * Pipe la sortie standard stdout pour diffuser les logs de progression.
 */
export function runScraper(
  options: ScrapeOptions,
  onLog: (data: string) => void,
  onComplete: (datasetPath: string | null) => void
) {
  // Chemin absolu vers l'exécutable Python dans l'environnement virtuel (.venv) de Windows
  const pythonBin = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
  const scriptPath = path.join(process.cwd(), "python", "scrapers", "run_scrapers.py");

  // Liste des arguments à passer au script Python
  const args = [
    scriptPath,
    "--keyword", options.keyword,
    "--topic", options.topic,
    "--sources", options.sources,
    "--limit", String(options.limit),
    "--mock", String(options.mock),
    "--output_dir", path.join(process.cwd(), "python", "datasets")
  ];

  // Instanciation du processus enfant de manière asynchrone
  const pyProcess = spawn(pythonBin, args);

  let datasetPath: string | null = null;

  // Intercepte les écritures sur la sortie standard stdout
  pyProcess.stdout.on("data", (data) => {
    const chunk = data.toString();
    onLog(chunk);

    // Détecte le chemin du fichier JSON généré à la fin du scraping
    const match = chunk.match(/DATASET_PATH:(.*)/);
    if (match && match[1]) {
      datasetPath = match[1].trim();
    }
  });

  // Intercepte les messages d'erreur du stderr de Python
  pyProcess.stderr.on("data", (data) => {
    onLog(`[ERROR] ${data.toString()}`);
  });

  // Gère la terminaison du processus enfant
  pyProcess.on("close", (code) => {
    onLog(`Scraper process exited with code ${code}`);
    onComplete(datasetPath);
  });
}

/**
 * Lance le script d'analyse IA et NLP analyze.py sur le dataset produit.
 * Retourne une promesse résolue avec les résultats JSON structurés extraits de la sortie standard stdout.
 */
export function runAnalysis(
  datasetPath: string,
  onLog: (data: string) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Chemin absolu vers le script d'analyse Python dans .venv
    const pythonBin = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
    const scriptPath = path.join(process.cwd(), "python", "ai", "analyze.py");

    const args = [scriptPath, "--dataset", datasetPath];
    const pyProcess = spawn(pythonBin, args);

    let stdoutBuffer = "";

    // Collecte les données de sortie stdout dans un buffer local
    pyProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      onLog(chunk);
      stdoutBuffer += chunk;
    });

    pyProcess.stderr.on("data", (data) => {
      onLog(`[AI ERROR] ${data.toString()}`);
    });

    pyProcess.on("close", (code) => {
      onLog(`AI analysis process exited with code ${code}`);
      if (code !== 0) {
        reject(new Error(`Analysis failed with exit code ${code}`));
        return;
      }

      try {
        // Extraction du bloc JSON délimité par des marqueurs spécifiques
        const startMarker = "---ANALYSIS_START---";
        const endMarker = "---ANALYSIS_END---";
        
        const startIndex = stdoutBuffer.indexOf(startMarker);
        const endIndex = stdoutBuffer.indexOf(endMarker);

        if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
          throw new Error("Could not find start/end markers in AI output");
        }

        const jsonStr = stdoutBuffer.slice(startIndex + startMarker.length, endIndex).trim();
        const results = JSON.parse(jsonStr);
        resolve(results);
      } catch (err: any) {
        reject(new Error(`Failed to parse AI output: ${err.message}`));
      }
    });
  });
}
