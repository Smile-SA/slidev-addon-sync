import { ref } from "vue";
import { useStorage } from "@vueuse/core";
import { v4 as uuidv4 } from "uuid";

import { Status } from "../types/index.ts";

import { getHash } from "./helper.ts";
import { useNav } from "@slidev/client";

export const { isPresenter } = useNav();
export const deviceId = useStorage("slidev-addon-sync-device-id", uuidv4());
export const groupId = useStorage("slidev-addon-sync-group-id", getHash());
export const autoConnect = useStorage("slidev-addon-sync-auto-connect", "");
export const connectState = ref(Status.IDLE);
