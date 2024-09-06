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
export type OnOpen = () => void;
export type OnClose = () => void;

export type Init = (OnOpen: OnOpen, onClose: OnClose) => void;
export type Open = (states?: States) => void;
export type Patch = (channelKey: string, state: unknown) => void;

export interface Server {
  init: Init;
  open: Open;
  patch: Patch;
}
