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
world.afterEvents.playerInteractWithBlock.subscribe(ev => {
  const { block, itemStack, player, blockFace } = ev;
  if (!liquids.includes(itemStack?.typeId)) return;
  // 触ったブロックと触った面を元に置いた液体の座標を計算
  const { x, y, z } = Vector.add(block.location, directionToRelative[blockFace]);
  try {
    BlockPlaceRegistry.put({ x, y, z }); // native classはJSON.stringifyできないからオブジェクトに変換
  } catch (e) {
    player.sendMessage(`§cエラーが発生しました。以下のコードを管理者にお知らせください。\n${e}`);
    console.error(e, e.stack);
  }
});

world.beforeEvents.playerInteractWithBlock.subscribe(ev => {
  const { block, itemStack, blockFace, player } = ev;
  if (itemStack?.typeId !== 'minecraft:water_bucket') return;
  
  if (block.type.canBeWaterlogged && !block.isWaterlogged) {
    ev.cancel = true;
    player.sendMessage('§o§7このブロックに対してバケツを使用することはできません');
    return;
  }
  
  const faceBlock = block.dimension.getBlock(
    Vector.add(block.location, directionToRelative[blockFace])
  );
  if (!faceBlock.isAir && faceBlock.type.canBeWaterlogged && !faceBlock.isWaterlogged) {
    ev.cancel = true;
    player.sendMessage('§o§7このブロックに対してバケツを使用することはできません');
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
  if (id === "debug:place_registry_count") {
    const locations = BlockPlaceRegistry.get();
    console.warn(`[BlockPlaceRegistry] current blocks: ${locations.length}`);
  }
});


function resetMap() {
  const loopIntervalTicks = 0;
  const breakCountPerLoop = 4;
  
  const queue = BlockPlaceRegistry.get();
  const startAt = Date.now();
  console.warn(`[resetMap] start resetting ${queue.length} blocks.`);
  const intervalId = system.runInterval(() => {
    if (queue.length === 0) {
      system.clearRun(intervalId);
      BlockPlaceRegistry.reset();
      console.warn(`[resetMap] complete, took ${Math.round((Date.now() - startAt) / 1000)} seconds.`);
      return;
    }
    
    for (let i = 0; i < breakCountPerLoop; i++) {
      const location = queue.shift();

      /** @type {import('@minecraft/server').Block} */
      let block;
      try {
        block = dimension.getBlock(location);
      } catch (e) {
        if (!(e instanceof LocationInUnloadedChunkError)) console.error(e, e.stack)
        console.error(`[resetMap] Unloaded location: ${location.x}, ${location.y}, ${location.z}`);
      }
      if (!block) continue;
      if (block.type.canBeWaterlogged) block.isWaterlogged = false;
      block.setType('minecraft:sponge');
      block.setType('minecraft:air');
      
      if (queue.length === 0) break;
    }
    
    setScore('cleaning', 'game', queue.length / 10);
    
  }, loopIntervalTicks);
}



