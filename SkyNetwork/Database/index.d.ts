import { JaylyDB } from "./JaylyDB";
interface DatabaseTypes {
    "friends": string;
    "sentRequests": string;
    "gotRequests": string;
    "maxFriends": number;
}
export declare class SkyDB {
    databases: Record<string, JaylyDB>;
    constructor();
    get<K extends keyof DatabaseTypes>(tableName: K, key: string): DatabaseTypes[K];
    get(tableName: string, key: string): string | number | boolean | undefined;
    set<K extends keyof DatabaseTypes>(tableName: K, key: string, value: DatabaseTypes[K]): void;
    set(tableName: string, key: string, value: string | number | boolean): void;
    delete(tableName: string, key: string): boolean;
    reset(tableName: string): void;
    keys(tableName: string): any;
    entries(tableName: string): any;
    getTable(tableName: string): JaylyDB;
    createTable(tableName: string): JaylyDB;
}
declare const db: SkyDB;
export { db };
