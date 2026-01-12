/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  globalShortcut,
  screen,
  Menu,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import * as pty from 'node-pty';
import { resolveHtmlPath } from './util';
import { StorageService, GitService, RepositoryService, SessionService } from './services';
import { registerRepositoryHandlers } from './ipc/repositoryHandlers';
import { registerSessionHandlers } from './ipc/sessionHandlers';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let previousAppBundleId: string | null = null; // Store the previous focused app bundle ID
let movementShortcutsRegistered = false; // Track if movement shortcuts are registered

// Multi-window management
const windows = new Map<number, BrowserWindow>(); // windowId -> BrowserWindow
const repositoryWindows = new Map<string, number>(); // repositoryId -> windowId
let dashboardWindowId: number | null = null; // Track the dashboard window

// Map of terminal sessions by sessionId
const ptyProcesses = new Map<string, pty.IPty>();

// Initialize services
const storageService = new StorageService();
const gitService = new GitService();
const repositoryService = new RepositoryService(storageService, gitService);
const sessionService = new SessionService(storageService, gitService, repositoryService);

// Register IPC handlers
registerRepositoryHandlers(repositoryService, gitService);
registerSessionHandlers(sessionService, gitService);

// Shell handler to open paths in Finder
ipcMain.handle('shell:openPath', async (event, path: string) => {
  try {
    await shell.openPath(path);
    return { success: true };
  } catch (error) {
    console.error('Error opening path:', error);
    throw error;
  }
});

// Function to get the currently active application bundle ID (macOS)
const getActiveAppBundleId = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(
      'osascript -e \'tell application "System Events" to get bundle identifier of first application process whose frontmost is true\'',
      (error: any, stdout: string) => {
        if (error) {
          resolve(null);
        } else {
          resolve(stdout.trim());
        }
      },
    );
  });
};

// Function to activate an application by bundle ID (macOS)
const activateAppByBundleId = (bundleId: string): Promise<void> => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(
      `osascript -e 'tell application id "${bundleId}" to activate'`,
      (error: any) => {
        resolve();
      },
    );
  });
};

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

// Terminal IPC handlers
ipcMain.on('terminal-attach', async (event, sessionId: string, repositoryId: string) => {
  // Check if process already exists (reattach scenario)
  if (ptyProcesses.has(sessionId)) {
    // PTY already exists and is running, nothing to do
    // TerminalManager will reuse the existing connection
    return;
  }

  try {
    // Get session metadata to retrieve working directory
    const session = await sessionService.getSession(repositoryId, sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || '/bin/zsh');
    const workingDir = session.workingDirectory;

    // Use -l flag for Unix shells to make it a login shell (sources profile files)
    const shellArgs = process.platform === 'win32' ? [] : ['-l'];

    console.log(`Creating PTY for session ${sessionId} with shell:`, shell, 'in', workingDir);

    const ptyProcess = pty.spawn(shell, shellArgs, {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd: workingDir,
      env: process.env as any,
    });

    ptyProcess.onData((data) => {
      // Broadcast to all windows
      windows.forEach((window) => {
        if (window && !window.isDestroyed()) {
          window.webContents.send('terminal-data', sessionId, data);
        }
      });
    });

    ptyProcess.onExit(({ exitCode }) => {
      console.log(`PTY session ${sessionId} exited with code:`, exitCode);
      // Broadcast to all windows
      windows.forEach((window) => {
        if (window && !window.isDestroyed()) {
          window.webContents.send('terminal-exit', sessionId, exitCode);
        }
      });
      ptyProcesses.delete(sessionId);
    });

    ptyProcesses.set(sessionId, ptyProcess);
    console.log(`PTY session ${sessionId} created successfully`);

    // Auto-run command if specified
    if (session.autoRunCommand) {
      setTimeout(async () => {
        try {
          let command = session.autoRunCommand;

          // If this is a claude command, add session management flags
          // @ts-ignore
          if (session.autoRunCommand.includes('claude')) {
            if (session.claudeSessionStarted) {
              // Resume existing session using our session UUID
              command = `${session.autoRunCommand} -r "${session.id}"`;
              console.log(`Resuming Claude session: ${session.id}`);
            } else {
              // Start new session with our session UUID
              command = `${session.autoRunCommand} --session-id "${session.id}"`;
              console.log(`Starting Claude with session ID: ${session.id}`);

              // Mark session as started
              try {
                await sessionService.updateSession(repositoryId, sessionId, {
                  claudeSessionStarted: true,
                });
              } catch (err) {
                console.error('Failed to update claudeSessionStarted flag:', err);
              }
            }
          }

          ptyProcess.write(command + '\r');
          console.log(`Successfully sent command to PTY: ${sessionId}`);
        } catch (err) {
          console.error(`Error in auto-run command for session ${sessionId}:`, err);
        }
      }, 500);
    }
  } catch (error) {
    console.error(`Failed to create PTY session ${sessionId}:`, error);
    // Broadcast error to all windows
    windows.forEach((window) => {
      if (window && !window.isDestroyed()) {
        window.webContents.send('terminal-data', sessionId, `Error creating terminal: ${error}\r\n`);
      }
    });
  }
});

