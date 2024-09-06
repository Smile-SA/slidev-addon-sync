import type { UnwrapRef } from "vue";

import { addSyncMethod, configs } from "@slidev/client";
import { diff } from "deep-object-diff";
import { ref, toRaw } from 'vue';

import { Server, State, States, Status } from "../types";
import { autoConnect, connectState, deviceId, groupId, isPresenter } from "./store.ts";

let server: Server;
const promise = (async () => {
  if (configs.syncSettings?.server) {
    if (configs.syncSettings.server.startsWith("ws")) {
      server = await import("./webSocket.ts");
    } else {
      server = await import("./sse.ts");
    }
  }
})();

function onClose() {
  if (connectState.value === Status.IDLE) {
    connectState.value = Status.ERROR;
  } else {
    connectState.value = Status.DISCONNECTED;
  }
}

function getFilteredState(channelKey: string, state: State): Partial<State> {
  const filteredKeys = channelKey.endsWith("- shared")
    ? ["page", "clicks", "cursor", "lastUpdate"]
    : undefined;
  if (!filteredKeys) {
    return toRaw(state);
  }
  return Object.fromEntries(
    Object.entries(toRaw(state)).filter(([key]) =>
      filteredKeys.includes(key),
    ),
  ) as Partial<State>;
}

const states: States = {};
export async function connect() {
  await promise;
  autoConnect.value = new Date().toISOString();
  addSyncMethod({
    init(
      channelKey: string,
      onUpdate: (data: Partial<State>) => void,
      state: State,
    ) {
      states[channelKey] = state;

      function onOpen(open: (states?: States) => void) {
        if (groupId.value) {
          open(isPresenter.value ? states : undefined)
          connectState.value = Status.CONNECTED;
        }
      }
  
      function onMessage(states: States, uid: string) {
        if (states && channelKey in states) {
          const filteredState = getFilteredState(channelKey, state);
          const stateDiff = diff(
            filteredState,
            states[channelKey],
          ) as Partial<State>;
          if (
            Object.keys(stateDiff).length > 0 &&
            uid !== deviceId.value
          ) {
            onUpdate(
              Object.fromEntries(
                Object.entries(stateDiff).filter(
                  ([, value]) => value !== undefined,
                ),
              ) as Partial<State>,
            );
          }
        }
      }
  
      const filteredState = { ...getFilteredState(channelKey, state) };
      const stateCopy = ref<Partial<State>>(filteredState);
      const patch = server.init(onMessage, onOpen, onClose);
  
      return (state: State) => {
        if (isPresenter.value) {
          const filteredState = getFilteredState(channelKey, state);
          const stateDiff = diff(filteredState, stateCopy.value as object);
          stateCopy.value = { ...filteredState } as UnwrapRef<Partial<State>>;
          if (Object.keys(stateDiff).length > 0 && connectState.value === Status.CONNECTED) {
            patch(
              channelKey,
              Object.fromEntries(
                Object.keys(stateDiff).map((key) => [
                  key,
                  filteredState[key as keyof typeof filteredState],
                ]),
              ),
            );
          }
        }
      };
    },
  });
}
