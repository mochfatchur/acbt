<template>
  <div class="flex h-screen">

    <!-- Sidebar -->
    <aside class="w-64 bg-white shadow p-4 border-r border-gray-200">
      <h2 class="text-lg font-bold mb-4">Commit Collector</h2>

      <RepoSelector @selected="setRepo" />

      <button
        class="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        @click="generateHook"
      >
        Install Hook
      </button>
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-6 overflow-auto">
        <div class="flex items-center justify-between mb-4">
            <h1 class="text-2xl font-bold">Commit Logs</h1>
            <button
                @click="loadCommits"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition"
                >
                Refresh
            </button>
        </div>
        <CommitList :items="commits" />
    </main>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import RepoSelector from "./components/RepoSelector.vue";
import CommitList from "./components/CommitList.vue";

export default {
  components: { RepoSelector, CommitList },

  setup() {
    const repoPath = ref(null);
    const commits = ref([]);

    function setRepo(path) {
      repoPath.value = path;
    }

    async function generateHook() {
      if (!repoPath.value) {
        alert("Pilih repo dulu!");
        return;
      }

      const res = await window.electronAPI.generateHook(repoPath.value);

      if (res.success) {
        alert("Hook berhasil dipasang!");
      } else {
        alert("Error: " + res.error);
      }
    }

    async function loadCommits() {
      commits.value = await window.electronAPI.getCommits();
    }

    loadCommits();

    let intervalId = null;

    onMounted(() => {
      loadCommits(); // initial load
      intervalId = setInterval(loadCommits, 5000); // refresh setiap 5 detik
    });

    onUnmounted(() => {
      clearInterval(intervalId);
    });

    return { repoPath, commits, generateHook, setRepo, loadCommits  };
  }
};
</script>

<style>
body {
  margin: 0;
}
</style>
