// @ts-check
import { Player, system } from "@minecraft/server";
import { db } from "./index";
import { ActionFormData } from "@minecraft/server-ui";

system.afterEvents.scriptEventReceive.subscribe(async ev => {
  if (ev.id === 'db:convert' && ev.sourceEntity instanceof Player) {
    const player = ev.sourceEntity;
    const block = player.getBlockFromViewDirection()?.block;
    if (block?.typeId !== 'minecraft:chest') return player.sendMessage('移行するチェストを視点先に置いてください')
    const { container } = block.getComponent('minecraft:inventory');
    const items = [];
    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);
      if (!item || !item.nameTag) continue;
      items.push(item);
    }
    if (items.length === 0) return player.sendMessage('移行するアイテムがありません');
    const form = new ActionFormData();
    items.forEach(item => form.button(item.nameTag));
    form.body(`${items.length} 個のtable`);
    const { selection, canceled } = await form.show(player);
    if (canceled) return;
    const targetItem = items[selection];
    console.warn(targetItem.nameTag);
    try {
      convertData(targetItem);
      player.sendMessage(`${targetItem.nameTag} を移行しました`);
    } catch (e) {
      player.sendMessage(`§c${e}`);
    }
  }
}, {
  namespaces: ['db']
});

/** @arg {import('@minecraft/server').ItemStack} item */
export function convertData(item) {
  const tableName = item.nameTag;
  if (!tableName) throw new Error('tableName(nameTag)がありません')
  const rawData = item.getLore()[0];
  if (!rawData) throw new Error('loreに何も入っていません');
  let data;
  try {
    data = JSON.parse(rawData);
  } catch {
    throw new Error('JSONのパースに失敗しました');
  }

  const table = db.getTable(tableName);
  table.clear();
  for (const key in data) {
    const value = data[key];
    if (typeof value === 'object') {
      const stringified = JSON.stringify(value);
      table.set(key, stringified);
      console.warn(`[convertData] ${key} がobjectのためstringifyして保存しました (${stringified.length}/32767)`);
    } else {
      table.set(key, value);
    }
  }

  console.warn(`[convertData] objective: ${table.objectiveId} として ${table.size} 個のキーを変換しました`);
}
