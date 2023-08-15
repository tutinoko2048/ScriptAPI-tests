import { JaylyDB } from "./JaylyDB";

interface DatabaseTypes {
  /** [userId]: [userName] */
  "users": string;
  /** [userId]: JSON化したIDの配列 */
  "friends": string;
  /** [userId]: JSON化したIDの配列 */
  "sentRequests": string;
  /** [userId]: JSON化したIDの配列 */
  "gotRequests": string;
  /** [userId]: number */
  "maxFriends": number;
}

export class SkyDB {
  public readonly databases: Record<string, JaylyDB>
  constructor() {
    this.databases = {}
  }

  get<K extends keyof DatabaseTypes>(tableName: K, key: string): DatabaseTypes[K];
  get(tableName: string, key: string): string | number | boolean | undefined;
  get(tableName: string, key: string): string | number | boolean | undefined {
    if (!(tableName in this.databases)) return undefined;
    return this.getTable(tableName).get(key);
  }

  set<K extends keyof DatabaseTypes>(tableName: K, key: string, value: DatabaseTypes[K]): void;
  set(tableName: string, key: string, value: string | number | boolean): void;
  set(tableName: string, key: string, value: string | number | boolean): void {
    this.getTable(tableName).set(key, value);
  }

  delete(tableName: string, key: string): boolean {
    if (!(tableName in this.databases)) return false;
    return this.getTable(tableName).delete(key);
  }

  reset(tableName: string): void {
    if (!(tableName in this.databases)) return;
    this.getTable(tableName).clear();
  }

  keys(tableName: string): Iterable<string> {
    if (!(tableName in this.databases)) return [];
    return this.getTable(tableName).keys();
  }

  entries<K extends keyof DatabaseTypes>(tableName: K): Iterable<[string, DatabaseTypes[K]]>
  entries(tableName: string): Iterable<[string, string | number | boolean]>
  entries(tableName: string): Iterable<[string, string | number | boolean]> {
    if (!(tableName in this.databases)) return [];
    return this.getTable(tableName).entries();
  }

  getTable(tableName: string): JaylyDB {
    return this.databases[tableName] ?? this.createTable(tableName);
  }

  createTable(tableName: string): JaylyDB {
    this.databases[tableName] = new JaylyDB(tableName, false);
    return this.databases[tableName];
  }
}

const db = new SkyDB();

export { db }