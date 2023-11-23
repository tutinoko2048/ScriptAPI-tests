// いい感じに組み込むなりファイル分けするなりしてください

import { LocationInUnloadedChunkError, system, world, Direction, Vector } from '@minecraft/server';
import { BlockPlaceRegistry } from './BlockPlaceRegistry'; // BlockRegistryフォルダからインポート



// エラー回避用の仮変数だから消してね
const Permissions = { has(...args) {return true;} }
const dimension = world.getDimension('overworld');
const setScore = (...args) => {}




world.afterEvents.playerPlaceBlock.subscribe(ev => {
  const { player, block } = ev;
  if (!Permissions.has(player, 'admin') && !player.hasTag("destroy") ||  Permissions.has(player, 'admin') && player.hasTag("gameplayer1") || Permissions.has(player, 'admin') && player.hasTag("destroy")) {
    try {
      BlockPlaceRegistry.put(block.location);
    } catch (e) {
      player.sendMessage(`§cエラーが発生しました。以下のコードを管理者にお知らせください。\n${e}`);
      console.error(e, e.stack);
    }
  }
});

/** @type {Record<Direction, Vector>} */
const directionToRelative = {
  [Direction.Up]: Vector.up,
  [Direction.Down]: Vector.down,
  [Direction.West]: Vector.left,
  [Direction.East]: Vector.right,
  [Direction.North]: Vector.back,
  [Direction.South]: Vector.forward
}
  
const liquids = [
  'minecraft:lava_bucket',
  'minecraft:water_bucket'
];

world.afterEvents.itemUseOn.subscribe(ev => {
  if (!liquids.includes(ev.itemStack.typeId)) return;
  // 触ったブロックと触った面を元に置いた液体の座標を計算
  const { x, y, z } = Vector.add(ev.block.location, directionToRelative[ev.blockFace]);
  try {
      BlockPlaceRegistry.put({ x, y, z }); // native classはJSON.stringifyできないからオブジェクトに変換
  } catch (e) {
    ev.source.sendMessage(`§cエラーが発生しました。以下のコードを管理者にお知らせください。\n${e}`);
    console.error(e, e.stack);
  }
});




system.afterEvents.scriptEventReceive.subscribe(ev => {
  const { id } = ev;
  if (id === "bw:map_RESET") {
    // ...

    // ブロック巻き戻し関連は関数にまとめた
    resetMap();
  }

  // 確認用にこれも追加しておいてほしい
  if (id === "debug:log_place_registry_count") {
    const locations = BlockPlaceRegistry.get();
    console.warn(`[BlockPlaceRegistry] current blocks: ${locations.length}`);
  }
});

function resetMap() {
  const queue = BlockPlaceRegistry.get();
  const startAt = Date.now();
  console.warn(`[resetMap] start resetting ${queue.length} blocks.`);
  const intervalId = system.runInterval(() => {
    if (queue.length === 0) {
      system.clearRun(intervalId);
      BlockPlaceRegistry.reset();
      setScore('cleaning', 'game', 0);
      console.warn(`[resetMap] complete, took ${Math.round((Date.now() - startAt) / 1000)} seconds.`);
      return;
    }
    const location = queue.shift();

    /** @type {import('@minecraft/server').Block|undefined} */
    let block;
    try {
      block = dimension.getBlock(location);
    } catch (e) {
      if (!(e instanceof LocationInUnloadedChunkError)) throw e;
      console.error(`[resetMap] Unloaded location: ${location.x}, ${location.y}, ${location.z}`);
    }
    if (!block) return;
    if (block.type.canBeWaterlogged) block.isWaterlogged = false;
    block.setType('minecraft:sponge');
    block.setType('minecraft:air');
    setScore('cleaning', 'game', queue.length / 10);
  }, 1);
}