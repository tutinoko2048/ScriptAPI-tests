import { LocationInUnloadedChunkError, system, world } from '@minecraft/server';
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

system.afterEvents.scriptEventReceive.subscribe(ev => {
  const { id } = ev;
  if (id === "bw:map_RESET") {
    /*
    db.set('winner', 'first', '')
    db.set('winner', 'second', '')
    db.set('winner', 'third', '')
    db.set('winner', 'fourth', '')
    redout = false;
    blueout = false;
    yellowout = false;
    limeout = false;
    */
    resetMap();
  }
});

function resetMap() {
  const queue = BlockPlaceRegistry.get();
  const intervalId = system.runInterval(() => {
    if (queue.length === 0) {
      system.clearRun(intervalId);
      BlockPlaceRegistry.reset();
      setScore('cleaning', 'game', 0);
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
  }, 2);
}