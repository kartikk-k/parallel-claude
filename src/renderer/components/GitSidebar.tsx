import { useState, useEffect } from 'react';

interface GitChanges {
  modified: string[];
  added: string[];
  deleted: string[];
}

interface GitSidebarProps {
  repositoryId: string;
  sessionId: string;
}

export default function GitSidebar({ repositoryId, sessionId }: GitSidebarProps) {
  const [changes, setChanges] = useState<GitChanges>({ modified: [], added: [], deleted: [] });
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diff, setDiff] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    // Load changes immediately
    loadChanges();

    // Poll for changes every 3 seconds
    const interval = setInterval(() => {
      loadChanges();
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, repositoryId]);

  const loadChanges = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke(
        'session:getChanges',
        repositoryId,
        sessionId
      );
      setChanges(result);
    } catch (error) {
      console.error('Failed to load changes:', error);
    }
  };

  const handleFileClick = async (file: string) => {
    try {
      const diffResult = await window.electron.ipcRenderer.invoke(
        'session:getDiff',
        repositoryId,
        sessionId,
        file
      );
      setDiff(diffResult);
      setSelectedFile(file);
    } catch (error) {
      console.error('Failed to load diff:', error);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      alert('Please enter a commit message');
      return;
    }

    try {
      setIsCommitting(true);
      await window.electron.ipcRenderer.invoke(
        'session:commit',
        repositoryId,
        sessionId,
        commitMessage
      );
      setCommitMessage('');
      setSelectedFile(null);
      setDiff('');
      await loadChanges();
    } catch (error: any) {
      console.error('Failed to commit:', error);
      alert(`Failed to commit: ${error.message}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const handlePush = async () => {
    try {
      setIsPushing(true);
      await window.electron.ipcRenderer.invoke(
        'session:push',
        repositoryId,
        sessionId
      );
      alert('Successfully pushed to remote');
    } catch (error: any) {
      console.error('Failed to push:', error);
      alert(`Failed to push: ${error.message}`);
    } finally {
      setIsPushing(false);
    }
  };

  const totalChanges = changes.modified.length + changes.added.length + changes.deleted.length;

  return (
    <div className="w-80 flex flex-col bg-surface-sunken backdrop-blur-xl border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">
          Changes ({totalChanges})
        </h3>
      </div>

      {/* Changed Files List */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {changes.modified.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-text-tertiary px-2 mb-2">
              MODIFIED ({changes.modified.length})
            </div>
            {changes.modified.map((file) => (
              <button
                key={file}
                onClick={() => handleFileClick(file)}
                className={`w-full px-2 py-1.5 text-left text-sm rounded hover:bg-surface-raised transition-colors ${
                  selectedFile === file ? 'bg-surface-overlay' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-status-modified">M</span>
                  <span className="text-text-secondary truncate">{file}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {changes.added.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-text-tertiary px-2 mb-2">
              ADDED ({changes.added.length})
            </div>
            {changes.added.map((file) => (
              <button
                key={file}
                onClick={() => handleFileClick(file)}
                className={`w-full px-2 py-1.5 text-left text-sm rounded hover:bg-surface-raised transition-colors ${
                  selectedFile === file ? 'bg-surface-overlay' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-status-added">A</span>
                  <span className="text-text-secondary truncate">{file}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {changes.deleted.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-text-tertiary px-2 mb-2">
              DELETED ({changes.deleted.length})
            </div>
            {changes.deleted.map((file) => (
              <button
                key={file}
                onClick={() => handleFileClick(file)}
                className={`w-full px-2 py-1.5 text-left text-sm rounded hover:bg-surface-raised transition-colors ${
                  selectedFile === file ? 'bg-surface-overlay' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-status-deleted">D</span>
                  <span className="text-text-secondary truncate">{file}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {totalChanges === 0 && (
          <div className="text-center py-8 text-text-tertiary text-sm">
            No changes
          </div>
        )}

        {/* Diff View */}
        {selectedFile && diff && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="text-xs font-semibold text-text-tertiary px-2 mb-2">
              DIFF: {selectedFile}
            </div>
            <div className="bg-surface-sunken-deep rounded p-2 max-h-64 overflow-auto">
              <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">
                {diff}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Commit Section */}
      {totalChanges > 0 && (
        <div className="border-t border-border p-4">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            className="w-full px-3 py-2 bg-surface-raised text-text-primary text-sm rounded border border-border-strong focus:border-border-focus outline-none resize-none"
            rows={3}
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCommit}
              disabled={isCommitting || !commitMessage.trim()}
              className="flex-1 px-4 py-2 bg-btn-primary hover:bg-btn-primary-hover disabled:bg-btn-disabled disabled:text-btn-disabled-text text-white text-sm font-medium rounded transition-colors"
            >
              {isCommitting ? 'Committing...' : 'Commit'}
            </button>

            <button
              onClick={handlePush}
              disabled={isPushing}
              className="px-4 py-2 bg-btn-success hover:bg-btn-success-hover disabled:bg-btn-disabled disabled:text-btn-disabled-text text-white text-sm font-medium rounded transition-colors"
              title="Push to remote"
            >
              {isPushing ? 'Pushing...' : 'Push'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
