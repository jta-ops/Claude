export interface ResearchConfig {
  topic: string;
  depth: "quick" | "standard" | "deep";
  outputFile?: string;
}

export interface ResearchSession {
  topic: string;
  startTime: Date;
  searchesPerformed: number;
  pagesVisited: number;
  codeExecutions: number;
  savedFiles: string[];
  thinkingTokens: number;
}
