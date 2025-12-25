import { ipcMain } from 'electron';
import type { SessionService } from '../services/session';
import type { GitService } from '../services/git';

export function registerSessionHandlers(
  sessionService: SessionService,
  gitService: GitService
) {
  // Create session
  ipcMain.handle(
    'session:create',
    async (event, repositoryId: string, options: any) => {
      try {
        return await sessionService.createSession(repositoryId, options);
      } catch (error) {
        console.error('Error creating session:', error);
        throw error;
      }
    }
  );

  // Get sessions by repository
  ipcMain.handle('session:getByRepository', async (event, repositoryId: string) => {
    try {
      return await sessionService.getRepositorySessions(repositoryId);
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw error;
    }
  });

  // Get single session
  ipcMain.handle(
    'session:get',
    async (event, repositoryId: string, sessionId: string) => {
      try {
        return await sessionService.getSession(repositoryId, sessionId);
      } catch (error) {
        console.error('Error getting session:', error);
        throw error;
      }
    }
  );

  // Update session
  ipcMain.handle(
    'session:update',
    async (event, repositoryId: string, sessionId: string, updates: any) => {
      try {
        return await sessionService.updateSession(repositoryId, sessionId, updates);
      } catch (error) {
        console.error('Error updating session:', error);
        throw error;
      }
    }
  );

  // Delete session
  ipcMain.handle(
    'session:delete',
    async (event, repositoryId: string, sessionId: string) => {
      try {
        await sessionService.deleteSession(repositoryId, sessionId);
        return { success: true };
      } catch (error) {
        console.error('Error deleting session:', error);
        throw error;
      }
    }
  );

  // Get session changes (Git status)
  ipcMain.handle(
    'session:getChanges',
    async (event, repositoryId: string, sessionId: string) => {
      try {
        return await sessionService.getSessionChanges(repositoryId, sessionId);
      } catch (error) {
        console.error('Error getting session changes:', error);
        throw error;
      }
    }
  );

  // Get diff for a file or all files
  ipcMain.handle(
    'session:getDiff',
    async (event, repositoryId: string, sessionId: string, filePath?: string) => {
      try {
        const session = await sessionService.getSession(repositoryId, sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
        return await gitService.getDiff(session.workingDirectory, filePath);
      } catch (error) {
        console.error('Error getting diff:', error);
        throw error;
      }
    }
  );

  // Commit changes
  ipcMain.handle(
    'session:commit',
    async (
      event,
      repositoryId: string,
      sessionId: string,
      message: string,
      files?: string[]
    ) => {
      try {
        const session = await sessionService.getSession(repositoryId, sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
        await gitService.commit(session.workingDirectory, message, files);
        return { success: true };
      } catch (error) {
        console.error('Error committing changes:', error);
        throw error;
      }
    }
  );

  // Push to remote
  ipcMain.handle(
    'session:push',
    async (event, repositoryId: string, sessionId: string) => {
      try {
        const session = await sessionService.getSession(repositoryId, sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
        await gitService.push(session.workingDirectory, session.branchName);
        return { success: true };
      } catch (error) {
        console.error('Error pushing changes:', error);
        throw error;
      }
    }
  );

  // Update last accessed
  ipcMain.handle(
    'session:updateLastAccessed',
    async (event, repositoryId: string, sessionId: string) => {
      try {
        await sessionService.updateLastAccessed(repositoryId, sessionId);
        return { success: true };
      } catch (error) {
        console.error('Error updating last accessed:', error);
        throw error;
      }
    }
  );
}
