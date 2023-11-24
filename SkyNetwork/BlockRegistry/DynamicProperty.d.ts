import '@minecraft/server';

type PlaceKey = `registry:place${number}`;
type IndexKey = `registry:index_place`;

declare module '@minecraft/server' {
  interface World {
    getDynamicProperty(key: PlaceKey): string;
    getDynamicProperty(key: IndexKey): number;

    setDynamicProperty(key: PlaceKey, value: string): void;
    setDynamicProperty(key: IndexKey, value: number): void;  
  }
}
