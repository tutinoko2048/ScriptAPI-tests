import * as MC from '@minecraft/server';

declare module '@minecraft/server' {
  interface Entity {
    getComponent(componentId: 'minecraft:inventory'): MC.EntityInventoryComponent;
  }

  interface Block {
    getComponent(componentId: 'minecraft:inventory'): MC.BlockInventoryComponent;
  }
}