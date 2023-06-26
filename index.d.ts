import * as MC from '@minecraft/server';

interface EntityComponents {
  'minecraft:inventory': MC.EntityInventoryComponent;
}

interface BlockComponents {
  'minecraft:inventory': MC.BlockInventoryComponent;
}

declare module '@minecraft/server' {
  interface Entity {
    getComponent<ID extends keyof EntityComponents>(componentId: ID): EntityComponents[ID];
  }

  interface Block {
    getComponent<ID extends keyof BlockComponents>(componentId: ID): BlockComponents[ID];
  }
}
