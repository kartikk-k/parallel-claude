export interface Repository {
  id: string;
  name: string;
  slug: string;
  sourcePath: string;
  defaultBranch: string;
  sessionIds: string[];
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  gitRemote?: string;
}
