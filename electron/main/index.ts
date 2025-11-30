import { Button, Key, keyboard, mouse } from "@nut-tree-fork/nut-js";
import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  shell,
  systemPreferences,
} from "electron";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { update } from "./update";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

function createWindow() {
  win = new BrowserWindow({
    width: 1580,
    height: 960,
    icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
    webPreferences: {
      preload,
      backgroundThrottling: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    // win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  // Auto update
  update(win);
}

// Check and request accessibility permissions on macOS
function checkAccessibilityPermissions() {
  if (process.platform === "darwin") {
    const hasAccess = systemPreferences.isTrustedAccessibilityClient(true);
    if (!hasAccess) {
      console.warn(
        "Accessibility permissions not granted. Please grant accessibility permissions in System Preferences > Security & Privacy > Privacy > Accessibility"
      );
    } else {
      console.log("Accessibility permissions granted");
    }
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Key mapping for nut-js - special keys
const keyMap: Record<string, Key> = {
  Meta: process.platform === "darwin" ? Key.LeftSuper : Key.LeftSuper,
  Space: Key.Space,
  Enter: Key.Enter,
  Escape: Key.Escape,
  Backspace: Key.Backspace,
  Tab: Key.Tab,
  Delete: Key.Delete,
  ArrowUp: Key.Up,
  ArrowDown: Key.Down,
  ArrowLeft: Key.Left,
  ArrowRight: Key.Right,
  Home: Key.Home,
  End: Key.End,
  PageUp: Key.PageUp,
  PageDown: Key.PageDown,
  Insert: Key.Insert,
  F1: Key.F1,
  F2: Key.F2,
  F3: Key.F3,
  F4: Key.F4,
  F5: Key.F5,
  F6: Key.F6,
  F7: Key.F7,
  F8: Key.F8,
  F9: Key.F9,
  F10: Key.F10,
  F11: Key.F11,
  F12: Key.F12,
  Shift: Key.LeftShift,
  Control: Key.LeftControl,
  Alt: Key.LeftAlt,
};

// Mapping for single character keys to Key enum
const charKeyMap: Record<string, Key> = {
  a: Key.A,
  b: Key.B,
  c: Key.C,
  d: Key.D,
  e: Key.E,
  f: Key.F,
  g: Key.G,
  h: Key.H,
  i: Key.I,
  j: Key.J,
  k: Key.K,
  l: Key.L,
  m: Key.M,
  n: Key.N,
  o: Key.O,
  p: Key.P,
  q: Key.Q,
  r: Key.R,
  s: Key.S,
  t: Key.T,
  u: Key.U,
  v: Key.V,
  w: Key.W,
  x: Key.X,
  y: Key.Y,
  z: Key.Z,
  "0": Key.Num0,
  "1": Key.Num1,
  "2": Key.Num2,
  "3": Key.Num3,
  "4": Key.Num4,
  "5": Key.Num5,
  "6": Key.Num6,
  "7": Key.Num7,
  "8": Key.Num8,
  "9": Key.Num9,
  "-": Key.Minus,
  "=": Key.Equal,
  "[": Key.LeftBracket,
  "]": Key.RightBracket,
  "\\": Key.Backslash,
  ";": Key.Semicolon,
  "'": Key.Quote,
  ",": Key.Comma,
  ".": Key.Period,
  "/": Key.Slash,
  "`": Key.Grave,
};
keyboard.config.autoDelayMs = 0;

// Convert key name to nut-js Key enum
function getNutKey(key: string): Key | null {
  // Check if it's a special key
  if (keyMap[key] !== undefined) {
    return keyMap[key];
  }
  // Single character keys
  if (key.length === 1) {
    const lowerKey = key.toLowerCase();
    if (charKeyMap[lowerKey]) {
      return charKeyMap[lowerKey];
    }
  }
  return null;
}

// Check if a key is a modifier key
function isModifierKey(key: Key): boolean {
  return (
    key === Key.LeftShift ||
    key === Key.RightShift ||
    key === Key.LeftControl ||
    key === Key.RightControl ||
    key === Key.LeftAlt ||
    key === Key.RightAlt ||
    key === Key.LeftSuper ||
    key === Key.RightSuper
  );
}

// Handle mouse movement requests
ipcMain.handle("mouse-move", async (_event, deltaX: number, deltaY: number) => {
  try {
    const currentPos = await mouse.getPosition();

    // Get screen bounds for the display containing the current mouse position
    const display = screen.getDisplayNearestPoint({
      x: currentPos.x,
      y: currentPos.y,
    });
    const bounds = display.bounds;

    // Calculate new position
    let newX = currentPos.x + Math.round(deltaX);
    let newY = currentPos.y + Math.round(deltaY);

    // Clamp to screen boundaries
    newX = Math.max(bounds.x, Math.min(bounds.x + bounds.width - 1, newX));
    newY = Math.max(bounds.y, Math.min(bounds.y + bounds.height - 1, newY));

    // Move mouse to clamped position
    await mouse.setPosition({
      x: newX,
      y: newY,
    });

    return { success: true };
  } catch (error) {
    console.error("Error moving mouse:", error);
    return { success: false, error: String(error) };
  }
});

// Mouse button mapping
const mouseButtonMap: Record<string, Button> = {
  MouseLeft: Button.LEFT,
  MouseRight: Button.RIGHT,
  MouseMiddle: Button.MIDDLE,
};

// Handle mouse button toggle requests
ipcMain.handle(
  "mouse-button-toggle",
  async (_event, button: string, down: boolean) => {
    try {
      const nutButton = mouseButtonMap[button];
      if (nutButton === undefined) {
        console.warn(`Unknown mouse button: ${button}`);
        return { success: false, error: `Unknown mouse button: ${button}` };
      }

      if (down) {
        await mouse.pressButton(nutButton);
      } else {
        await mouse.releaseButton(nutButton);
      }

      return { success: true };
    } catch (error) {
      console.error("Error simulating mouse button:", error);
      return { success: false, error: String(error) };
    }
  }
);

// Handle key toggle requests
ipcMain.handle("key-toggle", async (_event, key: string, down: boolean) => {
  try {
    const nutKey = getNutKey(key);
    if (nutKey !== null) {
      if (down) {
        await keyboard.pressKey(nutKey);
      } else {
        await keyboard.releaseKey(nutKey);
      }
    } else {
      console.warn(`Unknown key: ${key}`);
      return { success: false, error: `Unknown key: ${key}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Error simulating key:", error);
    return { success: false, error: String(error) };
  }
});

// Gamepad polling state
let gamepadPollingInterval: NodeJS.Timeout | null = null;

// Start gamepad polling in main process
// This ensures polling continues even when main window doesn't have focus
function startGamepadPolling() {
  if (gamepadPollingInterval) {
    return; // Already polling
  }

  // Poll gamepads from main process
  // Send message to renderer to poll gamepads, which will use navigator.getGamepads()
  // and send the data back to main process for broadcasting
  gamepadPollingInterval = setInterval(() => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("poll-gamepads");
    }
  }, 16); // ~60fps
}

// Listen for gamepad data from renderer
ipcMain.on("gamepad-data", (_event, gamepads) => {
  // Broadcast to all renderers
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send("gamepad-update", gamepads);
  });
});

app.whenReady().then(() => {
  createWindow();
  // Check permissions
  checkAccessibilityPermissions();
  // Start gamepad polling
  startGamepadPolling();
});
