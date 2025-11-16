<template>
  <div>
    <button
      class="bg-gray-800 text-white px-4 py-2 rounded w-full hover:bg-black"
      @click="chooseRepo"
    >
      Pilih Repository
    </button>

    <p v-if="repo" class="text-xs mt-2 text-gray-600">
      Dipilih: {{ repo }}
    </p>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  emits: ["selected"],
  setup(_, { emit }) {
    const repo = ref(null);

    async function chooseRepo() {
      repo.value = await window.electronAPI.selectRepo();
      emit("selected", repo.value);
    }

    return { repo, chooseRepo };
  }
};
</script>
