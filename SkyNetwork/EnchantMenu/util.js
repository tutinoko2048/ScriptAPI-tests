import { Player } from '@minecraft/server';
import * as UI from '@minecraft/server-ui';

/** @arg {Player} player */
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

/**
 * @param {import('@minecraft/server').Player} player
 * @returns {import('@minecraft/server').ItemStack|undefined}
 */
export function getHandItem(player)  {
  const { container } = player.getComponent('minecraft:inventory');
  return container.getItem(player.selectedSlot);
}

/**
 * @param {import('@minecraft/server').Player} player
 * @param {import('@minecraft/server').ItemStack} [item]
 */
export function setHandItem(player, item)  {
  const { container } = player.getComponent('minecraft:inventory');
  return container.setItem(player.selectedSlot, item);
}

export function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function getRandomValue(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/** @arg {{ [key: number]: number }} data */
export function lot(data) {
  const rand = Math.floor(Math.random() * 100);
  let result = 0;
  let rate = 0;
  for (const prop in data) {
    rate += data[prop]
    if (rand <= rate) {
      result = Number(prop);
      break;
    }
  }
  return result;
}

/** @arg {Player} player */
export function getItemAmount(player, id) {
  let count = 0;
  const { container } = player.getComponent('minecraft:inventory'); // get inventory
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item?.typeId === id) count += item.amount;
  }
  return count;
}