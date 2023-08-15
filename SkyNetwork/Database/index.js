import { JaylyDB } from "./JaylyDB";
export class SkyDB {
    constructor() {
        this.databases = {};
    }
    get(tableName, key) {
        if (!(tableName in this.databases))
            return undefined;
        return this.getTable(tableName).get(key);
    }
    set(tableName, key, value) {
        this.getTable(tableName).set(key, value);
    }
    delete(tableName, key) {
        if (!(tableName in this.databases))
            return false;
        return this.getTable(tableName).delete(key);
    }
    reset(tableName) {
        if (!(tableName in this.databases))
            return;
        this.getTable(tableName).clear();
    }
    keys(tableName) {
        if (!(tableName in this.databases))
            return [];
        return this.getTable(tableName).keys();
    }
    entries(tableName) {
        if (!(tableName in this.databases))
            return [];
        return this.getTable(tableName).entries();
    }
    getTable(tableName) {
        return this.databases[tableName] ?? this.createTable(tableName);
    }
    createTable(tableName) {
        this.databases[tableName] = new JaylyDB(tableName, false);
        return this.databases[tableName];
    }
}
const db = new SkyDB();
export { db };
