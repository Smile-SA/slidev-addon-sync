import { configs } from "@slidev/client";

import { Server } from "../types";

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

export async function connect() {
  await promise;
  server.connect?.();
}

// export async function patch(id: string, states: States) {
//   const poll = pollState[id];
//   if (poll && result !== null) {
//     pollState[id].results[deviceId.value] = result;
//     await promise;
//     await connectedPromise;
//     server.patch?.(id, states);
//   }
// }

// export async function replace(id: string, states: States) {
//   const poll = pollState[id];
//   if (poll && result !== null) {
//     pollState[id].results[deviceId.value] = result;
//     await promise;
//     await connectedPromise;
//     server.replace?.(id, states);
//   }
// }

// export async function reset(id: string) {
//   pollState[id].results = {};
//   pollState[id].status = PollStatus.CLEAR;
//   await promise;
//   await connectedPromise;
//   server.reset?.(id);
// }
