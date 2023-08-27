/**
 * Scoreboard Database
 * @author tutinoko2048
 * Simple database system using scoreboard. Do not edit objective from outside this class!
 * This database is based on JaylyDB, thanks.
 */

import { world, system, type ScoreboardObjective, ScoreboardIdentityType, ScoreboardIdentity } from '@minecraft/server';

interface CacheData {
  identity: ScoreboardIdentity,
  value: string | number | boolean;
}

function parseData(displayName: string): Record<string, string | number | boolean> {
  return JSON.parse(`{${displayName}}`);
}

function stringifyData(data: Record<string, string | number | boolean>): string {
  return JSON.stringify(data).slice(1, -1);
}

export class ScoreDB implements Map<string, string | number | boolean> {
  private readonly cache = new Map<string, CacheData>()
  private readonly objective: ScoreboardObjective;

  fetchData(): void {
    this.cache.clear();
    for (const participant of this.objective.getParticipants()) {
      if (participant.type !== ScoreboardIdentityType.FakePlayer) continue;
      const data = parseData(participant.displayName);
      const key = Object.keys(data)[0];
      const value = data[key];
      this.cache.set(key, {
        identity: participant,
        value
      });
    }
  }

  constructor(id: string) {
    const objectiveId = 'scoredb' + id;
    this.objective = world.scoreboard.getObjective(objectiveId) ?? world.scoreboard.addObjective(objectiveId, objectiveId);

    this.fetchData();
  }

  get objectiveId(): string {
    return this.objective.id;
  }

  get size(): number {
    return this.cache.size;
  }

  get(key: string): string | number | boolean | undefined {
    if (!this.cache.has(key)) this.fetchData();
    return this.cache.get(key)?.value;
  }

  set (key: string, value: string | number | boolean): this {
    if (typeof key !== 'string') throw new TypeError('ScoreDB::set only accepts a key of string.');
    if (!['string', 'number', 'boolean'].includes(typeof value))
      throw new TypeError('ScoreDB::set only accepts a value of string, number, or boolean.');
    
    if (this.cache.get(key)?.value === value) return this;

    const stringified = stringifyData({ [key]: value });
    if (stringified.length > 32767)
      throw new RangeError('ScoreDB::set only accepts a string value less than 32767 characters.');
    
    const cacheData = this.cache.get(key);
    if (cacheData) this.objective.removeParticipant(cacheData.identity);
    this.objective.setScore(stringified, 0);
    this.cache.set(key, {
      identity: this.objective.getParticipants().find(participant => participant.displayName === stringified),
      value
    });

    return this;
  }

  delete(key: string): boolean {
    const cacheData = this.cache.get(key);
    if (!cacheData) return false;
    const result = this.objective.removeParticipant(cacheData.identity);
    this.cache.delete(key);
    return result;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.forEach(data => this.objective.removeParticipant(data.identity));
    this.cache.clear();
  }

  *entries(): IterableIterator<[string, string | number | boolean]> {
    for (const [key, cacheData] of this.cache.entries()) yield [key, cacheData.value];
  }

  *keys(): IterableIterator<string> {
    for (const [key] of this.entries()) yield key;
  }

  *values(): IterableIterator<string | number | boolean> {
    for (const [_, value] of this.entries()) yield value;
  }

  forEach(callbackFn: (value: string | number | boolean, key: string, db: this) => void): void {
    for (const [key, value] of this.entries()) callbackFn(value, key, this);
  }

  [Symbol.iterator](): IterableIterator<[string, string | number | boolean]> {
    return this.entries();
  }

  [Symbol.toStringTag]: string = ScoreDB.name;
}