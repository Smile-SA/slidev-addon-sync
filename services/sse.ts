import { States } from "../types";

import { getSyncServer } from "./helper.ts";
import { deviceId, groupId } from "./store.ts";

let eventSource: EventSource;
const url = getSyncServer();

export function init(
  onMessage: (states: States, uid: string) => void,
  onOpen: (open: (states?: States) => void) => void,
  onClose: () => void,
): (channelKey: string, state: unknown) => void {
  if (!eventSource) {
    eventSource = new EventSource(`${url}/event?uid=${deviceId.value}`);
    eventSource.addEventListener("error", onClose);
    eventSource.addEventListener("open", () =>
      onOpen((states?: States) => {
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
      }),
    );
  }

  eventSource.addEventListener("patch", (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    onMessage(data.states, data.uid);
  });
  eventSource.addEventListener("replace", (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    onMessage(data.states, data.uid);
  });

  return function patch(channelKey: string, state: unknown) {
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
  };
}
