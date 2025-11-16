const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const Store = require('electron-store').default;
const fs = require('fs');
const path = require('path');
const http = require("http");

const store = new Store();

// -------------------------
//  Create Window
// -------------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'renderer/index.html'));
}

// -------------------------
//  Start Local Commit Server
//  (Git hook akan POST ke sini)
// -------------------------
function startLocalServer() {
  const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/commit") {
      let body = "";
      req.on("data", chunk => body += chunk);
      req.on("end", () => {
        try {
          const data = JSON.parse(body || "{}");

          // Simpan commit message ke electron-store
          const list = store.get("commits", []);
          list.push({
            message: data.message,
            timestamp: new Date().toISOString()
          });
          store.set("commits", list);

          res.writeHead(200);
          res.end("OK");
        } catch (err) {
          res.writeHead(500);
          res.end("INVALID_JSON");
        }
      });
      return;
    }

    res.writeHead(404);
    res.end("NOT_FOUND");
  });

  server.listen(32145, () => {
    console.log("✔ Local commit server running at http://localhost:32145");
  });
}

// -------------------------
//  IPC Handlers
// -------------------------

// Select repository folder
ipcMain.handle("select-repo", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

// Generate commit-msg hook
ipcMain.handle("generate-hook", async (event, repoPath) => {
  try {
    const hookDir = path.join(repoPath, ".git", "hooks");
    const hookFile = path.join(hookDir, "commit-msg");

    const hookContent = `#!/bin/bash
COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

APP_LOG="${repoPath}/commit-log.txt"

# Simpan lokal per repo
echo "$(date '+%Y-%m-%d %H:%M:%S') | $COMMIT_MSG" >> "$APP_LOG"

# Kirim ke aplikasi Electron
curl -s -X POST http://localhost:32145/commit \
  -H "Content-Type: application/json" \
  -d "{\\"message\\": \\"$COMMIT_MSG\\"}" \
  > /dev/null 2>&1

echo ">>> commit-msg hook executed"
`;

    // Pastikan folder hooks ada
    if (!fs.existsSync(hookDir)) {
      return { success: false, error: ".git/hooks tidak ditemukan" };
    }

    fs.writeFileSync(hookFile, hookContent, { mode: 0o755 });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Get commit list
ipcMain.handle("get-commits", () => {
  return store.get("commits", []);
});

// -------------------------
//  App Init
// -------------------------
app.whenReady().then(() => {
  startLocalServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
