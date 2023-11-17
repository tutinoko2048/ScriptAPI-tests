import { world, Player, Entity } from '@minecraft/server';

/**
 * @param {Player|string} player
 * @param {boolean} [isId]
 * @returns {string}
 */
export function rankicon(player, isId) {
  player;
  isId;
  return ( 'ω');
}

/**
 * @param {Entity|string} target 
 * @param {string} objective 
 * @param {boolean} [useZero] 
 * @returns {number|undefined}
 */
export function getScore(target, objective, useZero) {
  try {
    return world.scoreboard.getObjective(objective).getScore(target);
  } catch {
    return useZero ? 0 : undefined;
  }
}