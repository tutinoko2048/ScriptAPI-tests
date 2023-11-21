import { system, world } from '@minecraft/server';

/** @typedef {import('@minecraft/server').Vector3} Vector3 */
/** @typedef {import('./DynamicProperty').PlaceKey} PlaceKey */

const PROPERTY_MAX_SIZE = 32760;

export class BlockPlaceRegistry {
  static _currentKeyIndex = 0;

  /** @type {Vector3[][]} */
  static _cache = [];

  /** @returns {Vector3[]} */
  static get() {
    const keys = world.getDynamicPropertyIds();
    /** @type {Vector3[]} */
    const result = [];
    for (const key of keys) {
      if (!key.startsWith('registry:place')) continue;
      const values = JSON.parse(
        world.getDynamicProperty(/** @type {PlaceKey} */ (key)) ?? '[]'
      );
      result.push(...values);
    }
    return result;
  }

  /** @param {Vector3} location */
  static put(location) { this.putMany(location) }

  /** @param {Vector3[]} locations */
  static putMany(...locations) {
    /** @type {Vector3[]} */
    const blocks = JSON.parse(world.getDynamicProperty(this._getCurrentKey()) ?? '[]');
    blocks.push(...locations);
    
    this._trySave(locations);
  }

  /** 
   * @param {Vector3[]} values
   * @param {Vector3[]} [swap]
   */
  static _trySave(values, swap = []) {
    let sizeCheck = true;

    const stringified = JSON.stringify(values);
    if (stringified.length > PROPERTY_MAX_SIZE) {
      sizeCheck = false;
    } else {
      try {
        world.setDynamicProperty(this._getCurrentKey(), stringified);
      } catch (e) {
        sizeCheck = false;
      }
    }
    
    if (!sizeCheck) {
      swap.push(values.shift());
      this._trySave(values, swap);
      this._currentKeyIndex++;
      this._trySave(swap);
    }
  }

  /** @returns {import('./DynamicProperty').PlaceKey} */
  static _getCurrentKey() {
    return `registry:place${this._currentKeyIndex}`;
  }

  /**
   * @param {Vector3} location
   * @returns {boolean}
   */
  static has(location) {
    const locations = this.get();
    return locations.some(loc => (
      location.x === loc.x &&
      location.y === loc.y &&
      location.z === loc.z
    ));
  }

  static reset() {
    const keys = world.getDynamicPropertyIds();
    for (const key of keys) {
      if (key.startsWith('registry:place')) world.setDynamicProperty(key);
    }
    this._currentKeyIndex = 0;
  }
}



  const {player, block: blocks__} = ev;
  const {x, y, z} = blocks__;
  if (!Permissions.has(player, 'admin') && !player.hasTag("destroy") ||  Permissions.has(player, 'admin') && player.hasTag("gameplayer1") || Permissions.has(ev.player, 'admin') && ev.player.hasTag("destroy")) {
    const blocks = db.get('blockplace', 'block')
    const place = (blocks == undefined) ? [] : JSON.parse(blocks);
    if (subdb == false) {
     if (place != undefined) {
       if (place.some(element => {return element.x == x && element.y == y && element.z == z}) == false) {
        place.push({x:x, y:y, z:z})
       }
     }
     try {
      db.set('blockplace', 'block', JSON.stringify(place));
     } catch (e) {
      if (e instanceof RangeError) subdb = true;
      else sendMessage(player, `§cエラーが発生しました。以下のコードを管理者にお知らせください。\n${e}`)
     }
    }
    if (subdb == true) {
      const block2 = db.get('blockplace', 'block2')
      const place2 = block2 == undefined ? [] : JSON.parse(block2)
      if (place != undefined) {
        if (place.some(element => {return element.x == x && element.y == y && element.z == z}) == true) return
      }
      if (place2 != undefined) {
        if (place2.some(element => {return element.x == x && element.y == y && element.z == z}) == true) return
      }
      place2.push({x:x, y:y, z:z})
      system.runTimeout(() => {
        try {
         db.set('blockplace', 'block2', JSON.stringify(place2));
        } catch (e) {
         if (e instanceof RangeError) {
          blocks__.setType("minecraft:air")
          sendMessage(player, `§cこれ以上ブロックを置くことはできません！`)
          playSound(player, 'note.bass')
         }
         else sendMessage(player, `§cエラーが発生しました。以下のコードを管理者にお知らせください。\n${e}`)
        }
      }, 0)
    }
  }
  else sendMessage(ev.player, `§cブロック情報の収集が無効化されています`)
});


system.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (id === "bw:map_RESET") {
    db.set('winner', 'first', '')
    db.set('winner', 'second', '')
    db.set('winner', 'third', '')
    db.set('winner', 'fourth', '')
    redout = false;
    blueout = false;
    yellowout = false;
    limeout = false;

    subdb = false;
    const locations = JSON.parse(db.get('blockplace', 'block') ?? '[]');
    const locations2 = JSON.parse(db.get('blockplace', 'block2') ?? '[]');
    if (locations.length === 0 && locations2.length === 0) return;
    
    /** @type {import('@minecraft/server').Vector3[]} */
    const resetQueue = [ ...locations, ...locations2 ];
    const intervalId = system.runInterval(() => {
      if (resetQueue.length === 0) {
        system.clearRun(intervalId);
        db.delete('blockplace', 'block');
        db.delete('blockplace', 'block2');
        setScore('cleaning', 'game', 0)
        return;
      }

      const location = resetQueue.shift();
      const block = dimension.getBlock(location);
      if (!block) return;
      if (block.type.canBeWaterlogged) block.isWaterlogged = false;
      block.setType("minecraft:sponge");
      block.setType("minecraft:air");
      setScore('cleaning', 'game', resetQueue.length/10)
    }, 2);
  }
});