ipcMain.on('terminal-input', (event, sessionId: string, data: string) => {
  const ptyProcess = ptyProcesses.get(sessionId);
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

ipcMain.on('terminal-resize', (event, sessionId: string, { cols, rows }: { cols: number; rows: number }) => {
  const ptyProcess = ptyProcesses.get(sessionId);
  if (ptyProcess) {
    try {
      ptyProcess.resize(cols, rows);
    } catch (error) {
      console.error(`Failed to resize PTY session ${sessionId}:`, error);
    }
  }
});

ipcMain.on('terminal-detach', (event, sessionId: string) => {
  // UI component is detaching (unmounting), but PTY process stays alive
  // TerminalManager handles the xterm lifecycle separately from PTY
  // Only truly destroy PTY on 'terminal-destroy' event
});

ipcMain.on('terminal-destroy', (event, sessionId: string) => {
  const ptyProcess = ptyProcesses.get(sessionId);
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcesses.delete(sessionId);
    console.log(`PTY session ${sessionId} destroyed`);
  }
});

// Window management IPC handlers
ipcMain.handle('window:open-new', async (event, initialRoute?: string) => {
  // Check if opening dashboard (route is '/' or undefined)
  const isDashboard = !initialRoute || initialRoute === '/';

  if (isDashboard && dashboardWindowId !== null) {
    // Check if dashboard window still exists
    const existingWindow = windows.get(dashboardWindowId);
    if (existingWindow && !existingWindow.isDestroyed()) {
      // Focus existing dashboard window
      existingWindow.focus();
      return { windowId: dashboardWindowId, wasExisting: true };
    } else {
      // Window was closed, clear tracking
      dashboardWindowId = null;
    }
  }

  const newWindow = await createWindow(initialRoute);

  // Track if this is a dashboard window
  if (isDashboard) {
    dashboardWindowId = newWindow.id;
  }

  return { windowId: newWindow.id, wasExisting: false };
});

ipcMain.handle('window:open-repository', async (event, repositoryId: string) => {
  // Check if repository is already open in another window
  const existingWindowId = repositoryWindows.get(repositoryId);
  if (existingWindowId) {
    const existingWindow = windows.get(existingWindowId);
    if (existingWindow && !existingWindow.isDestroyed()) {
      // Focus existing window
      existingWindow.focus();
      return { windowId: existingWindowId, wasExisting: true };
    } else {
      // Window was closed, remove from tracking
      repositoryWindows.delete(repositoryId);
    }
  }

  // Open new window for this repository
  const route = `/repository/${repositoryId}`;
  const newWindow = await createWindow(route);
  repositoryWindows.set(repositoryId, newWindow.id);
  return { windowId: newWindow.id, wasExisting: false };
});

ipcMain.on('window:register-repository', (event, repositoryId: string) => {
  // Register which repository this window is showing
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    repositoryWindows.set(repositoryId, window.id);
  }
});

ipcMain.on('window:unregister-repository', (event, repositoryId: string) => {
  repositoryWindows.delete(repositoryId);
});

