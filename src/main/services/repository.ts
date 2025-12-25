import { v4 as uuidv4 } from 'uuid';
import type { Repository, ProjectConfig } from '../types';
import { StorageService } from './storage';
import { GitService } from './git';

export class RepositoryService {
  private storage: StorageService;
  private git: GitService;

  constructor(storage: StorageService, git: GitService) {
    this.storage = storage;
    this.git = git;
  }

  private createSlug(name: string, existingSlugs: string[]): string {
    // Convert to lowercase and replace spaces/special chars with hyphens
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Handle collisions
    let finalSlug = slug;
    let counter = 2;
    while (existingSlugs.includes(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  async createRepository(sourcePath: string): Promise<Repository> {
    // Validate it's a Git repository
    const isGit = await this.git.isGitRepository(sourcePath);
    if (!isGit) {
      throw new Error('Selected folder is not a Git repository');
    }

    // Get repository info
    const info = await this.git.getRepositoryInfo(sourcePath);

    // Get existing projects to check for duplicates and collisions
    const existingProjects = await this.storage.getAllProjects();

    // Check if repository already exists
    for (const projectSlug of existingProjects) {
      const configPath = this.storage.getProjectConfigPath(projectSlug);
      const config = await this.storage.readJSON<ProjectConfig>(configPath);
      if (config && config.sourcePath === sourcePath) {
        // Update last accessed and return existing repo
        config.lastAccessedAt = new Date().toISOString();
        await this.storage.writeJSON(configPath, config);

        return {
          id: config.id,
          name: config.name,
          slug: config.slug,
          sourcePath: config.sourcePath,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
          lastAccessedAt: config.lastAccessedAt,
          sessionIds: config.sessions.map(s => s.id),
          defaultBranch: config.defaultBranch,
          gitRemote: config.gitRemote,
        };
      }
    }

    // Create slug
    const slug = this.createSlug(info.name, existingProjects);

    const now = new Date().toISOString();

    // Create project config
    const config: ProjectConfig = {
      id: uuidv4(),
      name: info.name,
      slug,
      sourcePath,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      defaultBranch: info.currentBranch,
      gitRemote: info.remoteUrl || undefined,
      sessions: [],
      settings: {
        autoRunCommand: 'claude',
      },
    };

    // Create project folder structure:
    // ~/ParallelClaude/project-name/
    // ~/ParallelClaude/project-name/main/
    // ~/ParallelClaude/project-name/branches/
    const projectPath = this.storage.getProjectPath(slug);
    const mainPath = this.storage.getMainPath(slug);
    const branchesPath = this.storage.getBranchesPath(slug);

    await this.storage.ensureDirectory(projectPath);
    await this.storage.ensureDirectory(branchesPath);

    // Clone the repository to main/
    console.log(`Cloning ${sourcePath} to ${mainPath}...`);
    await this.git.cloneRepository(sourcePath, mainPath, info.currentBranch);

    // Save config.json
    const configPath = this.storage.getProjectConfigPath(slug);
    await this.storage.writeJSON(configPath, config);

    console.log('Created project:', config.name, config.id);

    return {
      id: config.id,
      name: config.name,
      slug: config.slug,
      sourcePath: config.sourcePath,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      lastAccessedAt: config.lastAccessedAt,
      sessionIds: [],
      defaultBranch: config.defaultBranch,
      gitRemote: config.gitRemote,
    };
  }

  async getRepository(id: string): Promise<Repository | null> {
    const projects = await this.storage.getAllProjects();

    for (const projectSlug of projects) {
      const configPath = this.storage.getProjectConfigPath(projectSlug);
      const config = await this.storage.readJSON<ProjectConfig>(configPath);

      if (config && config.id === id) {
        return {
          id: config.id,
          name: config.name,
          slug: config.slug,
          sourcePath: config.sourcePath,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
          lastAccessedAt: config.lastAccessedAt,
          sessionIds: config.sessions.map(s => s.id),
          defaultBranch: config.defaultBranch,
          gitRemote: config.gitRemote,
        };
      }
    }

    return null;
  }

  async getAllRepositories(): Promise<Repository[]> {
    const projects = await this.storage.getAllProjects();
    const repositories: Repository[] = [];

    for (const projectSlug of projects) {
      const configPath = this.storage.getProjectConfigPath(projectSlug);
      const config = await this.storage.readJSON<ProjectConfig>(configPath);

      if (config) {
        repositories.push({
          id: config.id,
          name: config.name,
          slug: config.slug,
          sourcePath: config.sourcePath,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
          lastAccessedAt: config.lastAccessedAt,
          sessionIds: config.sessions.map(s => s.id),
          defaultBranch: config.defaultBranch,
          gitRemote: config.gitRemote,
        });
      }
    }

    return repositories;
  }

  async getRecentRepositories(): Promise<Repository[]> {
    const all = await this.getAllRepositories();
    return all.sort((a, b) =>
      new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
    ).slice(0, 10);
  }

  async updateRepository(
    id: string,
    updates: Partial<Repository>
  ): Promise<Repository> {
    const projects = await this.storage.getAllProjects();

    for (const projectSlug of projects) {
      const configPath = this.storage.getProjectConfigPath(projectSlug);
      const config = await this.storage.readJSON<ProjectConfig>(configPath);

      if (config && config.id === id) {
        const updated: ProjectConfig = {
          ...config,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        await this.storage.writeJSON(configPath, updated);

        return {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          sourcePath: updated.sourcePath,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          lastAccessedAt: updated.lastAccessedAt,
          sessionIds: updated.sessions.map(s => s.id),
          defaultBranch: updated.defaultBranch,
          gitRemote: updated.gitRemote,
        };
      }
    }

    throw new Error(`Repository not found: ${id}`);
  }

  async deleteRepository(id: string): Promise<void> {
    const projects = await this.storage.getAllProjects();

    for (const projectSlug of projects) {
      const configPath = this.storage.getProjectConfigPath(projectSlug);
      const config = await this.storage.readJSON<ProjectConfig>(configPath);

      if (config && config.id === id) {
        // Delete entire project directory
        const projectPath = this.storage.getProjectPath(projectSlug);
        await this.storage.deleteDirectory(projectPath);
        console.log('Deleted project:', config.name, id);
        return;
      }
    }

    throw new Error(`Repository not found: ${id}`);
  }

  async updateLastAccessed(id: string): Promise<void> {
    const projects = await this.storage.getAllProjects();

    for (const projectSlug of projects) {
      const configPath = this.storage.getProjectConfigPath(projectSlug);
      const config = await this.storage.readJSON<ProjectConfig>(configPath);

      if (config && config.id === id) {
        config.lastAccessedAt = new Date().toISOString();
        await this.storage.writeJSON(configPath, config);
        return;
      }
    }
  }

  async getProjectConfig(repositoryId: string): Promise<ProjectConfig | null> {
    const projects = await this.storage.getAllProjects();

    for (const projectSlug of projects) {
      const configPath = this.storage.getProjectConfigPath(projectSlug);
      const config = await this.storage.readJSON<ProjectConfig>(configPath);

      if (config && config.id === repositoryId) {
        return config;
      }
    }

    return null;
  }

  async updateProjectConfig(repositoryId: string, config: ProjectConfig): Promise<void> {
    const projects = await this.storage.getAllProjects();

    for (const projectSlug of projects) {
      const configPath = this.storage.getProjectConfigPath(projectSlug);
      const existingConfig = await this.storage.readJSON<ProjectConfig>(configPath);

      if (existingConfig && existingConfig.id === repositoryId) {
        await this.storage.writeJSON(configPath, config);
        return;
      }
    }

    throw new Error(`Project not found: ${repositoryId}`);
  }
}
