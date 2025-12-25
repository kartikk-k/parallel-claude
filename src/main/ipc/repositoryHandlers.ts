import { ipcMain, dialog } from 'electron';
import type { RepositoryService } from '../services/repository';
import type { GitService } from '../services/git';

export function registerRepositoryHandlers(
  repositoryService: RepositoryService,
  gitService: GitService
) {
  // Select folder and create repository
  ipcMain.handle('repository:select', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Git Repository',
        message: 'Choose a folder containing a Git repository',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const path = result.filePaths[0];

      // Validate it's a Git repository
      const isGit = await gitService.isGitRepository(path);
      if (!isGit) {
        throw new Error('Selected folder is not a Git repository');
      }

      // Create repository
      const repository = await repositoryService.createRepository(path);
      return repository;
    } catch (error) {
      console.error('Error selecting repository:', error);
      throw error;
    }
  });

  // Get all repositories
  ipcMain.handle('repository:getAll', async () => {
    try {
      return await repositoryService.getAllRepositories();
    } catch (error) {
      console.error('Error getting repositories:', error);
      throw error;
    }
  });

  // Get recent repositories
  ipcMain.handle('repository:getRecent', async () => {
    try {
      return await repositoryService.getRecentRepositories();
    } catch (error) {
      console.error('Error getting recent repositories:', error);
      throw error;
    }
  });

  // Get single repository
  ipcMain.handle('repository:get', async (event, id: string) => {
    try {
      return await repositoryService.getRepository(id);
    } catch (error) {
      console.error('Error getting repository:', error);
      throw error;
    }
  });

  // Update repository
  ipcMain.handle('repository:update', async (event, id: string, updates: any) => {
    try {
      return await repositoryService.updateRepository(id, updates);
    } catch (error) {
      console.error('Error updating repository:', error);
      throw error;
    }
  });

  // Delete repository
  ipcMain.handle('repository:delete', async (event, id: string) => {
    try {
      await repositoryService.deleteRepository(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting repository:', error);
      throw error;
    }
  });

  // Update last accessed
  ipcMain.handle('repository:updateLastAccessed', async (event, id: string) => {
    try {
      await repositoryService.updateLastAccessed(id);
      return { success: true };
    } catch (error) {
      console.error('Error updating last accessed:', error);
      throw error;
    }
  });
}
