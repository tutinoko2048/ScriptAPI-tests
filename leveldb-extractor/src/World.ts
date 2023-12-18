import { LevelDB } from 'leveldb-zlib';
import * as nbt from 'prismarine-nbt';

export class LevelDBWrapper {
  public levelDB: LevelDB;
  constructor(public worldPath: string) {
    this.levelDB = new LevelDB(worldPath)
  }

  async get(key: string | Buffer): Promise<nbt.NBT | undefined> {
    if (!key) throw Error('key is undefined');
    const rawData = await this.levelDB.get(key);
    const { parsed } = await nbt.parse(rawData);
    return parsed;
  }

  async getAllKeys(): Promise<string[]> {
    const keys = [];
    const iterator = this.levelDB.getIterator({ keyAsBuffer: false });
    for await (const [key] of iterator) keys.push(key);
    return keys;
  }
}

interface PlayerRawData {
  data: nbt.NBT;
  info: nbt.NBT;
}

export class World {
  public db: LevelDBWrapper;

  constructor(worldPath: string) {
    this.db = new LevelDBWrapper(worldPath);
  }

  async getPlayers() {
    const keys = await this.db.getAllKeys();
    const playerInfoKeys = keys.filter(k => k.startsWith('player') && !k.includes('server'));

    const getPlayerData = async (key: string) => {
      return (await this.db.get(key))?.value;
    }


    const promises: Promise<PlayerRawData> = playerInfoKeys.map(async infoKey => {
      const info = await this.db.get(infoKey);
      if (!info) return;
      return {
        data: 
        info: info.value
      };
    });
      
    const playersData = (await Promise.all(promises))
  }
}