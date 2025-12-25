import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import type { GitChanges, RepositoryInfo } from '../types';

const execAsync = promisify(exec);

export class GitService {
  async isGitRepository(repoPath: string): Promise<boolean> {
    const gitPath = path.join(repoPath, '.git');
    return fs.existsSync(gitPath);
  }

  async getRepositoryInfo(repoPath: string): Promise<RepositoryInfo> {
    try {
      // Get repository name from path
      const name = path.basename(repoPath);

      // Get current branch
      const { stdout: branchOutput } = await execAsync(
        'git branch --show-current',
        { cwd: repoPath }
      );
      const currentBranch = branchOutput.trim() || 'main';

      // Get remote URL
      let remoteUrl: string | null = null;
      try {
        const { stdout: remoteOutput } = await execAsync(
          'git remote get-url origin',
          { cwd: repoPath }
        );
        remoteUrl = remoteOutput.trim();
      } catch (error) {
        // No remote configured
        console.log('No git remote configured for', repoPath);
      }

      return {
        name,
        currentBranch,
        remoteUrl,
      };
    } catch (error) {
      throw new Error(`Failed to get repository info: ${error}`);
    }
  }

  async cloneRepository(
    sourcePath: string,
    targetPath: string,
    baseBranch: string
  ): Promise<void> {
    try {
      // Ensure target directory doesn't exist
      if (fs.existsSync(targetPath)) {
        throw new Error(`Target path already exists: ${targetPath}`);
      }

      // Create parent directory
      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      // Use cp -r to copy entire directory (faster than git clone for local repos)
      await execAsync(`cp -r "${sourcePath}" "${targetPath}"`);

      // Checkout the base branch in the cloned repo
      await execAsync(`git checkout ${baseBranch}`, { cwd: targetPath });

      // Pull latest changes if remote exists
      try {
        await execAsync('git pull', { cwd: targetPath });
      } catch (error) {
        // Ignore pull errors (might not have remote)
        console.log('Could not pull latest changes:', error);
      }

      console.log(`Cloned repository from ${sourcePath} to ${targetPath}`);
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error}`);
    }
  }

  async createBranch(
    repoPath: string,
    branchName: string,
    baseBranch: string
  ): Promise<void> {
    try {
      // Create and checkout new branch from base branch
      await execAsync(`git checkout -b ${branchName} ${baseBranch}`, {
        cwd: repoPath,
      });

      console.log(`Created branch ${branchName} from ${baseBranch}`);
    } catch (error) {
      throw new Error(`Failed to create branch: ${error}`);
    }
  }

  async getChangedFiles(repoPath: string): Promise<GitChanges> {
    try {
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: repoPath,
      });

      const modified: string[] = [];
      const added: string[] = [];
      const deleted: string[] = [];

      const lines = stdout.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        const status = line.substring(0, 2);
        const file = line.substring(3);

        if (status.includes('M')) {
          modified.push(file);
        } else if (status.includes('A') || status.includes('?')) {
          added.push(file);
        } else if (status.includes('D')) {
          deleted.push(file);
        }
      }

      return { modified, added, deleted };
    } catch (error) {
      console.error('Failed to get changed files:', error);
      return { modified: [], added: [], deleted: [] };
    }
  }

  async getDiff(repoPath: string, filePath?: string): Promise<string> {
    try {
      const command = filePath
        ? `git diff HEAD "${filePath}"`
        : 'git diff HEAD';

      const { stdout } = await execAsync(command, { cwd: repoPath });
      return stdout;
    } catch (error) {
      console.error('Failed to get diff:', error);
      return '';
    }
  }

  async commit(
    repoPath: string,
    message: string,
    files?: string[]
  ): Promise<void> {
    try {
      // Add files
      if (files && files.length > 0) {
        const filesStr = files.map(f => `"${f}"`).join(' ');
        await execAsync(`git add ${filesStr}`, { cwd: repoPath });
      } else {
        await execAsync('git add .', { cwd: repoPath });
      }

      // Commit
      await execAsync(`git commit -m "${message}"`, { cwd: repoPath });

      console.log(`Committed changes: ${message}`);
    } catch (error) {
      throw new Error(`Failed to commit: ${error}`);
    }
  }

  async push(repoPath: string, branchName: string): Promise<void> {
    try {
      // Push to origin
      await execAsync(`git push -u origin ${branchName}`, { cwd: repoPath });

      console.log(`Pushed branch ${branchName} to origin`);
    } catch (error) {
      throw new Error(`Failed to push: ${error}`);
    }
  }

  async getCurrentBranch(repoPath: string): Promise<string> {
    try {
      const { stdout } = await execAsync('git branch --show-current', {
        cwd: repoPath,
      });
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error}`);
    }
  }

  async getAllBranches(repoPath: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync('git branch', { cwd: repoPath });
      return stdout
        .split('\n')
        .map(b => b.trim().replace('* ', ''))
        .filter(Boolean);
    } catch (error) {
      throw new Error(`Failed to get branches: ${error}`);
    }
  }
}
