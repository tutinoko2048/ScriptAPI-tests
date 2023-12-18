// EnchantMenu v1 by RetoRuto9900K

import { EnchantmentTypes, Player, ItemLockMode, ItemType } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';
import * as util from './util';
import { enchantCost, enchantAddRate, ignores, enchantLevelRate, customMaxLevels } from './enchant_config';
import { getEnchantLang, getLevelLang } from './enchant_lang';
import { MinecraftEnchantmentTypes } from './lib/MinecraftEnchantmentTypes';
import { EnchantmentList } from './EnchantmentList';

/** @typedef {import('@minecraft/server').Enchantment} Enchantment */

const getEnchantmentTypes = () => Object.values(MinecraftEnchantmentTypes).filter(id => !ignores.includes(id)).slice();
const sounds = {
  enchant: 'random.anvil_use',
  clear: 'block.stonecutter.use',
  open: 'block.enchanting_table.use',
  error: 'note.bass'
}

const icons = {
  add: 'textures/ui/color_plus',
  clear: 'textures/ui/icon_trash',
  select: 'textures/items/book_enchanted',
  back: 'textures/ui/icon_import'
}

/** @type {Map<string, import('./types').EnchantmentCache>} */
const enchantListCache = new Map();

export class EnchantMenu {
  /** @arg {Player} player */
  constructor(player) {
    this.player = player;
    this.slot = player.getComponent('minecraft:inventory').container.getSlot(player.selectedSlot);
    this.item = this.slot.getItem(); // cache item

    const previousLockMode = this.slot.lockMode;
    this.main()
      .catch(e => console.error(e, e.stack))
      .finally(() => { // form閉じた時
        if (!this.item) return;
        this.slot.setItem(this.item);
        this.slot.lockMode = previousLockMode;
      });
  }
  
  /** @returns {Promise<void>} */
  async main(message = '') {
    const enchantable = this.item?.getComponent('minecraft:enchantable');
    if (!enchantable) {
      this.player.sendMessage('§cそのアイテムにはエンチャントを付与できません');
      this.player.playSound(sounds.error);
      return;
    }
    this.player.playSound(sounds.open);
    const enchants = enchantable.getEnchantments();

    this.slot.lockMode = ItemLockMode.slot; // form開いてる間は触れないように

    const form = new ActionFormData();
    const body = [
      '§l現在のエンチャント§r',
      ...(enchants.length ? enchants.map(ench => `- %${getEnchantLang(ench.type)} ${getLevelLang(ench.level)}`) : ['§7なし§r']),
      ' '
    ].join('\n');
    form.title('Enchantment Menu')
      .body(message + body)
      .button('エンチャントを付与する', icons.add)
      .button('エンチャントを削除する', icons.clear);
    
    const { selection, canceled } = await form.show(this.player);
    if (canceled) return;
    if (selection === 0) return await this.selectLevel();
    if (selection === 1) {
      const res = await util.confirmForm(this.player, { body: '本当にエンチャントを削除しますか？' });
      if (res) {
        enchantable.removeAllEnchantments();
        this.player.playSound(sounds.clear);

      } else await this.main();
    }
  }
  
