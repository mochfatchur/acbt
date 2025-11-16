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

      <button
        class="mt-2 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        @click="showEndpointModal = true"
      >
        Atur Endpoint
      </button>

    </aside>

    <!-- Main content -->
    <main class="flex-1 p-6 overflow-auto">

      <!-- Header + Refresh -->
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold">Commit Logs</h1>

        <button
          @click="loadCommits"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition"
        >
          Refresh
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-4 mb-4">

        <!-- Repo filter -->
        <select
          v-model="repoFilter"
          class="border rounded px-2 py-1"
        >
          <option value="">All Repos</option>
          <option
            v-for="repo in availableRepos"
            :key="repo"
            :value="repo"
          >
            {{ repo }}
          </option>
        </select>

        <!-- Date filter -->
        <input
          v-model="dateFilter"
          type="date"
          class="border rounded px-2 py-1"
        />
      </div>

      <!-- Commit List -->
      <CommitList :items="filteredCommits" />


      <!-- Modal Atur Endpoint -->
      <div
        v-if="showEndpointModal"
        class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
      >
        <div class="bg-white p-6 rounded shadow w-96">
          <h2 class="text-lg font-bold mb-3">Atur Endpoint</h2>

          <input
            v-model="endpoint"
            type="text"
            placeholder="https://example.com/api/commit"
            class="border w-full px-2 py-1 rounded mb-4"
          />

          <div class="flex justify-end gap-2">
            <button
              class="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
              @click="showEndpointModal = false"
            >
              Cancel
            </button>

            <button
              class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              @click="saveEndpoint"
            >
              Save
            </button>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import RepoSelector from "./components/RepoSelector.vue";
import CommitList from "./components/CommitList.vue";

export default {
  components: { RepoSelector, CommitList },

  setup() {
    const repoPath = ref(null);

    const showEndpointModal = ref(false);
    const endpoint = ref("");
    

    const allCommits = ref([]);   // semua commit
    const repoFilter = ref("");   // repo name
    const dateFilter = ref("");   // YYYY-MM-DD

    function setRepo(path) {
      repoPath.value = path;
    }

    async function generateHook() {
      if (!repoPath.value) {
        alert("Pilih repo dulu!");
        return;
      }

      const res = await window.electronAPI.generateHook(repoPath.value);
      if (res.success) alert("Hook berhasil dipasang!");
      else alert("Error: " + res.error);
    }

    // simpan endpoint
    async function saveEndpoint() {
      await window.electronAPI.setEndpoint(endpoint.value);
      showEndpointModal.value = false;
      alert("Endpoint disimpan!");
    }

    // get commits data
    async function loadCommits() {
      allCommits.value = await window.electronAPI.getCommits();
    }

    // Ambil daftar repo unik
    const availableRepos = computed(() => {
      const set = new Set(allCommits.value.map(c => c.repo).filter(Boolean));
      return [...set];
    });

    // Filtering
    const filteredCommits = computed(() => {
      return allCommits.value.filter(commit => {
        let ok = true;

        // filter repo
        if (repoFilter.value) {
          ok = ok && commit.repo === repoFilter.value;
        }

        // filter tanggal
        if (dateFilter.value) {
          const commitDate = commit.timestamp.substring(0, 10);
          ok = ok && commitDate === dateFilter.value;
        }

        return ok;
      });
    });

    loadCommits();

    // auto refresh interval
    let intervalId = null;
    onMounted(async() => {
      loadCommits();
      // ← ambil dari store
      endpoint.value = await window.electronAPI.getEndpoint();
      intervalId = setInterval(loadCommits, 5000);
    });
    onUnmounted(() => {
      clearInterval(intervalId);
    });

    return {
      repoPath,
      allCommits,
      repoFilter,
      dateFilter,
      availableRepos,
      filteredCommits,
      generateHook,
      setRepo,
      loadCommits,
      showEndpointModal,
      endpoint,
      saveEndpoint
    };
  }
};
</script>

<style>
body {
  margin: 0;
}
</style>
