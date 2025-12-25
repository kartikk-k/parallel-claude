import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const readdir = promisify(fs.readdir);

export class StorageService {
  private basePath: string;

  constructor() {
    // ~/ParallelClaude
    this.basePath = path.join(os.homedir(), 'ParallelClaude');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    // Create base directory
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      console.log('Created ParallelClaude directory:', this.basePath);
    }
  }

  getBasePath(): string {
    return this.basePath;
  }

  // Get project folder path: ~/ParallelClaude/project-name/
  getProjectPath(projectSlug: string): string {
    return path.join(this.basePath, projectSlug);
  }

  // Get main repository path: ~/ParallelClaude/project-name/main/
  getMainPath(projectSlug: string): string {
    return path.join(this.basePath, projectSlug, 'main');
  }

  // Get branches folder: ~/ParallelClaude/project-name/branches/
  getBranchesPath(projectSlug: string): string {
    return path.join(this.basePath, projectSlug, 'branches');
  }

  // Get session path: ~/ParallelClaude/project-name/branches/session-abc123/
  getSessionPath(projectSlug: string, sessionId: string): string {
    return path.join(this.basePath, projectSlug, 'branches', `session-${sessionId}`);
  }

  // Get config.json path: ~/ParallelClaude/project-name/config.json
  getProjectConfigPath(projectSlug: string): string {
    return path.join(this.basePath, projectSlug, 'config.json');
  }

  // Get all project folders
  async getAllProjects(): Promise<string[]> {
    try {
      const entries = await readdir(this.basePath, { withFileTypes: true });
      return entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    } catch (error) {
      return [];
    }
  }

  async readJSON<T>(filePath: string): Promise<T | null> {
    try {
      const data = await readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async writeJSON<T>(filePath: string, data: T): Promise<void> {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  async deleteDirectory(dirPath: string): Promise<void> {
    if (fs.existsSync(dirPath)) {
      await rm(dirPath, { recursive: true, force: true });
    }
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}
