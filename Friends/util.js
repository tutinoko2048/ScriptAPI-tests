// @ts-check

import { world, system, Player } from '@minecraft/server';
import * as UI from '@minecraft/server-ui';

const dimension = world.getDimension('overworld');

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
      if (canceled && reason === UI.FormCancelationReason.userBusy) return system.run(run);
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
    .button1(yes)
    .button2(no);
  const { selection, canceled } = await form.show(player);
  if (canceled) return defaultValue;
  return selection === 1;
}

export function getPlayerById(id) {
  return world.getAllPlayers().find(p => p.id === id);
}

export function randomValue(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/** @returns {Promise<void>} */
export function sleep(ticks) {
  return new Promise(res => system.runTimeout(res, ticks));
}