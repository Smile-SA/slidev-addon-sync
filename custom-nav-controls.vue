<script lang="ts" setup>
import { configs, mode } from "@slidev/client";
import { computed } from "vue";

const enabled = computed(
  () => {
    const enabledSettings = configs.syncSettings?.enabled ?? 'build'
    return enabledSettings === true || enabledSettings === mode
  }
);
</script>

<template>
  <SyncConnect v-if="configs.syncSettings?.server && enabled" />
</template>
