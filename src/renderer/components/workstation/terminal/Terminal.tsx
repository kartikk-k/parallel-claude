import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  className?: string;
  sessionId: string;
  repositoryId: string;
  autoRunCommand?: string;
}

export default function Terminal({ className = '', sessionId, repositoryId, autoRunCommand }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;
    // Initialize xterm
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
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

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Request a new terminal session from main process
    window.electron?.ipcRenderer.sendMessage('terminal-create', sessionId, repositoryId);

    // Handle data from terminal - filter by sessionId
    const unsubscribeData = window.electron?.ipcRenderer.on(
      'terminal-data',
      (...args: unknown[]) => {
        const receivedSessionId = args[0] as string;
        const data = args[1] as string;

        if (receivedSessionId === sessionId) {
          xterm.write(data);
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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout !== null) {
        cancelAnimationFrame(resizeTimeout);
      }
      resizeObserver.disconnect();
      if (unsubscribeData) unsubscribeData();
      if (unsubscribeExit) unsubscribeExit();
      window.electron?.ipcRenderer.sendMessage('terminal-destroy', sessionId);
      xterm.dispose();
    };
  }, [sessionId, repositoryId]);

  return (
    <div className={`w-full h-full p-2 bg-black/10 ${className}`}>
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
}
