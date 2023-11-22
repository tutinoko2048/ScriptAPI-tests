import { LocationInUnloadedChunkError, system, world, Direction, Vector } from '@minecraft/server';
import { BlockPlaceRegistry } from './BlockPlaceRegistry';
const Permissions = {
  has(...args) {return true;}
}
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

// native classはJSON.stringifyできないからオブジェクトに変換
const vec3 = ({ x, y, z }) => ({ x, y, z });

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
  const placedLocation = Vector.add(ev.block.location, directionToRelative[ev.blockFace]);
  
  BlockPlaceRegistry.put(vec3(placedLocation));
});

system.afterEvents.scriptEventReceive.subscribe(ev => {
  const { id } = ev;
  if (id === "bw:map_RESET") {
    resetMap();
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

    /** @type {import('@minecraft/server').Block} */
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