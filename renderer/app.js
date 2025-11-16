const { createApp } = Vue;

createApp({
  data() {
    return {
      repoPath: null,
      commits: []
    };
  },

  methods: {
    async chooseRepo() {
      const path = await window.electronAPI.selectRepo();
      if (path) {
        this.repoPath = path;
        console.log("Repo selected:", path);
      }
    },

    async createHook() {
      if (!this.repoPath) return;

      const result = await window.electronAPI.generateHook(this.repoPath);
      console.log("Generate hook:", result);

      if (result.success) {
        alert("Hook berhasil dibuat!");
      } else {
        alert("Gagal: " + result.error);
      }
    },

    async loadCommits() {
      const data = await window.electronAPI.getCommits();
      console.log("Commits:", data);
      this.commits = data;
    }
  }
}).mount("#app");
