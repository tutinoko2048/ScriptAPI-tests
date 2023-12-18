import * as mc from '@minecraft/server';
import { MinecraftEnchantmentTypesUnion } from './scripts/EnchantMenu/lib/MinecraftEnchantmentTypes';
import { EnchantmentList } from './EnchantmentList';

declare module '@minecraft/server' {
  interface EnchantmentType {
    readonly id: MinecraftEnchantmentTypesUnion;
  }
}

export type EnchantmentTable = Record<number, EnchantmentList>
/*
  1: EnchantmentList;
  2: EnchantmentList;
  3: EnchantmentList;
}*/

export interface EnchantmentCache {
  [itemId: string]: EnchantmentTable;
}