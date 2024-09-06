<script lang="ts" setup>
import { configs } from "@slidev/client";
</script>

<template>
  <SyncConnect v-if="configs.syncSettings?.server" />
</template>
