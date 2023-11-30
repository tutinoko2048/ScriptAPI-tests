import { MinecraftEnchantmentTypes, MinecraftEnchantmentTypes as Types } from './lib/MinecraftEnchantmentTypes';

export const enchantLang = {
  [Types.Power]: 'enchantment.arrowDamage',
  [Types.Flame]: 'enchantment.arrowFire',
  [Types.Infinity]: 'enchantment.arrowInfinite',
  [Types.Punch]: 'enchantment.arrowKnockback',
  [Types.Multishot]: 'enchantment.crossbowMultishot',
  [Types.Piercing]: 'enchantment.crossbowPiercing',
  [Types.QuickCharge]: 'enchantment.crossbowQuickCharge',
  [Types.Binding]: 'enchantment.curse.binding',
  [Types.Vanishing]: 'enchantment.curse.vanishing',
  [Types.Sharpness]: 'enchantment.damage.all',
  [Types.BaneOfArthropods]: 'enchantment.damage.arthropods',
  [Types.Smite]: 'enchantment.damage.undead',
  [Types.Efficiency]: 'enchantment.digging',
  [Types.Unbreaking]: 'enchantment.durability',
  [Types.FireAspect]: 'enchantment.fire',
  [Types.Lure]: 'enchantment.fishingSpeed',
  [Types.FrostWalker]: 'enchantment.frostwalker',
  [Types.Knockback]: 'enchantment.knockback',
  [Types.Looting]: 'enchantment.lootBonus',
  [Types.Fortune]: 'enchantment.lootBonusDigger',
  [Types.LuckOfTheSea]: 'enchantment.lootBonusFishing',
  [Types.Mending]: 'enchantment.mending',
  [Types.Respiration]: 'enchantment.oxygen',
  [Types.Protection]: 'enchantment.protect.all',
  [Types.BlastProtection]: 'enchantment.protect.explosion',
  [Types.FeatherFalling]: 'enchantment.protect.fall',
  [Types.FireProtection]: 'enchantment.protect.fire',
  [Types.ProjectileProtection]: 'enchantment.protect.projectile',
  [Types.SoulSpeed]: 'enchantment.soul_speed',
  [Types.SwiftSneak]: 'enchantment.swift_sneak',
  [Types.Thorns]: 'enchantment.thorns',
  [Types.SilkTouch]: 'enchantment.untouching',
  [Types.DepthStrider]: 'enchantment.waterWalker',
  [Types.AquaAffinity]: 'enchantment.waterWorker',
  [Types.Channeling]: 'enchantment.tridentChanneling',
  [Types.Loyalty]: 'enchantment.tridentLoyalty',
  [Types.Riptide]: 'enchantment.tridentRiptide',
  [Types.Impaling]: 'enchantment.tridentImpaling',
}

export const enchantLevels = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'Ⅶ',
  8: 'Ⅷ',
  9: 'Ⅸ',
  10: 'X',
}

/** @arg {string} enchantType */
export const getEnchantLang = (enchantType) => enchantLang[enchantType] ?? enchantType;

/** @arg {number} level */
export const getLevelLang = (level) => (1 <= level && level <= 10) ? enchantLevels[level] : level;