const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
  
  // Pilih folder repository
  selectRepo: () => ipcRenderer.invoke("select-repo"),

  // Generate commit-msg hook
  generateHook: (repoPath) => ipcRenderer.invoke("generate-hook", repoPath),

  // Ambil daftar commit (untuk UI)
  getCommits: () => ipcRenderer.invoke("get-commits"),

  // Ambil endpoint
  getEndpoint: () => ipcRenderer.invoke("get-endpoint"),

  // Simpan endpoint
  setEndpoint: (value) => ipcRenderer.invoke("set-endpoint", value),

  // Kirim commit ke endpoint
  sendCommit: (commit) => ipcRenderer.invoke("send-commit", commit),

  // Masih mempertahankan contoh fungsi ping bila mau dipakai
  ping: () => ipcRenderer.invoke("ping")
});
