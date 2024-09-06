import type { UnwrapRef } from "vue";

import { ref, toRaw } from "vue";
import { addSyncMethod } from "@slidev/client";
import { diff } from "deep-object-diff";

import { EventType, State, States, Status } from "../types";

import { getSyncServer } from "./helper.ts";
import {
  autoConnect,
  connectState,
  deviceId,
  groupId,
  isPresenter,
} from "./store.ts";

interface SendState {
  states: States;
  type: EventType;
  uid?: string;
}

let webSocket: WebSocket;

// function onMessage(event) {
//   const { data, type } = JSON.parse(event.data) as SendState;
//   if (type === SendType.POLL) {
//     Object.entries(data).forEach(([key, value]) => (pollState[key] = value));
//   } else {
//     Object.entries(data).forEach(([key, value]) => (userState[key] = value));
//   }
// }

const states: Record<string, object> = {};
const timeout = ref<NodeJS.Timeout>();
function onOpen(channelKey: string, state: State) {
  states[channelKey] = state;
  clearTimeout(timeout.value);
  timeout.value = setTimeout(() => {
    if (groupId.value) {
      webSocket.send(
        JSON.stringify({
          id: groupId.value,
          states: isPresenter.value ? { [channelKey]: state } : undefined,
          type: "connect",
          uid: deviceId.value,
        }),
      );
      connectState.value = Status.CONNECTED;
    }
  });
}

function onClose() {
  if (connectState.value === Status.IDLE) {
    connectState.value = Status.ERROR;
  } else {
    connectState.value = Status.DISCONNECTED;
  }
}

function patch(channelKey: string, state: unknown) {
  if (connectState.value === Status.CONNECTED) {
    webSocket.send(
      JSON.stringify({
        id: groupId.value,
        states: { [channelKey]: state },
        type: "patch",
        uid: deviceId.value,
      }),
    );
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

function init() {
  if (!webSocket) {
    webSocket = new WebSocket(getSyncServer());

    addSyncMethod({
      init(
        channelKey: string,
        onUpdate: (data: Partial<State>) => void,
        state: State,
      ) {
        function onMessage(event: MessageEvent) {
          const { states, uid } = JSON.parse(event.data) as SendState;
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
        webSocket.addEventListener("message", onMessage);
        webSocket.addEventListener("open", () => onOpen(channelKey, filteredState));
        webSocket.addEventListener("close", onClose);

        return (state: State) => {
          if (isPresenter.value) {
            const filteredState = getFilteredState(channelKey, state);
            const stateDiff = diff(filteredState, stateCopy.value as object);
            stateCopy.value = { ...filteredState } as UnwrapRef<Partial<State>>;
            if (Object.keys(stateDiff).length > 0) {
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
  } else {
    console.log("Commented onOpen call");
    // onOpen();
  }
}

export function connect() {
  autoConnect.value = new Date().toISOString();
  init();
}

// export function patch(id: string, result: Result | null) {
//   if (connectState.value === Status.CONNECTED) {
//     webSocket.send(
//       JSON.stringify({
//         id: groupId.value,
//         pollId: id,
//         result,
//         type: "answer",
//         userId: deviceId.value,
//       }),
//     );
//   }
// }

// export function replace(id: string, result: Result | null) {
//   if (connectState.value === Status.CONNECTED) {
//     webSocket.send(
//       JSON.stringify({
//         id: groupId.value,
//         pollId: id,
//         result,
//         type: "answer",
//         userId: deviceId.value,
//       }),
//     );
//   }
// }

// export function reset() {
//   if (connectState.value === Status.CONNECTED) {
//     webSocket.send(
//       JSON.stringify({
//         id: groupId.value,
//         type: "reset",
//       }),
//     );
//   }
// }
