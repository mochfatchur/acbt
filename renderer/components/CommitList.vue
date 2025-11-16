<template>
  <div class="space-y-2">
    <div
      v-for="item in items"
      :key="item.timestamp"
      class="p-3 bg-white shadow rounded border"
    >
      <p class="font-semibold">{{ item.message }}</p>
      <p class="text-xs text-gray-500">{{ item.timestamp }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: Array
  }
};
</script>
