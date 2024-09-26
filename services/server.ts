import type { UnwrapRef } from "vue";

import { addSyncMethod, configs } from "@slidev/client";
import { diff } from "deep-object-diff";
import { ref, toRaw } from "vue";

import {
  Server,
  State,
  StateConfig,
  States,
  Status,
  SyncState,
} from "../types";
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

function copy(state: Partial<State>): Partial<State> {
  return JSON.parse(JSON.stringify(state));
}

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

    if (channel.init) {
      states[channelKey] = state;
    }
    const stateCopy = ref<Partial<State>>(
      copy(getFilteredState(channel, state)),
    );
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
              Object.entries(stateDiff)
                .filter(([, value]) => value !== undefined)
                .map(([key]) => [key, states[channelKey][key]]),
            ) as Partial<State>,
          );
        }
      }
    });

    return (state: State, updating = false) => {
      if (canUpdate(channel) && !updating) {
        const filteredState = getFilteredState(channel, state);
        const stateDiff = diff(stateCopy.value as object, filteredState);
        stateCopy.value = copy(filteredState) as UnwrapRef<Partial<State>>;
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

function getChannel(channelKey: string): StateConfig | undefined {
  const channels: Record<string, SyncState> =
    stateChannels instanceof Array
      ? Object.fromEntries(stateChannels.map((channel) => [channel, true]))
      : stateChannels;
  let channel = Object.entries(channels).find(([key]) =>
    channelKey.endsWith(key),
  )?.[1];
  if (!(channel instanceof Object) || channel instanceof Array) {
    return {
      keys: channel ?? true,
      presenter: true,
      init: true,
    };
  }
  return { keys: true, presenter: true, init: true, ...channel };
}

function getFilteredState(channel: StateConfig, state: State): Partial<State> {
  const { keys } = channel;
  if (keys === true) {
    return toRaw(state);
  }
  return Object.fromEntries(
    Object.entries(toRaw(state)).filter(([key]) => keys.includes(key)),
  ) as Partial<State>;
}

function canUpdate(channel: StateConfig) {
  return isPresenter.value || !channel.presenter;
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