// Context menu handler
ipcMain.handle('show-context-menu', async (event, menuItems: Array<{ label: string; action: string }>) => {
  return new Promise((resolve) => {
    const template = menuItems.map((item) => ({
      label: item.label,
      click: () => resolve(item.action),
    }));

    const menu = Menu.buildFromTemplate(template);
    const window = BrowserWindow.fromWebContents(event.sender);

    if (window) {
      menu.popup({
        window,
        callback: () => {
          // If menu is dismissed without selection, resolve with null
          resolve(null);
        },
      });
    } else {
      resolve(null);
    }
  });
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async (initialRoute?: string) => {
  // if (isDebug) {
  //   await installExtensions();
  // }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  // Get screen dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Calculate window dimensions and position
  const windowWidth = 1000;
  const windowHeight = screenHeight - 100;
  const windowX = screenWidth - windowWidth - 20;
  const windowY = 50;

  const newWindow = new BrowserWindow({
    show: false,
    width: windowWidth,
    height: windowHeight,
    x: windowX,
    y: windowY,
    icon: getAssetPath('icon.png'),
    transparent: true,
    frame: false,
    resizable: true,
    thickFrame: true,
    opacity: 1,
    alwaysOnTop: false,
    skipTaskbar: process.platform === 'win32',
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    visualEffectState: process.platform === 'darwin' ? 'active' : undefined,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      devTools: false,
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Enable webview for browser preview
    },
  });

  // mainWindow.setContentProtection(true);

  // Hide from dock on macOS
  if (process.platform === 'darwin') {
    // app.dock.hide();
  }

  newWindow.loadURL(resolveHtmlPath('index.html'));

  newWindow.on('ready-to-show', () => {
    try {
      if (!newWindow) {
        throw new Error('"newWindow" is not defined');
      }

      // Set default zoom to 90%
      newWindow.webContents.setZoomFactor(0.9);

      if (process.env.START_MINIMIZED) {
        newWindow.minimize();
      } else {
        newWindow.show();
      }

      // Navigate to initial route if provided
      if (initialRoute && newWindow && !newWindow.isDestroyed()) {
        newWindow.webContents.send('navigate-to', initialRoute);
      }
    } catch (err) {
      console.error('Error in ready-to-show handler:', err);
    }
  });

  const windowId = newWindow.id;

  newWindow.on('closed', () => {
    // Remove from tracking
    windows.delete(windowId);

    // Remove repository mapping if this window had one
    for (const [repoId, winId] of repositoryWindows.entries()) {
      if (winId === windowId) {
        repositoryWindows.delete(repoId);
        break;
      }
    }

    // Clear dashboard window tracking if this was the dashboard
    if (dashboardWindowId === windowId) {
      dashboardWindowId = null;
    }

    // Update mainWindow reference
    if (mainWindow?.id === windowId) {
      mainWindow = null;
    }
  });

  // Handle window focus events
  newWindow.on('focus', () => {
    try {
      if (newWindow && !newWindow.isDestroyed() && newWindow.webContents && !newWindow.webContents.isDestroyed()) {
        newWindow.webContents.send('window-focus', true);
      }
    } catch (err) {
      console.error('Error in focus handler:', err);
    }
  });

  newWindow.on('blur', () => {
    try {
      if (newWindow && !newWindow.isDestroyed() && newWindow.webContents && !newWindow.webContents.isDestroyed()) {
        newWindow.webContents.send('window-focus', false);
      }
    } catch (err) {
      console.error('Error in blur handler:', err);
    }
  });

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  // Open urls in the user's browser
  newWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Disable developer tools
  newWindow.webContents.on('devtools-opened', () => {
    newWindow?.webContents.closeDevTools();
  });

  // Prevent opening developer tools via keyboard shortcuts
  newWindow.webContents.on('before-input-event', (event, input) => {
    // if (input.control && input.shift && input.key.toLowerCase() === 'i') {
    //   event.preventDefault();
    // }
    // if (input.control && input.shift && input.key.toLowerCase() === 'c') {
    //   event.preventDefault();
    // }
    // if (input.key === 'F12') {
    //   event.preventDefault();
    // }

    // Move window with Cmd+Shift+Arrow keys
    // if (input.meta && input.shift) {
    //   if (input.key === 'ArrowUp') {
    //     event.preventDefault();
    //     if (mainWindow) {
    //       const [x, y] = mainWindow.getPosition();
    //       mainWindow.setPosition(x, y - 50); // Move window up by 50 pixels
    //     }
    //   } else if (input.key === 'ArrowDown') {
    //     event.preventDefault();
    //     if (mainWindow) {
    //       const [x, y] = mainWindow.getPosition();
    //       mainWindow.setPosition(x, y + 50); // Move window down by 50 pixels
    //     }
    //   } else if (input.key === 'ArrowLeft') {
    //     event.preventDefault();
    //     if (mainWindow) {
    //       const [x, y] = mainWindow.getPosition();
    //       mainWindow.setPosition(x - 50, y); // Move window left by 50 pixels
    //     }
    //   } else if (input.key === 'ArrowRight') {
    //     event.preventDefault();
    //     if (mainWindow) {
    //       const [x, y] = mainWindow.getPosition();
    //       mainWindow.setPosition(x + 50, y); // Move window right by 50 pixels
    //     }
    //   }
    // }
  });

  // Function to register movement shortcuts
  const registerMovementShortcuts = () => {
    if (movementShortcutsRegistered) return;

    // globalShortcut.register('CommandOrControl+Shift+Up', () => {
    //   if (mainWindow) {
    //     const [x, y] = mainWindow.getPosition();
    //     mainWindow.setPosition(x, y - 50); // Move window up by 50 pixels
    //   }
    // });

    // globalShortcut.register('CommandOrControl+Shift+Down', () => {
    //   if (mainWindow) {
    //     const [x, y] = mainWindow.getPosition();
    //     mainWindow.setPosition(x, y + 50); // Move window down by 50 pixels
    //   }
    // });

    // globalShortcut.register('CommandOrControl+Shift+Left', () => {
    //   if (mainWindow) {
    //     const [x, y] = mainWindow.getPosition();
    //     mainWindow.setPosition(x - 50, y); // Move window left by 50 pixels
    //   }
    // });

    // globalShortcut.register('CommandOrControl+Shift+Right', () => {
    //   if (mainWindow) {
    //     const [x, y] = mainWindow.getPosition();
    //     mainWindow.setPosition(x + 50, y); // Move window right by 50 pixels
    //   }
    // });

    // globalShortcut.register('CommandOrControl+/', async () => {
    //   if (mainWindow && mainWindow.isVisible()) {
    //     if (mainWindow.isFocused()) {
    //       await activateAppByBundleId(previousAppBundleId as string);
    //     } else {
    //       previousAppBundleId = await getActiveAppBundleId();
    //       mainWindow.show();
    //       mainWindow.focus();
    //       registerMovementShortcuts();
    //     }
    //   }
    // });

    // movementShortcutsRegistered = true;
  };

  // Function to unregister movement shortcuts
  const unregisterMovementShortcuts = () => {
    if (!movementShortcutsRegistered) return;

    globalShortcut.unregister('CommandOrControl+Shift+Up');
    globalShortcut.unregister('CommandOrControl+Shift+Down');
    globalShortcut.unregister('CommandOrControl+Shift+Left');
    globalShortcut.unregister('CommandOrControl+Shift+Right');
    globalShortcut.unregister('CommandOrControl+/');

    movementShortcutsRegistered = false;
  };

  // Register Cmd+N shortcut to open new window (only register once)
  if (windows.size === 0) {
    // Disabled: Cmd+N shortcut for new window
    // globalShortcut.register('CommandOrControl+N', async () => {
    //   await createWindow('/'); // Open new window with Dashboard
    // });

    // Register global shortcut for toggling window visibility (only register once)
    globalShortcut.register('CommandOrControl+\\', async () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          // Store the current focused app before hiding
          previousAppBundleId = await getActiveAppBundleId();
          mainWindow.hide();
          // Unregister movement shortcuts when window is hidden
          unregisterMovementShortcuts();
          // Focus back to the previous app
          if (
            previousAppBundleId &&
            previousAppBundleId !== 'com.electron.desktop-daddy'
          ) {
            await activateAppByBundleId(previousAppBundleId);
          }
        } else {
          // Store the current focused app before showing
          previousAppBundleId = await getActiveAppBundleId();
          mainWindow.show();
          mainWindow.focus();
          // Register movement shortcuts when window is shown
          registerMovementShortcuts();
        }
      }
    });
  }

  // Register movement shortcuts initially since window will be visible
  registerMovementShortcuts();

  // Track window
  windows.set(windowId, newWindow);

  // Track as dashboard window if no route or root route
  const isDashboard = !initialRoute || initialRoute === '/';
  if (isDashboard && dashboardWindowId === null) {
    dashboardWindowId = windowId;
  }

  // Set as mainWindow if it's the first window
  if (!mainWindow) {
    mainWindow = newWindow;
  }

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  // new AppUpdater();

  return newWindow;
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Add uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  console.error('Stack trace:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Single instance lock - prevent multiple instances from opening
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  app.quit();
} else {
  // This is the first/only instance
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app
    .whenReady()
    .then(() => {
      createWindow();
      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) createWindow();
      });
    })
    .catch(console.log);
}
