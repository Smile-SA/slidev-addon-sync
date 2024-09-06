import { OnClose, OnOpen, States } from "../types";

import { getSyncServer } from "./helper.ts";
import { deviceId, groupId, onMessages } from "./store.ts";

let eventSource: EventSource;
const url = getSyncServer();

export function init(onOpen: OnOpen, onClose: OnClose) {
  if (!eventSource) {
    eventSource = new EventSource(`${url}/event?uid=${deviceId.value}`);
    eventSource.addEventListener("error", onClose);
    eventSource.addEventListener("open", onOpen);
    const messageListener = (event: MessageEvent) => {
      const { states, uid } = JSON.parse(event.data);
      onMessages.value.forEach(onMessage => onMessage(states, uid));
    }
    eventSource.addEventListener("patch", messageListener);
    eventSource.addEventListener("replace", messageListener);
  } else {
    onOpen();
  }
}

export function open(states?: States) {
  if (eventSource) {
    fetch(`${url}/connect?uid=${deviceId.value}`, {
      body: JSON.stringify({
        id: groupId.value,
        states,
      }),
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
    });
  }
}

export function patch(channelKey: string, state: unknown) {
  if (eventSource) {
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
