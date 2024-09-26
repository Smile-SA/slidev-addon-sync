export interface StateConfig {
  keys: string[] | true
  presenter: boolean
  init: boolean
}

export type SyncState = string[] | true | Partial<StateConfig>

declare module "@slidev/types" {
  export interface SlidevConfig {
    syncSettings?: {
      autoConnect?: boolean | number;
      enabled?: boolean | 'dev' | 'build'
      server?: string;
    };
    syncStates?: string[] | Record<string, SyncState>
  }
}
