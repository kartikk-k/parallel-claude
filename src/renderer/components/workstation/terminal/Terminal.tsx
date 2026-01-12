import { useEffect, useRef } from 'react';
import { terminalManager } from '../../../services/TerminalManager';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';
import { useSessionManagerStore } from '../../../stores';
import { parseTerminalStatusDebounced } from '../../../utils';

interface TerminalProps {
  className?: string;
  sessionId: string;
  repositoryId: string;
  isActive: boolean;
}

function Terminal({ className = '', sessionId, repositoryId, isActive }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { updateSessionStatus } = useSessionManagerStore();
  const isInitializedRef = useRef(false);
  const terminalContentRef = useRef<string>('');

  // Create terminal once when component mounts
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    console.log(`[Terminal ${sessionId}] Component mounted, creating terminal`);

    // Create terminal through manager
    terminalManager.createTerminal(
      sessionId,
      repositoryId,
      containerRef.current,
      (status) => updateSessionStatus(sessionId, status)
    );

    isInitializedRef.current = true;

    // Setup data listener for status parsing
    const unsubscribeData = window.electron?.ipcRenderer.on(
      'terminal-data',
      (...args: unknown[]) => {
        const receivedSessionId = args[0] as string;
        const data = args[1] as string;

        if (receivedSessionId === sessionId) {
          // Accumulate terminal content for status parsing
          terminalContentRef.current += data;
          if (terminalContentRef.current.length > 10000) {
            terminalContentRef.current = terminalContentRef.current.slice(-10000);
          }

          // Parse terminal content and update session status
          parseTerminalStatusDebounced(terminalContentRef.current, (status) => {
            updateSessionStatus(sessionId, status);
          }, 800);
        }
      }
    );

    // Cleanup only when component truly unmounts (session deleted)
    return () => {
      console.log(`[Terminal ${sessionId}] Component unmounting, destroying terminal`);
      if (unsubscribeData) unsubscribeData();
      terminalManager.destroyTerminal(sessionId);
    };
  }, [sessionId, repositoryId]); // Only run when session/repo changes

  // Handle visibility changes
  useEffect(() => {
    if (!isInitializedRef.current) return;

    if (isActive) {
      console.log(`[Terminal ${sessionId}] Showing terminal`);
      terminalManager.showTerminal(sessionId);
    } else {
      console.log(`[Terminal ${sessionId}] Hiding terminal`);
      terminalManager.hideTerminal(sessionId);
    }
  }, [isActive, sessionId]);

  // Handle resize when active
  useEffect(() => {
    if (!isActive || !isInitializedRef.current) return;

    const handleResize = () => {
      terminalManager.fitTerminal(sessionId);
    };

    // Debounced resize
    let resizeTimeout: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(handleResize, 50);
    };

    window.addEventListener('resize', debouncedResize);

    const resizeObserver = new ResizeObserver(debouncedResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial fit when becoming active
    handleResize();

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', debouncedResize);
      resizeObserver.disconnect();
    };
  }, [isActive, sessionId]);

  return (
    <div
      ref={containerRef}
      className={`terminal-wrapper ${isActive ? 'active' : 'hidden'} ${className}`}
    />
  );
}

export default Terminal;
