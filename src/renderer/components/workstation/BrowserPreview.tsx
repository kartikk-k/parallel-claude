import { useState, useEffect, useRef } from 'react';

interface BrowserPreviewProps {
  sessionId: string;
  repositoryId: string;
  isActive: boolean;
  className?: string;
}

export default function BrowserPreview({
  sessionId,
  repositoryId,
  isActive,
  className = ''
}: BrowserPreviewProps) {
  const [url, setUrl] = useState('http://localhost:3000');
  const [inputUrl, setInputUrl] = useState('http://localhost:3000');
  const [isLoading, setIsLoading] = useState(false);
  const webviewRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Load saved URL for this session
  useEffect(() => {
    const loadSavedUrl = async () => {
      try {
        const sessions = await window.electron.ipcRenderer.invoke(
          'session:getByRepository',
          repositoryId
        );
        const session = sessions.find((s: any) => s.id === sessionId);

        if (session?.previewUrl) {
          setUrl(session.previewUrl);
          setInputUrl(session.previewUrl);
        }
      } catch (err) {
        console.error('Failed to load preview URL:', err);
      }
    };

    loadSavedUrl();
  }, [sessionId, repositoryId]);

  // Setup webview event listeners (only once per session)
  useEffect(() => {
    if (isInitializedRef.current) return;

    const webview = webviewRef.current;
    if (!webview) return;

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleLoadStop = () => {
      setIsLoading(false);
    };

    const handleLoadFail = (event: any) => {
      console.error('Webview failed to load:', event);
      setIsLoading(false);
    };

    const handleDomReady = () => {
      console.log(`[Preview ${sessionId}] Webview DOM ready`);
    };

    const setupListeners = () => {
      webview.addEventListener('did-start-loading', handleLoadStart);
      webview.addEventListener('did-stop-loading', handleLoadStop);
      webview.addEventListener('did-fail-load', handleLoadFail);
      isInitializedRef.current = true;
    };

    // Check if webview is already ready
    if (webview.getWebContentsId) {
      try {
        webview.getWebContentsId();
        setupListeners();
      } catch (e) {
        webview.addEventListener('dom-ready', () => {
          handleDomReady();
          setupListeners();
        });
      }
    } else {
      webview.addEventListener('dom-ready', () => {
        handleDomReady();
        setupListeners();
      });
    }

    return () => {
      webview.removeEventListener('did-start-loading', handleLoadStart);
      webview.removeEventListener('did-stop-loading', handleLoadStop);
      webview.removeEventListener('did-fail-load', handleLoadFail);
      webview.removeEventListener('dom-ready', handleDomReady);
    };
  }, [sessionId]);

  // Update webview URL when url changes
  useEffect(() => {
    if (webviewRef.current && url) {
      webviewRef.current.src = url;
    }
  }, [url]);

  // Save URL to session when it changes
  const saveUrlToSession = async (newUrl: string) => {
    try {
      await window.electron.ipcRenderer.invoke(
        'session:update',
        repositoryId,
        sessionId,
        { previewUrl: newUrl }
      );
    } catch (err) {
      console.error('Failed to save preview URL:', err);
    }
  };

  // Smart URL parser to handle various input formats
  const parseUrl = (input: string): string => {
    const trimmed = input.trim();

    // If empty, return default
    if (!trimmed) {
      return 'http://localhost:3000';
    }

    // If already has protocol, return as-is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Check if input starts with a number (port number or port with path)
    const portMatch = trimmed.match(/^(\d+)(\/.*)?$/);
    if (portMatch) {
      const port = portMatch[1];
      const path = portMatch[2] || '';
      return `http://localhost:${port}${path}`;
    }

    // If starts with localhost, add http://
    if (trimmed.startsWith('localhost')) {
      return `http://${trimmed}`;
    }

    // For other URLs (like example.com), add https://
    return `https://${trimmed}`;
  };

  const handleRefresh = () => {
    if (webviewRef.current) {
      setIsLoading(true);
      webviewRef.current.reload();
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedUrl = parseUrl(inputUrl);

    // If URL is the same, just reload instead of changing src
    if (parsedUrl === url) {
      handleRefresh();
    } else {
      setIsLoading(true);
      setUrl(parsedUrl);
      setInputUrl(parsedUrl);
      await saveUrlToSession(parsedUrl);
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col ${className}`}
      style={{ display: isActive ? 'flex' : 'none' }}
    >
      {/* URL Bar */}
      <div className="flex items-center gap-2 p-3 bg-black/20 border-b border-white/10">
        <button
          onClick={handleRefresh}
          className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Refresh"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>

        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="flex-1 px-3 py-1.5 bg-black/30 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
            placeholder="3000, 3000/org, or localhost:3000"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white text-sm rounded-md transition-colors"
          >
            Go
          </button>
        </form>
      </div>

      {/* Browser Preview */}
      <div className="flex-1 relative bg-black/10">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-white/70 text-sm">Loading preview...</span>
            </div>
          </div>
        )}
        <webview
          ref={webviewRef}
          src={url}
          className="w-full h-full"
          allowpopups="true"
        />
      </div>
    </div>
  );
}
