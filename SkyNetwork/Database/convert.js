// @ts-check

/*
db:convert-lore loreDBから移行
db:convert JaylyDBから移行
*/
import { Player, system, world } from "@minecraft/server";
import { db } from "./index";
import { ActionFormData } from "@minecraft/server-ui";
import { JaylyDB } from "./lib/JaylyDB";

system.afterEvents.scriptEventReceive.subscribe(async ev => {
  if (!(ev.sourceEntity instanceof Player)) return;
  const player = ev.sourceEntity;

  if (ev.id === 'db:convert') {
    const objectives = world.scoreboard.getObjectives().filter(obj => obj.id.startsWith('jaylydb:'));
    if (objectives.length === 0) return player.sendMessage('JaylyDBのobjectiveが見つかりません');
    const form = new ActionFormData();
    objectives.forEach(obj => form.button(obj.id));
    form.body(`${objectives.length} 個のtable`);
    const { selection, canceled } = await form.show(player);
    if (canceled) return;
    console.warn(objectives[selection].id);
    convertJaylyDB(objectives[selection]);
  }

  if (ev.id === 'db:convert-lore') {
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
      convertLoreDB(targetItem);
      player.sendMessage(`${targetItem.nameTag} を移行しました`);
    } catch (e) {
      player.sendMessage(`§c${e}`);
    }
  }
}, {
  namespaces: ['db']
});

/** @arg {import('@minecraft/server').ScoreboardObjective} objective */
function convertJaylyDB(objective) {
  const tableName = objective.id.replace('jaylydb:', '');
  const jaylydb = new JaylyDB(tableName);
  let keyCount = 0;
  const table = db.getTable(tableName);
  for (const [key, value] of jaylydb.entries()) {
    table.set(key, value);
    keyCount++;
  }
  console.warn(`[convertJaylyDB] objective: ${table.objectiveId} として ${keyCount} 個のキーを変換しました`);
}

/** @arg {import('@minecraft/server').ItemStack} item */
export function convertLoreDB(item) {
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
      console.warn(`[convertLoreDB] ${key} がobjectのためstringifyして保存しました (${stringified.length}/32767)`);
    } else {
      table.set(key, value);
    }
  }

  console.warn(`[convertLoreDB] objective: ${table.objectiveId} として ${table.size} 個のキーを変換しました`);
}
