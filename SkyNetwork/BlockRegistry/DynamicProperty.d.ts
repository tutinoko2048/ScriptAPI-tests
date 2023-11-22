import '@minecraft/server';

type PlaceKey = `registry:place${number}`;

declare module '@minecraft/server' {
  interface World {
    getDynamicProperty(key: PlaceKey): string;
    setDynamicProperty(key: PlaceKey, value: string): void;
  }
}
