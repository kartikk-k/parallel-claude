// Project config.json structure (stored in ~/ParallelClaude/project-name/config.json)
export interface ProjectConfig {
  id: string;
  name: string;
  slug: string;
  sourcePath: string; // Original source folder path
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  defaultBranch: string;
  gitRemote?: string;
  sessions: SessionMetadata[];
  settings?: {
    autoRunCommand?: string;
    gitUserName?: string;
    gitUserEmail?: string;
  };
}

// Lightweight representation of a project for listing
export interface Repository {
  id: string;
  name: string;
  slug: string;
  sourcePath: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  sessionIds: string[];
  defaultBranch: string;
  gitRemote?: string;
}

export interface SessionMetadata {
  id: string;
  repositoryId: string;
  title: string;
  branchName: string;
  baseBranch: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  workingDirectory: string;
  autoRunCommand?: string;
  isRunning: boolean;
  filesChanged: number;
  status: 'active' | 'idle' | 'merged' | 'archived';
}

export interface AppConfig {
  version: string;
  currentRepositoryId: string | null;
  currentSessionId: string | null;
  workspacePath: string;
  maxSessionsPerRepo: number;
  autoCleanup: boolean;
  gitUserName?: string;
  gitUserEmail?: string;
}

export interface GitChanges {
  modified: string[];
  added: string[];
  deleted: string[];
}

export interface RepositoryInfo {
  name: string;
  currentBranch: string;
  remoteUrl: string | null;
}
