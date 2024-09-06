import { EventType, States } from "../types";

import { getSyncServer } from "./helper.ts";
import { deviceId, groupId } from "./store.ts";

interface SendState {
  states: States;
  type: EventType;
  uid: string;
}

let webSocket: WebSocket;
const url = getSyncServer();

export function init(
  onMessage: (states: States, uid: string) => void,
  onOpen: (open: (states?: States) => void) => void,
  onClose: () => void,
): (channelKey: string, state: unknown) => void {
  if (!webSocket) {
    webSocket = new WebSocket(url);
    webSocket.addEventListener("close", onClose);
    webSocket.addEventListener("open", () =>
      onOpen((states?: States) => {
        webSocket.send(
          JSON.stringify({
            id: groupId.value,
            states,
            type: "connect",
            uid: deviceId.value,
          }),
        );
      }),
    );
  }

  webSocket.addEventListener("message", (event: MessageEvent) => {
    const { states, uid } = JSON.parse(event.data) as SendState;
    onMessage(states, uid);
  });

  return function patch(channelKey: string, state: unknown) {
    webSocket.send(
      JSON.stringify({
        id: groupId.value,
        states: { [channelKey]: state },
        type: "patch",
        uid: deviceId.value,
      }),
    );
  };
}
