import { world } from '@minecraft/server';

/** @typedef {import('@minecraft/server').Vector3} Vector3 */
/** @typedef {import('./DynamicProperty').PlaceKey} PlaceKey */

const PROPERTY_MAX_SIZE = 20000;
const PREFIX = 'registry:place';

export class BlockPlaceRegistry {
  static _currentKeyIndex = 0;

  /** @type {Vector3[][]} */
  static _cache = [];

  static _cacheLoaded = false;

  /** @returns {Vector3[]} */
  static get() {
    if (!this._cacheLoaded) this._load();

    /** @type {Vector3[]} */
    const result = [];

    for (const value of this._cache) result.push(...value);
    return result;
  }

  /** @param {Vector3} location */
  static put(location) { this.putMany(location) }

  /** @param {Vector3[]} locations */
  static putMany(...locations) {
    /** @type {Vector3[]} */
    let blocks;
    if (this._cacheLoaded) {
      blocks = this._cache[this._currentKeyIndex];
    } else {
      blocks = JSON.parse(world.getDynamicProperty(this._getCurrentKey()) ?? '[]');
    }
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
        this._cache[this._currentKeyIndex] = values;
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
    return `${PREFIX}${this._currentKeyIndex}`;
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
      if (key.startsWith(PREFIX)) world.setDynamicProperty(key);
    }
    this._currentKeyIndex = 0;
    this._cache.length = 0;
  }

  static _load() {
    const keys = world.getDynamicPropertyIds();
    for (const key of keys) {
      if (!key.startsWith(PREFIX)) continue;
      const index = Number(key.slice(PREFIX.length));
      if (Number.isNaN(index)) throw Error(`wrong key: ${key}`);
      this._cache[index] = JSON.parse(
        world.getDynamicProperty(/** @type {PlaceKey} */ (key)) ?? '[]'
      );
    }
    this._cacheLoaded = true;
  }
}
