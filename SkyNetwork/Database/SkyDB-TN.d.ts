import { ScoreDB } from "./lib/ScoreDB";
import { DatabaseTypes } from "./DatabaseTypes";
export declare class SkyDB {
    readonly databases: Record<string, ScoreDB>;
    constructor();
    reload(): void;
    get<K extends keyof DatabaseTypes>(tableName: K, key: string): DatabaseTypes[K];
    get(tableName: string, key: string): string | number | boolean | undefined;
    set<K extends keyof DatabaseTypes>(tableName: K, key: string, value: DatabaseTypes[K]): void;
    set(tableName: string, key: string, value: string | number | boolean): void;
    delete(tableName: string, key: string): boolean;
    clear(tableName: string): void;
    /** @deprecated Use SkyDB::clear instead. */
    reset(tableName: string): void;
    has(tableName: string, key: string): boolean;
    keys(tableName: string): IterableIterator<string>;
    entries<K extends keyof DatabaseTypes>(tableName: K): IterableIterator<[string, DatabaseTypes[K]]>;
    entries(tableName: string): IterableIterator<[string, string | number | boolean]>;
    values<K extends keyof DatabaseTypes>(tableName: K): IterableIterator<DatabaseTypes[K]>;
    values(tableName: string): IterableIterator<string | number | boolean>;
    getTable(tableName: string): ScoreDB;
    private createTable;
}
declare const db: SkyDB;
export { db };
