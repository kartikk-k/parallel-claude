import * as fs from 'fs';
import * as path from 'path';
import type { SessionMetadata, GitChanges, ProjectConfig } from '../types';
import { StorageService } from './storage';
import { GitService } from './git';
import { RepositoryService } from './repository';

export class SessionService {
  private storage: StorageService;
  private git: GitService;
  private repositoryService: RepositoryService;

  constructor(
    storage: StorageService,
    git: GitService,
    repositoryService: RepositoryService
  ) {
    this.storage = storage;
    this.git = git;
    this.repositoryService = repositoryService;
  }

  private generateSessionId(): string {
    // Generate 6 random alphanumeric characters
    return Math.random().toString(36).substring(2, 8);
  }

  private generateBranchName(sessionId: string, title?: string): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0]
      .replace('T', '-');

    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 30);
      return `session/${sessionId}/${slug}`;
    }

    return `session/${sessionId}/${timestamp}`;
  }

  async createSession(
    repositoryId: string,
    options: {
      title?: string;
      baseBranch?: string;
      autoRunCommand?: string;
    } = {}
  ): Promise<SessionMetadata> {
    // Get project config
    const config = await this.repositoryService.getProjectConfig(repositoryId);
    if (!config) {
      throw new Error(`Project not found: ${repositoryId}`);
    }

    // Generate session ID
    let sessionId = this.generateSessionId();

    // Ensure session ID is unique
    const existingIds = config.sessions.map(s => s.id);
    while (existingIds.includes(sessionId)) {
      sessionId = this.generateSessionId();
    }

    // Get base branch
    const baseBranch = options.baseBranch || config.defaultBranch;

    // Generate branch name
    const branchName = this.generateBranchName(sessionId, options.title);

    // Get paths
    const mainPath = this.storage.getMainPath(config.slug);
    const sessionPath = this.storage.getSessionPath(config.slug, sessionId);

    // Clone from main to session folder
    console.log(`Copying ${mainPath} to ${sessionPath}...`);
    await this.git.cloneRepository(mainPath, sessionPath, baseBranch);

    // Create and checkout new branch
    await this.git.createBranch(sessionPath, branchName, baseBranch);

    // Create session metadata
    const session: SessionMetadata = {
      id: sessionId,
      repositoryId,
      title: options.title || `Session ${sessionId}`,
      branchName,
      baseBranch,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      workingDirectory: sessionPath,
      autoRunCommand: options.autoRunCommand || config.settings?.autoRunCommand,
      isRunning: false,
      filesChanged: 0,
      status: 'active',
    };

    // Add session to project config
    config.sessions.push(session);
    config.updatedAt = new Date().toISOString();
    await this.repositoryService.updateProjectConfig(repositoryId, config);

    console.log('Created session:', sessionId, branchName);
    return session;
  }

  async getSession(
    repositoryId: string,
    sessionId: string
  ): Promise<SessionMetadata | null> {
    const config = await this.repositoryService.getProjectConfig(repositoryId);
    if (!config) {
      return null;
    }

    return config.sessions.find(s => s.id === sessionId) || null;
  }

  async getRepositorySessions(repositoryId: string): Promise<SessionMetadata[]> {
    const config = await this.repositoryService.getProjectConfig(repositoryId);
    if (!config) {
      return [];
    }

    // Sort by last accessed (most recent first)
    return config.sessions.sort(
      (a, b) =>
        new Date(b.lastAccessedAt).getTime() -
        new Date(a.lastAccessedAt).getTime()
    );
  }

  async updateSession(
    repositoryId: string,
    sessionId: string,
    updates: Partial<SessionMetadata>
  ): Promise<SessionMetadata> {
    const config = await this.repositoryService.getProjectConfig(repositoryId);
    if (!config) {
      throw new Error(`Project not found: ${repositoryId}`);
    }

    const sessionIndex = config.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const updated = {
      ...config.sessions[sessionIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    config.sessions[sessionIndex] = updated;
    config.updatedAt = new Date().toISOString();
    await this.repositoryService.updateProjectConfig(repositoryId, config);

    return updated;
  }

  async deleteSession(repositoryId: string, sessionId: string): Promise<void> {
    const config = await this.repositoryService.getProjectConfig(repositoryId);
    if (!config) {
      throw new Error(`Project not found: ${repositoryId}`);
    }

    const session = config.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Delete session folder
    await this.storage.deleteDirectory(session.workingDirectory);

    // Remove session from config
    config.sessions = config.sessions.filter(s => s.id !== sessionId);
    config.updatedAt = new Date().toISOString();
    await this.repositoryService.updateProjectConfig(repositoryId, config);

    console.log('Deleted session:', sessionId);
  }

  async getSessionChanges(
    repositoryId: string,
    sessionId: string
  ): Promise<GitChanges> {
    const session = await this.getSession(repositoryId, sessionId);
    if (!session) {
      return { modified: [], added: [], deleted: [] };
    }

    return this.git.getChangedFiles(session.workingDirectory);
  }

  async updateLastAccessed(
    repositoryId: string,
    sessionId: string
  ): Promise<void> {
    await this.updateSession(repositoryId, sessionId, {
      lastAccessedAt: new Date().toISOString(),
    });
  }
}
