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
export declare class SkyDB {
    readonly databases: Record<string, JaylyDB>;
    constructor();
    get<K extends keyof DatabaseTypes>(tableName: K, key: string): DatabaseTypes[K];
    get(tableName: string, key: string): string | number | boolean | undefined;
    set<K extends keyof DatabaseTypes>(tableName: K, key: string, value: DatabaseTypes[K]): void;
    set(tableName: string, key: string, value: string | number | boolean): void;
    delete(tableName: string, key: string): boolean;
    reset(tableName: string): void;
    keys(tableName: string): Iterable<string>;
    entries<K extends keyof DatabaseTypes>(tableName: K): Iterable<[string, DatabaseTypes[K]]>;
    entries(tableName: string): Iterable<[string, string | number | boolean]>;
    getTable(tableName: string): JaylyDB;
    createTable(tableName: string): JaylyDB;
}
declare const db: SkyDB;
export { db };