  async selectLevel() {
    const enchantable = this.item.getComponent('minecraft:enchantable');
    if (!enchantable) {
      this.player.sendMessage('§cそのアイテムにはエンチャントを付与できません');
      this.player.playSound(sounds.error);
      return;
    }
    
    if (!enchantListCache.has(this.player.id)) enchantListCache.set(this.player.id, {});
    const cache = enchantListCache.get(this.player.id);
    if (!(this.item.typeId in cache)) cache[this.item.typeId] = createEnchantmentTable(this.item.type);
    const table = cache[this.item.typeId]; // get from cache
    
    const lapis = util.getItemAmount(this.player, enchantCost.item);
    /** @type {{ [level: number]: boolean }} */
    const canBuy = {};
    [1,2,3].forEach(lv => canBuy[lv] = checkCost(lapis, enchantCost[lv].amount, this.player.level, enchantCost[lv].level));
    
    /** @param {EnchantmentList} list */
    const getHint = (list) => {
      const ench = list.getEnchantments()[0];
      return ench ? `%${getEnchantLang(ench.type)} ${getLevelLang(ench.level)}` : '-';
    }
    
    const form = new ActionFormData();
    form.title('Enchantment Menu')
    form.body([
      '§lエンチャントレベルを選択してください§r\n',
      ...[1,2,3].map(lv => `Lv.${lv}: §bLapis§r x${enchantCost[lv].amount}, §aLevel§r x${enchantCost[lv].level}`),
      
      /* for debug
      [...enchants[1]].map(ench => `%${getEnchantLang(ench.type)} ${ench.level}`).join(', '),
      [...enchants[2]].map(ench => `%${getEnchantLang(ench.type)} ${ench.level}`).join(', '),
      [...enchants[3]].map(ench => `%${getEnchantLang(ench.type)} ${ench.level}`).join(', '),
      */
    ].join('\n'));
    [1,2,3].forEach(lv => form.button(
      `§l${canBuy[lv] ? '§2' : '§c'}Lv.${lv}§8 ${getHint(table[lv])}...`,
      `textures/ui/dust_${canBuy[lv] ? '' : 'un'}selectable_${lv}`
    ));
    form.button('戻る', icons.back);
      
    const { canceled, selection } = await form.show(this.player);
    if (canceled) return;
    if ([0, 1, 2].includes(selection)) {
      const lv = selection + 1;
      if (!this.buyEnchant(lv)) return this.player.playSound(sounds.error);

      enchantable.removeAllEnchantments(); // clear enchants
      enchantable.addEnchantments(table[lv].getEnchantments()); // apply
      this.player.playSound(sounds.enchant);

      // regenerate enchants
      cache[this.item.typeId] = createEnchantmentTable(this.item.type);
    }
    if (selection === 3) return await this.main();
  }
  
  /** @arg {number} lv */
  buyEnchant(lv) { // true: success, false: error
    const cost = enchantCost[lv];
    if (this.player.level < cost.level) {
     this.player.sendMessage(`§cレベルが足りません ${this.player.level} < ${cost.level}`);
     return false;
    }
    const itemAmount = util.getItemAmount(this.player, enchantCost.item);
    if (itemAmount < cost.amount) {
      this.player.sendMessage(`§cアイテムが足りません (%item.dye.blue.name が ${cost.amount}個必要です)`);
      return false;
    }
    this.player.runCommand(`clear @s[hasitem={item=${enchantCost.item},quantity=${cost.amount}..}] ${enchantCost.item} 0 ${cost.amount}`);
    this.player.addLevels(-cost.level);
    return true;
  }
}

/**
 * @arg {ItemType} itemType
 * @returns {import('./types').EnchantmentTable}
 */
function createEnchantmentTable(itemType) {
  return {
    1: randomEnchants(new EnchantmentList(itemType), 1),
    2: randomEnchants(new EnchantmentList(itemType), 2),
    3: randomEnchants(new EnchantmentList(itemType), 3)
  }
}

/** 
 * @arg {EnchantmentList} enchantList 
 * @arg {number} lv
 * @arg {MinecraftEnchantmentTypes[]} [enchantTypes]
 */
export function randomEnchants(enchantList, lv, enchantTypes = getEnchantmentTypes()) {
  const filteredTypes = filterTypes(enchantList, enchantTypes);
  // idをランダムに取得+Typeに変換
  const enchantId = util.getRandomValue(filteredTypes);
  const enchantType = enchantId && EnchantmentTypes.get(enchantId);
  if (!enchantType) return enchantList;

  const enchant = {
    type: enchantType,
    level: calcEnchantLevel(customMaxLevels[enchantType.id] ?? enchantType.maxLevel, lv)
  }
  enchantList.addEnchantment(enchant);
  
  // 確率でエンチャを追加
  if (util.random(1, 100) <= enchantAddRate[lv])
    randomEnchants(enchantList, lv, filterTypes(enchantList, filteredTypes, enchant.type.id));
  return enchantList;
}

/**
 * @arg {EnchantmentList} enchantList
 * @arg {MinecraftEnchantmentTypes[]} enchantTypes
 * @arg {string} [ignoredType]
 * @returns {MinecraftEnchantmentTypes[]}
 */
function filterTypes(enchantList, enchantTypes, ignoredType) {
  return enchantTypes.filter(type => (
    enchantList.canAddEnchantment({ type, level: 1 }) &&
    type !== ignoredType
  ));
}

function calcEnchantLevel(maxLevel, lv) {
  const enchLevel = Math.round(util.lot(enchantLevelRate[lv]) * maxLevel);
  return enchLevel === 0 ? 1 : enchLevel;
}

function checkCost(lapis, lapisNeeded, level, levelNeeded) {
  return lapis >= lapisNeeded && level >= levelNeeded;
}