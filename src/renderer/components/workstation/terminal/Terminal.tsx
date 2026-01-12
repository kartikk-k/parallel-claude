import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useSessionManagerStore } from '../../../stores';
import { parseTerminalStatusDebounced } from '../../../utils';

interface TerminalProps {
  className?: string;
  sessionId: string;
  repositoryId: string;
  autoRunCommand?: string;
  isActive?: boolean;
}

export default function Terminal({ className = '', sessionId, repositoryId, autoRunCommand, isActive = true }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const terminalContentRef = useRef<string>('');

  const { updateSessionStatus } = useSessionManagerStore();

  useEffect(() => {
    if (!terminalRef.current) return;
    // Initialize xterm
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1a1a00',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    // Attach terminal to DOM immediately
    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Attach to terminal session (creates if doesn't exist, or reattaches if it does)
    window.electron?.ipcRenderer.sendMessage('terminal-attach', sessionId, repositoryId);

    // Handle data from terminal - filter by sessionId
    const unsubscribeData = window.electron?.ipcRenderer.on(
      'terminal-data',
      (...args: unknown[]) => {
        const receivedSessionId = args[0] as string;
        const data = args[1] as string;

        if (receivedSessionId === sessionId) {
          xterm.write(data);

          // Accumulate terminal content
          terminalContentRef.current += data;

          // Keep only last 10000 characters to avoid memory issues
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

    // Handle terminal exit
    const unsubscribeExit = window.electron?.ipcRenderer.on(
      'terminal-exit',
      (...args: unknown[]) => {
        const receivedSessionId = args[0] as string;
        const exitCode = args[1] as number;

        if (receivedSessionId === sessionId) {
          xterm.write(`\r\n\r\n[Process exited with code ${exitCode}]\r\n`);
        }
      }
    );

    // Send user input to terminal
    xterm.onData((data) => {
      window.electron?.ipcRenderer.sendMessage('terminal-input', sessionId, data);
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      if (xterm.rows && xterm.cols) {
        window.electron?.ipcRenderer.sendMessage('terminal-resize', sessionId, {
          cols: xterm.cols,
          rows: xterm.rows,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Add ResizeObserver to handle container size changes (e.g., sidebar toggle)
    let resizeTimeout: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to debounce and prevent loop
      if (resizeTimeout !== null) {
        cancelAnimationFrame(resizeTimeout);
      }
      resizeTimeout = requestAnimationFrame(() => {
        handleResize();
        resizeTimeout = null;
      });
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    // Cleanup - detach from terminal but keep process running
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout !== null) {
        cancelAnimationFrame(resizeTimeout);
      }
      resizeObserver.disconnect();
      if (unsubscribeData) unsubscribeData();
      if (unsubscribeExit) unsubscribeExit();
      // Detach UI from terminal (process keeps running in background)
      window.electron?.ipcRenderer.sendMessage('terminal-detach', sessionId);
      xterm.dispose();
    };
  }, [sessionId, repositoryId]);

  // Handle terminal visibility changes
  useEffect(() => {
    if (isActive && xtermRef.current && fitAddonRef.current) {
      // Use requestAnimationFrame to ensure browser has painted
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Refit terminal dimensions
          fitAddonRef.current?.fit();
          // Scroll to bottom to show latest output
          xtermRef.current?.scrollToBottom();
        });
      });
    }
  }, [isActive]);

  return (
    <div className={`w-full h-full p-2 bg-black/10 ${className}`}>
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}
