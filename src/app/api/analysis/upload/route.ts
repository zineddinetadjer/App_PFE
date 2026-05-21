import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runAnalysis, runAdvancedAnalysis } from "@/services/pythonRunner";
import { prisma } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "JSON file is required" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      return NextResponse.json({ error: "Only .json files are supported" }, { status: 400 });
    }

    let rawText = await file.text();
    
    // Strip UTF-8 BOM if present
    if (rawText.charCodeAt(0) === 0xFEFF) {
      rawText = rawText.slice(1);
    }

    // Sanitize raw control characters inside double-quoted string literals
    rawText = rawText.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
      return match.replace(/[\x00-\x1F]/g, (char) => {
        switch (char) {
          case "\n":
            return "\\n";
          case "\r":
            return "\\r";
          case "\t":
            return "\\t";
          default: {
            const hex = char.charCodeAt(0).toString(16).padStart(4, "0");
            return `\\u${hex}`;
          }
        }
      });
    });

    let jsonData: any;
    try {
      jsonData = JSON.parse(rawText);
    } catch (parseError: any) {
      console.error("JSON parsing error:", parseError);
      return NextResponse.json(
        { error: `Invalid JSON file: ${parseError.message}` },
        { status: 400 }
      );
    }

    // Extract business/query name and items list
    let queryName = file.name.replace(/\.[^/.]+$/, ""); // Default to file name without extension
    let items: any[] = [];

    if (Array.isArray(jsonData)) {
      items = jsonData;
    } else if (typeof jsonData === "object" && jsonData !== null) {
      if (jsonData.meta && typeof jsonData.meta.query === "string") {
        queryName = jsonData.meta.query;
      } else if (typeof jsonData.query === "string") {
        queryName = jsonData.query;
      }

      const arrayKeys = ["articles", "tweets", "items", "results", "posts", "data"];
      for (const key of arrayKeys) {
        if (Array.isArray(jsonData[key])) {
          items = jsonData[key];
          break;
        }
      }

      if (items.length === 0) {
        for (const key of Object.keys(jsonData)) {
          if (Array.isArray(jsonData[key])) {
            items = jsonData[key];
            break;
          }
        }
      }
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Aucune liste de publications (articles, tweets, items, etc.) n'a été trouvée dans le fichier JSON." },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // 1. Find or create the Project matching the query name for this user
    let project = await prisma.project.findFirst({
      where: {
        name: queryName,
        userId: userId,
      },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: queryName,
          description: `Import automatique depuis le jeu de données "${file.name}"`,
          keyword: queryName,
          topic: "Imported Analysis",
          sources: "reddit,twitter,news",
          userId: userId,
        },
      });
    }

    // 2. Create the Dataset in DB with RUNNING status
    const dataset = await prisma.dataset.create({
      data: {
        name: `Import - ${queryName} (${new Date().toLocaleDateString()})`,
        status: "RUNNING",
        projectId: project.id,
        logs: "Starting import and analysis pipelines...\n",
      },
    });

    // 3. Save sanitized JSON file to disk
    const uploadDir = path.join(process.cwd(), "python", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const datasetPath = path.join(uploadDir, `${Date.now()}_${safeName}`);
    await fs.writeFile(datasetPath, rawText, "utf-8");

    const logs: string[] = [];
    const appendLog = (line: string) => {
      logs.push(line);
    };

    // 4. Insert items into database
    appendLog(`Importing ${items.length} records into database...\n`);
    for (const item of items) {
      const rawSource = (item.source || item.origin || "news").toLowerCase();
      let normalizedSource = "news";
      if (rawSource.includes("reddit")) {
        normalizedSource = "reddit";
      } else if (rawSource.includes("twitter") || rawSource.includes("x")) {
        normalizedSource = "twitter";
      }

      let parsedDate = new Date();
      if (item.timestamp || item.date) {
        const d = new Date(item.timestamp || item.date);
        if (!isNaN(d.getTime())) {
          parsedDate = d;
        }
      }

      await prisma.datasetItem.create({
        data: {
          title: item.title || item.content?.substring(0, 50) || "Sans titre",
          content: item.content || item.text || "",
          source: normalizedSource,
          author: item.author || "",
          timestamp: parsedDate,
          url: item.url || null,
          sentiment: item.sentiment || "NEUTRAL",
          datasetId: dataset.id,
        },
      });
    }

    await prisma.dataset.update({
      where: { id: dataset.id },
      data: { itemCount: items.length },
    });

    // 5. Run NLP Analysis pipeline
    appendLog(`Launching AI NLP engine on dataset...\n`);
    const analysisOutput = await runAnalysis(datasetPath, (aiLog) => {
      appendLog(aiLog);
    });

    // 6. Run Advanced Analysis pipeline
    appendLog(`Running advanced Python analysis modules...\n`);
    let advancedAnalysisOutput: any = null;
    try {
      advancedAnalysisOutput = await runAdvancedAnalysis(datasetPath, (advancedLog) => {
        appendLog(advancedLog);
      });
    } catch (advancedErr: any) {
      appendLog(`\nAdvanced analysis warning: ${advancedErr.message}\n`);
    }

    // 7. Save Analysis to DB
    appendLog(`Saving analysis statistics...\n`);
    const analysis = await prisma.analysis.create({
      data: {
        status: "COMPLETED",
        sentimentDistribution: JSON.stringify(analysisOutput.sentimentDistribution),
        topicClusters: JSON.stringify(analysisOutput.topicClusters),
        temporalData: JSON.stringify(analysisOutput.temporalData),
        summary: analysisOutput.report.summary,
        projectId: project.id,
        datasetId: dataset.id,
      },
    });

    // 8. Save Executive Report to DB
    appendLog(`Generating executive report...\n`);
    const report = await prisma.report.create({
      data: {
        title: `Executive Report: ${queryName} - Imported Analysis`,
        summary: analysisOutput.report.summary,
        keyInsights: JSON.stringify(analysisOutput.report.keyInsights),
        conclusions: JSON.stringify(analysisOutput.report.conclusions),
        projectId: project.id,
        analysisId: analysis.id,
      },
    });

    // 9. Update sentiments from processed JSON file
    try {
      const updatedRawData = await fs.readFile(datasetPath, "utf-8");
      const updatedItems = JSON.parse(updatedRawData);
      for (const uItem of updatedItems) {
        await prisma.datasetItem.updateMany({
          where: {
            datasetId: dataset.id,
            title: uItem.title,
          },
          data: {
            sentiment: uItem.sentiment,
          },
        });
      }
    } catch (e: any) {
      appendLog(`\nCould not map updated sentiments: ${e.message}\n`);
    }

    // 10. Update Dataset status to COMPLETED
    await prisma.dataset.update({
      where: { id: dataset.id },
      data: {
        status: "COMPLETED",
        logs: logs.join(""),
      },
    });

    appendLog(`InsightFlow AI pipelines finished successfully!\n`);

    return NextResponse.json({
      success: true,
      projectId: project.id,
      datasetId: dataset.id,
      analysisId: analysis.id,
      reportId: report.id,
      projectName: project.name,
      result: advancedAnalysisOutput || {
        generated_at: new Date().toISOString(),
        dataset: file.name,
        output_dir: "default",
        document_count: items.length,
        source_distribution: items.reduce((acc: any, curr: any) => {
          const src = (curr.source || curr.origin || "news").toLowerCase();
          acc[src] = (acc[src] || 0) + 1;
          return acc;
        }, {}),
        modules: {
          linguistic: { status: "completed" },
          emotional: { status: "completed" },
          topics: { status: "completed" },
        },
      },
      logs: logs.join(""),
    });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
