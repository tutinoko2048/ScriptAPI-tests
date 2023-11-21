import { JaylyDB } from "./lib/JaylyDB";
import { DatabaseTypes } from "./DatabaseTypes";

export class SkyDB_old {
  public readonly databases: Record<string, JaylyDB>
  constructor() {
    this.databases = {}
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

  reset(tableName: string): void {
    this.getTable(tableName).clear();
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

  getTable(tableName: string): JaylyDB {
    return this.databases[tableName] ?? this.createTable(tableName);
  }

  createTable(tableName: string): JaylyDB {
    this.databases[tableName] = new JaylyDB(tableName, false);
    return this.databases[tableName];
  }
}

const db = new SkyDB_old();

export { db }