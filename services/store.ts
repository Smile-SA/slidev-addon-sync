import { ref } from "vue";
import { configs, useNav } from "@slidev/client";
import { useStorage } from "@vueuse/core";
import { v4 as uuidv4 } from "uuid";

import { OnMessage, Status } from "../types/index.ts";

import { getHash } from "./helper.ts";

export const { isPresenter } = useNav();
export const deviceId = useStorage("slidev-addon-sync-device-id", uuidv4());
export const groupId = useStorage("slidev-addon-sync-group-id", getHash());
export const autoConnect = useStorage("slidev-addon-sync-auto-connect", "");
export const connectState = ref(Status.IDLE);
export const onMessages = ref<OnMessage[]>([]);

export const stateChannels = configs.syncStates ?? {
  shared: ["page", "clicks", "cursor", "lastUpdate"],
  drawings: true,
}
