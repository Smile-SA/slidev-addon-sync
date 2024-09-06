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

export type Connect = () => void;
export type Patch = (id: string, states: States) => void;
export type Replace = (id: string, states: States) => void;
export type Reset = (id: string) => void;

export interface Server {
  connect: Connect;
}
