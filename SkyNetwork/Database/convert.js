// @ts-check
import { db } from "./index";

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

  console.warn(`[convertData] objective: ${table.objective.id} として ${table.size} 個のキーを変換しました`);
}
