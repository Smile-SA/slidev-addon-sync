import { EventType, OnClose, OnOpen, States } from "../types";

import { getSyncServer } from "./helper.ts";
import { deviceId, groupId, onMessages } from "./store.ts";

interface SendState {
  states: States;
  type: EventType;
  uid: string;
}

let webSocket: WebSocket;
const url = getSyncServer();

export function init(onOpen: OnOpen, onClose: OnClose) {
  if (!webSocket) {
    webSocket = new WebSocket(url);
    webSocket.addEventListener("close", onClose);
    webSocket.addEventListener("open", onOpen);
    const messageListener = (event: MessageEvent) => {
      const { states, uid } = JSON.parse(event.data) as SendState;
      onMessages.value.forEach(onMessage => onMessage(states, uid));
    }
    webSocket.addEventListener("message", messageListener);
  } else {
    onOpen();
  }
}

export function open(states?: States) {
  if (webSocket) {
    webSocket.send(
      JSON.stringify({
        id: groupId.value,
        states,
        type: "connect",
        uid: deviceId.value,
      }),
    );
  }
}

export function patch(channelKey: string, state: unknown) {
  if (webSocket) {
    webSocket.send(
      JSON.stringify({
        id: groupId.value,
        states: { [channelKey]: state },
        type: "patch",
        uid: deviceId.value,
      }),
    );
  }
};
