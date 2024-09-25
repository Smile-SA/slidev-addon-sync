declare module "@slidev/types" {
  export interface SlidevConfig {
    syncSettings?: {
      autoConnect?: boolean | number;
      enabled?: boolean | 'dev' | 'build'
      server?: string;
    };
    syncStates?: string[] | Record<string, string[] | true>
    syncNoPresenter?: string[] | true
  }
}
