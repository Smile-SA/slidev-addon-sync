import { Resolve } from "./promise";
import { States } from "./state";

export enum Status {
  CONNECTED,
  DISCONNECTED,
  ERROR,
  IDLE,
}

export enum EventType {
  PATCH = "patch",
  REPLACE = "replace",
  RESET = "reset",
}

export type OnMessage = (states: States, uid: string) => void;
export type OnOpen = (open: (states?: States) => void) => void;
export type OnClose = () => void;
export type Patch = (channelKey: string, state: unknown) => void;

export interface Server {
  init: (
    onMessage: OnMessage,
    OnOpen: OnOpen,
    onClose: OnClose,
  ) => Patch;
}
