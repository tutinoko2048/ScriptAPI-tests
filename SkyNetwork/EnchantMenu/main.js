// EnchantMenu v1 by RetoRuto9900K

import { EnchantmentTypes, Enchantment, EnchantmentList, ItemStack, Player } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';
import * as util from './util';
import { enchantCost, enchantAddRate, ignores, enchantLevelRate } from './enchant_config';
import { getEnchantLang, getLevelLang } from './enchant_lang';
import { MinecraftEnchantmentTypes } from './lib/MinecraftEnchantmentTypes';

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

/** @type {Map<string, import('./types').EnchantList>} */
const enchantListMap = new Map();

export class EnchantMenu {
  /** @arg {Player} player */
  constructor(player) {
    this.player = player;
    this.main().catch(e => console.error(e, e.stack));
  }
  
  async main(message = '') {
    const handItem = util.getHandItem(this.player);
    const enchants = getItemEnchants(handItem);
    if (!enchants) { // もうエンチャついてたら弾く
      this.player.sendMessage('§cそのアイテムにはエンチャントを付与できません');
      this.player.playSound(sounds.error);
      return;
    }
    this.player.playSound(sounds.open);
    const form = new ActionFormData();
    const body = [
      '§l現在のエンチャント§r',
      ...(enchants.length ? enchants.map(ench => `- %${getEnchantLang(ench.type.id)} ${getLevelLang(ench.level)}`) : ['§7なし§r']),
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
      if (res) clearEnchant(this.player);
      else await this.main();
    }
  }
  
  async selectLevel() {
    const item = util.getHandItem(this.player);
    if (!item) {
      this.player.sendMessage('§cそのアイテムにはエンチャントを付与できません');
      this.player.playSound(sounds.error);
      return;
    }
    const enchantSlot = item.getComponent('minecraft:enchantments')?.enchantments?.slot;
    if (enchantSlot === undefined || enchantSlot === 0) {
      this.player.sendMessage('§cそのアイテムにはエンチャントを付与できません');
      this.player.playSound(sounds.error);
      return;
    }
    
    let enchants = enchantListMap.get(`${this.player.id}+${enchantSlot}`); // get from cache
    if (!enchants) {
      enchants = createEnchantList(enchantSlot); // generate list
      enchantListMap.set(`${this.player.id}+${enchantSlot}`, createEnchantList(enchantSlot));
    }
    
    const lapis = util.getItemAmount(this.player, enchantCost.item); // get player's lapis
    /** @type {{ [level: number]: boolean }} */
    const canBuy = {};
    [1,2,3].forEach(lv => canBuy[lv] = checkCost(lapis, enchantCost[lv].amount, this.player.level, enchantCost[lv].level));
    
    /** @param {EnchantmentList} list */
    const getHint = (list) => {
      const ench = [...list][0];
      return ench ? `%${getEnchantLang(ench.type.id)} ${getLevelLang(ench.level)}` : '-';
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
      `§l${canBuy[lv] ? '§2' : '§c'}Lv.${lv}§8 ${getHint(enchants[lv])}...`,
      `textures/ui/dust_${canBuy[lv] ? '' : 'un'}selectable_${lv}`
    ));
    form.button('戻る', icons.back);
      
    const { canceled, selection } = await form.show(this.player);
    if (canceled) return;
    if ([0, 1, 2].includes(selection)) { // 0 or 1 or 2
      const lv = selection + 1;
      if (!this.buyEnchant(lv)) return this.player.playSound(sounds.error); // button[0] = lv1
      
      item.getComponent('minecraft:enchantments').enchantments = enchants[lv]; // apply enchants
      util.setHandItem(this.player, item); // apply item
      
      this.player.playSound(sounds.enchant);
      
      enchantListMap.set(`${this.player.id}+${enchantSlot}`, createEnchantList(enchantSlot)); //  generate list
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
    const itemAmount = util.getItemAmount(this.player, enchantCost.item); // get player's lapis
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
 * @arg {number} slot
 * @returns {import('./types').EnchantList}
 */
function createEnchantList(slot) {
  return {
    1: randomEnchants(new EnchantmentList(slot), 1),
    2: randomEnchants(new EnchantmentList(slot), 2),
    3: randomEnchants(new EnchantmentList(slot), 3)
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

  const enchant = new Enchantment(
    enchantType,
    getEnchantLevel(enchantType.maxLevel, lv)
  );
  enchantList.addEnchantment(enchant);
  
  // 確率でエンチャを追加
  if (util.random(1, 100) <= enchantAddRate[lv])
    randomEnchants(enchantList, lv, filterTypes(enchantList, filteredTypes, enchant.type.id));
  return enchantList;
}

/** @arg {Player} player */
function clearEnchant(player) {
  const item = util.getHandItem(player);
  
  const enchantment = item?.getComponent('minecraft:enchantments');
  if (!enchantment) {
    player.sendMessage('§c削除するエンチャントがありません');
    player.playSound(sounds.error);
    return;
  }
  
  if ([...enchantment.enchantments].length === 0) { /* 何もない時の処理 */ }
  
  enchantment.removeAllEnchantments();
  
  util.setHandItem(player, item);
  player.playSound(sounds.clear);
}

/**
 * @arg {ItemStack} item
 * @returns {?Enchantment[]}
 */
function getItemEnchants(item) {
  if (!item) return null;
  const list = item.getComponent('minecraft:enchantments')?.enchantments;
  if (!list || list.slot === 0) return null; // slotが無い=エンチャ不可
  return [...list];
}

/**
 * @arg {EnchantmentList} enchantList
 * @arg {MinecraftEnchantmentTypes[]} enchantTypes
 * @arg {string} [ignoreType]
 * @returns {MinecraftEnchantmentTypes[]}
 */
function filterTypes(enchantList, enchantTypes, ignoreType) {
  return enchantTypes.filter(type => (
    enchantList.canAddEnchantment(new Enchantment(type, 1)) &&
    type != ignoreType
  ));
}

function getEnchantLevel(maxLevel, lv) {
  const enchLevel = Math.round(util.lot(enchantLevelRate[lv]) * maxLevel);
  return enchLevel === 0 ? 1 : enchLevel;
}

function checkCost(lapis, lapisNeeds, level, levelNeeds) {
  return lapis >= lapisNeeds && level >= levelNeeds;
}