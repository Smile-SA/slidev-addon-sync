import type { UnwrapRef } from "vue";

import { ref, toRaw } from "vue";
import { addSyncMethod } from "@slidev/client";
import { diff } from "deep-object-diff";

import { State, Status } from "../types";

import { getSyncServer } from "./helper.ts";
import {
  autoConnect,
  connectState,
  deviceId,
  groupId,
  isPresenter,
} from "./store.ts";

let eventSource: EventSource;
const url = getSyncServer();

// function onPollMessage(event) {
//   const data = JSON.parse(event.data) as PollState;
//   Object.entries(data).forEach(([key, value]) => (pollState[key] = value));
// }

// function onUserMessage(event) {
//   const data = JSON.parse(event.data) as UserState;
//   Object.entries(data).forEach(([key, value]) => (userState[key] = value));
// }

const states: Record<string, object> = {};
const timeout = ref<NodeJS.Timeout>();
function onOpen(channelKey: string, state: State) {
  states[channelKey] = state;
  clearTimeout(timeout.value);
  timeout.value = setTimeout(() => {
    if (groupId.value) {
      fetch(`${url}/connect?uid=${deviceId.value}`, {
        body: JSON.stringify({
          id: groupId.value,
          states: isPresenter.value ? { [channelKey]: state } : undefined,
        }),
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      });
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
    fetch(`${url}/patch?uid=${deviceId.value}`, {
      body: JSON.stringify({
        id: groupId.value,
        states: { [channelKey]: state },
      }),
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });
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
  if (!eventSource) {
    eventSource = new EventSource(`${url}/event?uid=${deviceId.value}`);

    addSyncMethod({
      init(
        channelKey: string,
        onUpdate: (data: Partial<State>) => void,
        state: State,
      ) {
        function onMessage(event: MessageEvent) {
          const data = JSON.parse(event.data);
          if (data.states && channelKey in data.states) {
            const filteredState = getFilteredState(channelKey, state);
            const stateDiff = diff(
              filteredState,
              data.states[channelKey],
            ) as Partial<State>;
            if (
              Object.keys(stateDiff).length > 0 &&
              data.uid !== deviceId.value
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
        eventSource.addEventListener("error", onClose);
        eventSource.addEventListener("open", () => onOpen(channelKey, filteredState));
        eventSource.addEventListener("patch", onMessage);
        eventSource.addEventListener("replace", onMessage);

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
//     fetch(`${url}/answer?uid=${deviceId.value}`, {
//       body: JSON.stringify({
//         id: groupId.value,
//         pollId: id,
//         result,
//         userId: deviceId.value,
//       }),
//       method: "POST",
//       headers: {
//         "content-type": "application/json",
//       },
//     });
//   }
// }

// export function replace(id: string, result: Result | null) {
//   if (connectState.value === Status.CONNECTED) {
//     fetch(`${url}/answer?uid=${deviceId.value}`, {
//       body: JSON.stringify({
//         id: groupId.value,
//         pollId: id,
//         result,
//         userId: deviceId.value,
//       }),
//       method: "POST",
//       headers: {
//         "content-type": "application/json",
//       },
//     });
//   }
// }

// export function reset() {
//   if (connectState.value === Status.CONNECTED) {
//     fetch(`${url}/reset?uid=${deviceId.value}`, {
//       body: JSON.stringify({
//         id: groupId.value,
//       }),
//       method: "POST",
//       headers: {
//         "content-type": "application/json",
//       },
//     });
//   }
// }
