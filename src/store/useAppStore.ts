import { create } from "zustand";

export interface Project {
  id: string;
  name: string;
  description?: string;
  keyword: string;
  topic: string;
  sources: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dataset {
  id: string;
  name: string;
  status: string;
  itemCount: number;
  logs?: string;
  createdAt: string;
  projectId: string;
}

export interface DatasetItem {
  id: string;
  title: string;
  content: string;
  source: string;
  author?: string;
  timestamp: string;
  url?: string;
  sentiment: string;
}

interface AppState {
  projects: Project[];
  activeProject: Project | null;
  datasets: Dataset[];
  activeDataset: Dataset | null;
  items: DatasetItem[];
  logs: string[];
  isScraping: boolean;
  isAnalyzing: boolean;
  
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setDatasets: (datasets: Dataset[]) => void;
  setActiveDataset: (dataset: Dataset | null) => void;
  setItems: (items: DatasetItem[]) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
  setIsScraping: (isScraping: boolean) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  projects: [],
  activeProject: null,
  datasets: [],
  activeDataset: null,
  items: [],
  logs: [],
  isScraping: false,
  isAnalyzing: false,

  setProjects: (projects) => set({ projects }),
  setActiveProject: (activeProject) => set({ activeProject }),
  setDatasets: (datasets) => set({ datasets }),
  setActiveDataset: (activeDataset) => set({ activeDataset }),
  setItems: (items) => set({ items }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setIsScraping: (isScraping) => set({ isScraping }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
}));
