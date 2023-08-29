/**
 * Scoreboard Database
 * @author tutinoko2048
 * Simple database system using scoreboard. Do not edit objective from outside this class!
 * This database is based on JaylyDB, thanks.
 */
var _a;
import { world, ScoreboardIdentityType } from '@minecraft/server';
function parseData(displayName) {
    return JSON.parse(`{${displayName}}`);
}
function stringifyData(data) {
    return JSON.stringify(data).slice(1, -1);
}
export class ScoreDB {
    fetchData() {
        this.cache.clear();
        for (const participant of this.objective.getParticipants()) {
            if (participant.type !== ScoreboardIdentityType.FakePlayer)
                continue;
            const data = parseData(participant.displayName);
            const key = Object.keys(data)[0];
            const value = data[key];
            this.cache.set(key, {
                identity: participant,
                value
            });
        }
    }
    constructor(id) {
        this.cache = new Map();
        this[_a] = ScoreDB.name;
        const objectiveId = 'scoredb' + id;
        this.objective = world.scoreboard.getObjective(objectiveId) ?? world.scoreboard.addObjective(objectiveId, objectiveId);
        this.fetchData();
    }
    get objectiveId() {
        return this.objective.id;
    }
    get size() {
        return this.cache.size;
    }
    get(key) {
        if (!this.cache.has(key))
            this.fetchData();
        return this.cache.get(key)?.value;
    }
    set(key, value) {
        if (typeof key !== 'string')
            throw new TypeError('ScoreDB::set only accepts a key of string.');
        if (!['string', 'number', 'boolean'].includes(typeof value))
            throw new TypeError('ScoreDB::set only accepts a value of string, number, or boolean.');
        if (this.cache.get(key)?.value === value)
            return this;
        const stringified = stringifyData({ [key]: value });
        if (stringified.length > 32767)
            throw new RangeError('ScoreDB::set only accepts a string value less than 32767 characters.');
        const cacheData = this.cache.get(key);
        if (cacheData)
            this.objective.removeParticipant(cacheData.identity);
        this.objective.setScore(stringified, 0);
        this.cache.set(key, {
            identity: this.objective.getParticipants().find(participant => participant.displayName === stringified),
            value
        });
        return this;
    }
    delete(key) {
        const cacheData = this.cache.get(key);
        if (!cacheData)
            return false;
        const result = this.objective.removeParticipant(cacheData.identity);
        this.cache.delete(key);
        return result;
    }
    has(key) {
        return this.cache.has(key);
    }
    clear() {
        this.cache.forEach(data => this.objective.removeParticipant(data.identity));
        this.cache.clear();
    }
    *entries() {
        for (const [key, cacheData] of this.cache.entries())
            yield [key, cacheData.value];
    }
    *keys() {
        for (const [key] of this.entries())
            yield key;
    }
    *values() {
        for (const [_, value] of this.entries())
            yield value;
    }
    forEach(callbackFn) {
        for (const [key, value] of this.entries())
            callbackFn(value, key, this);
    }
    [Symbol.iterator]() {
        return this.entries();
    }
}
_a = Symbol.toStringTag;
