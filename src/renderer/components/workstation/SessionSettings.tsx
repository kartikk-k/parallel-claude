import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface SessionSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  repositoryId: string;
  currentTitle: string;
  currentPreviewUrl?: string;
  currentWorkingDirectory?: string;
  onSave?: () => void;
}

export default function SessionSettings({
  open,
  onOpenChange,
  sessionId,
  repositoryId,
  currentTitle,
  currentPreviewUrl,
  currentWorkingDirectory,
  onSave,
}: SessionSettingsProps) {
  const [title, setTitle] = useState(currentTitle);
  const [previewUrl, setPreviewUrl] = useState(currentPreviewUrl || 'http://localhost:3000');
  const [isSaving, setIsSaving] = useState(false);

  // Update form when props change
  useEffect(() => {
    setTitle(currentTitle);
    setPreviewUrl(currentPreviewUrl || 'http://localhost:3000');
  }, [currentTitle, currentPreviewUrl, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.electron.ipcRenderer.invoke(
        'session:update',
        repositoryId,
        sessionId,
        {
          title,
          previewUrl,
        }
      );
      onOpenChange(false);
      // Trigger parent component to refresh
      onSave?.();
    } catch (err) {
      console.error('Failed to save session settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const parseDefaultPort = () => {
    try {
      const url = new URL(previewUrl);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return url.port || '3000';
      }
    } catch (e) {
      // Invalid URL
    }
    return '';
  };

  const handlePortChange = (port: string) => {
    if (port) {
      setPreviewUrl(`http://localhost:${port}`);
    } else {
      setPreviewUrl('http://localhost:3000');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Session Settings</DialogTitle>
          <DialogDescription>
            Configure settings for this session
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 space-y-5">
          {/* Session Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">
              Session Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
              placeholder="Enter session name"
            />
          </div>

          {/* Default Port */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">
              Default Preview Port
            </label>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">localhost:</span>
              <input
                type="text"
                value={parseDefaultPort()}
                onChange={(e) => handlePortChange(e.target.value)}
                className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/30"
                placeholder="3000"
              />
            </div>
            <p className="text-xs text-white/40">
              Default port for browser preview
            </p>
          </div>

          {/* Preview URL (readonly, informational) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">
              Preview URL
            </label>
            <input
              type="text"
              value={previewUrl}
              readOnly
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white/60 text-sm cursor-not-allowed"
            />
          </div>

          {/* Working Directory (readonly) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">
              Working Directory
            </label>
            <div className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white/60 text-sm break-all">
              {currentWorkingDirectory || 'Not available'}
            </div>
            <p className="text-xs text-white/40">
              Location of session files on disk
            </p>
          </div>

          {/* Session ID (readonly) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">
              Session ID
            </label>
            <div className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white/40 text-xs font-mono break-all">
              {sessionId}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-transparent hover:border-white/20 text-white text-sm rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
