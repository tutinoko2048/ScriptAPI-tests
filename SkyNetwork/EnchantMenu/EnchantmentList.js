import { ItemType, ItemStack } from '@minecraft/server';

/** @typedef {import('@minecraft/server').Enchantment} Enchantment */

export class EnchantmentList {
  /** @type {Record<string, number>} */
  #enchantments;

  /** @type {ItemStack} */
  #itemStack;

  /** @param {ItemType} itemType */
  constructor(itemType) {
    this.#enchantments = {}
    this.#itemStack = new ItemStack(itemType);
  }

  getEnchantments() {
    return this.#itemStack.getComponent('enchantable').getEnchantments();
  }

  addEnchantment(enchantment) {
    return this.#itemStack.getComponent('enchantable').addEnchantment(enchantment);
  }

  canAddEnchantment(enchantment) {
    return this.#itemStack.getComponent('enchantable').canAddEnchantment(enchantment);
  }
}