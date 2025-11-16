const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
  
  // Pilih folder repository
  selectRepo: () => ipcRenderer.invoke("select-repo"),

  // Generate commit-msg hook
  generateHook: (repoPath) => ipcRenderer.invoke("generate-hook", repoPath),

  // Ambil daftar commit (untuk UI)
  getCommits: () => ipcRenderer.invoke("get-commits"),

  // Masih mempertahankan contoh fungsi ping bila mau dipakai
  ping: () => ipcRenderer.invoke("ping")
});
