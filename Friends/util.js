// @ts-check

import { world, system, Player } from '@minecraft/server';
import * as UI from '@minecraft/server-ui';

const dimension = world.getDimension('overworld');

/** @typedef {import('@minecraft/server').Entity} Entity */

/**
 * @arg {Entity|string} target
 * @arg {string} objective
 * @arg {boolean} [useZero]
 * @returns {number|null}
 */
export function getScore(target, objective, useZero) {
  try {
    return world.scoreboard.getObjective(objective).getScore(target);
  } catch {
    return useZero ? 0 : null;
  }
}

/**
 * @arg {Entity|string} target
 * @arg {string} objective
 * @arg {number} score setするスコア
 */
export function setScore(target, objective, score) {
  world.scoreboard.getObjective(objective).setScore(target, score);
}

/**
 * @arg {Entity|string} target
 * @arg {string} objective
 * @arg {number} score addするスコア
 * @returns {number} add後のスコア
 */
export function addScore(target, objective, score) {
  const newValue = getScore(target, objective, true) + score;
  setScore(target, objective, newValue);
  return newValue;
}


/**
 * @param {import('@minecraft/server').Vector3} loc
 * @returns {Promise<void>}
 */
export function worldLoad(loc) {
  return new Promise(r => {
    system.run(function check() {
      try {
        dimension.getBlock(loc).typeId;
        r();
      } catch {
        system.run(check);
      }
    })
  });
}

/**
 * @param {Player} player
 * @param {UI.ActionFormData|UI.ModalFormData|UI.MessageFormData} form
 * @returns {Promise<UI.ActionFormResponse|UI.ModalFormResponse|UI.MessageFormResponse>}
 */
export function forceShow(player, form) {
  return new Promise(res => {
    system.run(async function run() {
      const response = await form.show(player);
      const {canceled, cancelationReason: reason} = response;
      if (canceled && reason === UI.FormCancelationReason.UserBusy) return system.run(run);
      res(response);
    });
  });
}

/**
 * @param {Player} player
 * @returns {Promise<boolean>}
 */
export async function confirmForm(player, { title = '確認', body, yes = 'OK', no = '§lキャンセル', defaultValue = false }) {
  const form = new UI.MessageFormData();
  form.title(title)
    .body(body)
    .button1(no)
    .button2(yes);
  const { selection, canceled } = await form.show(player);
  if (canceled) return defaultValue;
  return selection === 1;
}

export function getPlayerById(id) {
  return world.getPlayers().find(p => p.id === id);
}

export function randomValue(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/** @returns {Promise<void>} */
export function sleep(ticks) {
  return new Promise(res => system.runTimeout(res, ticks));
}