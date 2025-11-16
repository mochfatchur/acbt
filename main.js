const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const Store = require('electron-store').default;
const fs = require('fs');
const path = require('path');
const http = require("http");

const store = new Store();

if (!store.get("apiEndpoint")) {
  store.set("apiEndpoint", "");
}

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
  
  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "dist/index.html"));
  }
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
            repo: data.repo || "unknown",
            timestamp: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "+07:00")
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

# Ambil folder root repository
REPO_DIR="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_DIR")"

# Simpan lokal per repo
echo "$(date '+%Y-%m-%d %H:%M:%S') | $COMMIT_MSG" >> "$APP_LOG"

# Kirim ke aplikasi Electron
curl -s -X POST http://localhost:32145/commit \
  -H "Content-Type: application/json" \
  -d "{\\"message\\": \\"$COMMIT_MSG\\", \\"repo\\": \\"$REPO_NAME\\"}" \
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
  const commits =  store.get("commits", []);
  return commits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

// Get API endpoint
ipcMain.handle("get-endpoint", () => {
  return store.get("apiEndpoint", "");
});

// Set API endpoint
ipcMain.handle("set-endpoint", (event, value) => {
  store.set("apiEndpoint", value);
  return true;
});


ipcMain.handle("send-commit", async (event, commit) => {
  console.log("masuk endpoint: ", commit);
  const endpoint = store.get("apiEndpoint", "");

  if (!endpoint) {
    return { success: false, error: "Endpoint belum diatur." };
  }

  return new Promise((resolve) => {
    const data = JSON.stringify({ task: commit.task});

    const url = new URL(endpoint);

    console.log('endpoint: ', endpoint);
    console.log('data: ', data);

    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      }
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        resolve({
          success: res.statusCode === 200,
          response: body
        });
      });
    });

    req.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });

    req.write(data);
    req.end();
  });
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
