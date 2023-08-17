import { JaylyDB } from "./JaylyDB";
import { DatabaseTypes } from "./DatabaseTypes";
export declare class SkyDB {
    readonly databases: Record<string, JaylyDB>;
    constructor();
    get<K extends keyof DatabaseTypes>(tableName: K, key: string): DatabaseTypes[K];
    get(tableName: string, key: string): string | number | boolean | undefined;
    set<K extends keyof DatabaseTypes>(tableName: K, key: string, value: DatabaseTypes[K]): void;
    set(tableName: string, key: string, value: string | number | boolean): void;
    delete(tableName: string, key: string): boolean;
    reset(tableName: string): void;
    keys(tableName: string): Generator<string>;
    entries<K extends keyof DatabaseTypes>(tableName: K): Generator<[string, DatabaseTypes[K]]>;
    entries(tableName: string): Generator<[string, string | number | boolean]>;
    values<K extends keyof DatabaseTypes>(tableName: K): Generator<DatabaseTypes[K]>;
    values(tableName: string): Generator<string | number | boolean>;
    getTable(tableName: string): JaylyDB;
    createTable(tableName: string): JaylyDB;
}
declare const db: SkyDB;
export { db };
