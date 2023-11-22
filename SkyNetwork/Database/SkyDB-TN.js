import { ScoreDB } from "./lib/ScoreDB";
export class SkyDB {
    constructor() {
        this.databases = {};
    }
    reload() {
        for (const db of Object.values(this.databases)) {
            db.fetchData();
        }
    }
    get(tableName, key) {
        return this.getTable(tableName).get(key);
    }
    set(tableName, key, value) {
        this.getTable(tableName).set(key, value);
    }
    delete(tableName, key) {
        return this.getTable(tableName).delete(key);
    }
    clear(tableName) {
        this.getTable(tableName).clear();
    }
    /** @deprecated Use SkyDB::clear instead. */
    reset(tableName) {
        this.clear(tableName);
        console.warn('SkyDB::reset has been deprecated. Use SkyDB::clear instead.');
    }
    has(tableName, key) {
        return this.getTable(tableName).has(key);
    }
    *keys(tableName) {
        for (const key of this.getTable(tableName).keys())
            yield key;
    }
    *entries(tableName) {
        for (const [key, value] of this.getTable(tableName).entries())
            yield [key, value];
    }
    *values(tableName) {
        for (const [_, value] of this.entries(tableName))
            yield value;
    }
    getTable(tableName) {
        return this.databases[tableName] ?? this.createTable(tableName);
    }
    createTable(tableName) {
        this.databases[tableName] = new ScoreDB(tableName);
        return this.databases[tableName];
    }
}
const db = new SkyDB();
export { db };