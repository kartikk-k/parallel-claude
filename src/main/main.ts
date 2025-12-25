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
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import * as pty from 'node-pty';
import * as os from 'os';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

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
let ptyProcess: pty.IPty | null = null; // Terminal process

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
ipcMain.on('terminal-create', (event) => {
  if (ptyProcess) {
    ptyProcess.kill();
  }

  const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || '/bin/zsh');
  const home = os.homedir();

  console.log('Creating PTY with shell:', shell, 'in', home);

  try {
    ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 30,
      cwd: home,
      env: process.env as any,
    });

    ptyProcess.onData((data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-data', data);
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      console.log('PTY exited with code:', exitCode);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal-exit', exitCode);
      }
      ptyProcess = null;
    });

    console.log('PTY created successfully');
  } catch (error) {
    console.error('Failed to create PTY:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal-data', `Error creating terminal: ${error}\r\n`);
    }
  }
});

ipcMain.on('terminal-input', (event, data) => {
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

ipcMain.on('terminal-resize', (event, { cols, rows }) => {
  if (ptyProcess) {
    try {
      ptyProcess.resize(cols, rows);
    } catch (error) {
      console.error('Failed to resize PTY:', error);
    }
  }
});

ipcMain.on('terminal-destroy', () => {
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
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

const createWindow = async () => {
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
  const windowWidth = 900;
  const windowHeight = screenHeight - 200; // Full height minus 20px padding on top and bottom
  const windowX = screenWidth - windowWidth - 20; // Right side with 20px padding
  const windowY = 50; // 20px padding from top

  mainWindow = new BrowserWindow({
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
    },
  });

  // mainWindow.setContentProtection(true);

  // Hide from dock on macOS
  if (process.platform === 'darwin') {
    // app.dock.hide();
  }

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window focus events
  mainWindow.on('focus', () => {
    mainWindow?.webContents.send('window-focus', true);
  });

  mainWindow.on('blur', () => {
    mainWindow?.webContents.send('window-focus', false);
  });

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Disable developer tools
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow?.webContents.closeDevTools();
  });

  // Prevent opening developer tools via keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
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

  // Register global shortcut for toggling window visibility
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

  // Register global shortcut for toggling focus between Electron window and previous app (without hiding)
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

  // Register movement shortcuts initially since window will be visible
  registerMovementShortcuts();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  // new AppUpdater();
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
