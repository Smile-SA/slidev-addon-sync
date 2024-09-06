declare module "@slidev/types" {
  export interface SlidevConfig {
    syncSettings?: {
      autoConnect?: boolean | number;
      server?: string;
    };
  }
}
