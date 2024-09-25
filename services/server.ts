import type { UnwrapRef } from "vue";

import { addSyncMethod, configs } from "@slidev/client";
import { diff } from "deep-object-diff";
import { ref, toRaw } from "vue";

import { Server, State, States, Status } from "../types";
import {
  autoConnect,
  connectState,
  deviceId,
  groupId,
  isPresenter,
  onMessages,
  stateChannels,
} from "./store.ts";

let server: Server;
const states: States = {};
const importPromise = (async () => {
  if (configs.syncSettings?.server) {
    if (configs.syncSettings.server.startsWith("ws")) {
      server = await import("./webSocket.ts");
    } else {
      server = await import("./sse.ts");
    }
  }
})();
const loadPromise = new Promise<void>((resolve) => {
  if (document.readyState === "complete") {
    resolve();
  } else {
    window.addEventListener("load", () => resolve());
  }
});
const promises = Promise.all([importPromise, loadPromise]);

addSyncMethod({
  init(
    channelKey: string,
    onUpdate: (data: Partial<State>) => void,
    state: State,
  ) {
    const channel = getChannel(channelKey);
    if (!channel) {
      return;
    }

    states[channelKey] = state;
    const filteredState = { ...getFilteredState(channel, state) };
    const stateCopy = ref<Partial<State>>(filteredState);
    onMessages.value.push((states: States, uid: string) => {
      if (states && channelKey in states) {
        const filteredState = getFilteredState(channel, state);
        const stateDiff = diff(
          filteredState,
          states[channelKey],
        ) as Partial<State>;
        if (Object.keys(stateDiff).length > 0 && uid !== deviceId.value) {
          onUpdate(
            Object.fromEntries(
              Object.entries(stateDiff).filter(
                ([, value]) => value !== undefined,
              ),
            ) as Partial<State>,
          );
        }
      }
    });

    return (state: State) => {
      if (canUpdate(channelKey)) {
        const filteredState = getFilteredState(channel, state);
        const stateDiff = diff(filteredState, stateCopy.value as object);
        stateCopy.value = { ...filteredState } as UnwrapRef<Partial<State>>;
        if (
          Object.keys(stateDiff).length > 0 &&
          connectState.value === Status.CONNECTED
        ) {
          server.patch(
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

function getChannel(channelKey: string): string[] | true | undefined {
  const channels: Record<string, string[] | true> =
    stateChannels instanceof Array
      ? Object.fromEntries(stateChannels.map((channel) => [channel, true]))
      : stateChannels;
  const channel = Object.entries(channels).find(([key]) =>
    channelKey.endsWith(key),
  );
  return channel?.[1];
}

function getFilteredState(
  channel: string[] | true,
  state: State,
): Partial<State> {
  if (channel === true) {
    return toRaw(state);
  }
  return Object.fromEntries(
    Object.entries(toRaw(state)).filter(([key]) => channel.includes(key)),
  ) as Partial<State>;
}

function canUpdate(channelKey: string) {
  return (
    isPresenter.value ||
    configs.syncNoPresenter === true ||
    configs.syncNoPresenter?.some((key) => channelKey.endsWith(key))
  );
}

function onClose() {
  if (connectState.value === Status.IDLE) {
    connectState.value = Status.ERROR;
  } else {
    connectState.value = Status.DISCONNECTED;
  }
}

function onOpen() {
  if (groupId.value) {
    server.open(isPresenter.value ? states : undefined);
    connectState.value = Status.CONNECTED;
  }
}

export async function connect() {
  await promises;
  autoConnect.value = new Date().toISOString();
  server.init(onOpen, onClose);
}
