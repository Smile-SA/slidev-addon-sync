<script lang="ts" setup>
import { configs } from "@slidev/client";
import { computed, onMounted, ref, watch } from "vue";
import VerticalDivider from "@slidev/client/internals/VerticalDivider.vue";

import { autoConnect, connect, connectState, groupId } from "../services";
import { Status } from "../types";

const input = ref<HTMLInputElement>();
const isOpen = ref(false);
const title = computed(() => {
  if (connectState.value === Status.DISCONNECTED) {
    return "Disconnected";
  } else if (connectState.value === Status.ERROR) {
    return "Server unreachable";
  } else if (connectState.value === Status.CONNECTED) {
    return "Connected";
  } else {
    return "Connect with sync server";
  }
});
const hasConnectionError = computed(
  () =>
    connectState.value === Status.DISCONNECTED ||
    connectState.value === Status.ERROR
);

watch(isOpen, () => {
  if (isOpen.value) {
    input.value?.focus();
  }
});

function submit() {
  connect();
  isOpen.value = false;
}

onMounted(() => {
  if (
    configs.syncSettings?.autoConnect === true ||
    (autoConnect.value &&
      new Date().getTime() - new Date(autoConnect.value).getTime() <
        configs.syncSettings?.autoConnect * 1000)
  ) {
    connect();
  }
});
</script>

<template>
  <VerticalDivider />
  <button class="slidev-icon-btn" @click="isOpen = !isOpen" :title="title">
    <carbon:wifi-bridge-alt
      :class="{
        'text-red-500': hasConnectionError,
        'text-green-500': connectState === Status.CONNECTED,
      }"
    />
  </button>
  <form
    v-if="!hasConnectionError"
    class="flex align-center py-2"
    @submit.prevent="submit"
  >
    <input
      border="~ transparent rounded gray-400 opacity-25"
      class="px-2 text-sm transition-all bg-main"
      placeholder="Type in ID to create or join"
      ref="input"
      :style="{
        width: isOpen ? '200px' : 0,
        padding: isOpen ? undefined : 0,
        border: isOpen ? undefined : 0,
      }"
      v-model="groupId"
    />
  </form>
</template>
