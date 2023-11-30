import * as mc from '@minecraft/server';
declare module '@minecraft/server' {
  interface ItemStack {
    getComponent(componentId: 'minecraft:enchantments'): mc.ItemEnchantsComponent;
  }

  interface Entity {
    getComponent(componentId: 'minecraft:inventory'): mc.EntityInventoryComponent;
  }

  interface EnchantmentType {
    readonly id: import('./scripts/EnchantMenu/lib/MinecraftEnchantmentTypes').MinecraftEnchantmentTypesUnion;
  }
}

export interface EnchantList {
  1: mc.EnchantmentList;
  2: mc.EnchantmentList;
  3: mc.EnchantmentList;
}