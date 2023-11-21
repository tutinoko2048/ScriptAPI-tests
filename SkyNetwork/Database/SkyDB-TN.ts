import { ScoreDB } from "./lib/ScoreDB";
import { DatabaseTypes } from "./DatabaseTypes";

export class SkyDB {
  readonly databases: Record<string, ScoreDB>

  constructor() {
    this.databases = {}
  }

  reload(): void {
    for (const db of Object.values(this.databases)) {
      db.fetchData();
    }
  }

  get<K extends keyof DatabaseTypes>(tableName: K, key: string): DatabaseTypes[K];
  get(tableName: string, key: string): string | number | boolean | undefined;
  get(tableName: string, key: string): string | number | boolean | undefined {
    return this.getTable(tableName).get(key);
  }

  set<K extends keyof DatabaseTypes>(tableName: K, key: string, value: DatabaseTypes[K]): void;
  set(tableName: string, key: string, value: string | number | boolean): void;
  set(tableName: string, key: string, value: string | number | boolean): void {
    this.getTable(tableName).set(key, value);
  }

  delete(tableName: string, key: string): boolean {
    return this.getTable(tableName).delete(key);
  }

  clear(tableName: string): void {
    this.getTable(tableName).clear();
  }

  /** @deprecated Use SkyDB::clear instead. */
  reset(tableName: string): void {
    this.clear(tableName);
    console.warn('SkyDB::reset has been deprecated. Use SkyDB::clear instead.');
  }

  has(tableName: string, key: string): boolean {
    return this.getTable(tableName).has(key);
  }

  *keys(tableName: string): IterableIterator<string> {
    for (const key of this.getTable(tableName).keys())
      yield key;
  }

  entries<K extends keyof DatabaseTypes>(tableName: K): IterableIterator<[string, DatabaseTypes[K]]>
  entries(tableName: string): IterableIterator<[string, string | number | boolean]>
  *entries(tableName: string): IterableIterator<[string, string | number | boolean]> {
    for (const [key, value] of this.getTable(tableName).entries())
      yield [key, value];
  }

  values<K extends keyof DatabaseTypes>(tableName: K): IterableIterator<DatabaseTypes[K]>
  values(tableName: string): IterableIterator<string | number | boolean>
  *values(tableName: string): IterableIterator<string | number | boolean> {
    for (const [_, value] of this.entries(tableName)) 
      yield value;
  }

  getTable(tableName: string): ScoreDB {
    return this.databases[tableName] ?? this.createTable(tableName);
  }

  private createTable(tableName: string): ScoreDB {
    this.databases[tableName] = new ScoreDB(tableName);
    return this.databases[tableName];
  }
}

const db = new SkyDB();

export { db }