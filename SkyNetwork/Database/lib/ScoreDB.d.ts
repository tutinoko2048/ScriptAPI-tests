/**
 * Scoreboard Database
 * @author tutinoko2048
 * Simple database system using scoreboard. Do not edit objective from outside this class!
 * This database is based on JaylyDB, thanks.
 */
export declare class ScoreDB implements Map<string, string | number | boolean> {
    private readonly cache;
    private readonly objective;
    fetchData(): void;
    constructor(id: string);
    get objectiveId(): string;
    get size(): number;
    get(key: string): string | number | boolean | undefined;
    set(key: string, value: string | number | boolean): this;
    delete(key: string): boolean;
    has(key: string): boolean;
    clear(): void;
    entries(): IterableIterator<[string, string | number | boolean]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<string | number | boolean>;
    forEach(callbackFn: (value: string | number | boolean, key: string, db: this) => void): void;
    [Symbol.iterator](): IterableIterator<[string, string | number | boolean]>;
    [Symbol.toStringTag]: string;
}
