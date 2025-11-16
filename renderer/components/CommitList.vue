<template>
  <div class="space-y-2 relative">
    <!-- Toast bottom-center -->
    <div
      v-if="toastVisible"
      class="fixed bottom-6 left-1/2 transform -translate-x-1/2
             bg-gray-800 text-white px-4 py-2 rounded shadow text-sm animate-fade"
    >
      Copied!
    </div>

    <!-- Commit Items -->
    <div
      v-for="item in items"
      :key="item.timestamp"
      class="p-3 bg-white shadow rounded border flex justify-between items-start"
    >
      <div>
        <p class="font-semibold break-words">{{ item.message }}</p>
        <p class="text-xs text-gray-500">{{ item.timestamp }}</p>
      </div>

      <button
        @click="copy(item.message)"
        class="ml-4 px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
      >
        Copy
      </button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: Array
  },

  data() {
    return {
      toastVisible: false,
      toastTimer: null
    };
  },

  methods: {
    async copy(text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      this.showToast();
    },

    showToast() {
      this.toastVisible = true;

      if (this.toastTimer) clearTimeout(this.toastTimer);

      this.toastTimer = setTimeout(() => {
        this.toastVisible = false;
      }, 1500);
    }
  }
};
</script>

<style>
@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, 10px); }
  10% { opacity: 1; transform: translate(-50%, 0); }
  90% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, 10px); }
}

.animate-fade {
  animation: fadeInOut 1.5s ease forwards;
}
</style>
