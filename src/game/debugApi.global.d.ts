import type { MayatnikDebugSnapshot } from './debugApi';

declare global {
  interface Window {
    __mayatnik?: {
      snapshot: () => MayatnikDebugSnapshot;
      swing: (direction: -1 | 1) => void;
      restart: () => void;
    };
  }
}

export {};
