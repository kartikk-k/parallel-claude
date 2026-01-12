export interface SessionMetadata {
  id: string;
  repositoryId: string;
  title: string;
  branchName: string;
  baseBranch: string;
  createdAt: string;
  workingDirectory: string;
  autoRunCommand?: string;
  isRunning: boolean;
  status: string;
  previewUrl?: string;
}
