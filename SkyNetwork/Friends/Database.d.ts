import { Vector3, Block, Container, ItemStack } from '@minecraft/server';
import { TABLES } from './FriendManager';

export interface DatabaseTypes {
  [TABLES.friends]: string[];
  [TABLES.sentRequests]: string[];
  [TABLES.gotRequests]: string[];
  [TABLES.maxFriends]: number;
  score: number;
}

interface DatabaseItem {
  item?: ItemStack;
  slot: number;
}

declare class Database {
  constructor(blockLocation: Vector3);
  public block: Block;
  public cache: any;

  public get chest(): Block;

  public get<T extends keyof DatabaseTypes>(tableName: T, key: string): DatabaseTypes[T];
  public get(tableName: string, key: string): any;

  public set<T extends keyof DatabaseTypes>(tableName: T, key: string, value: DatabaseTypes[T]): void;
  public set(tableName: string, key: string, value: any): void;

  public delete(tableName: string, key: string): void;
  public reset(tableName: string): void;
  public keys(tableName: string): string[];
  public getTable(tableName: string): any;
  public setTable(tableName: string, data: any);
  public getTableItem(tableName: string, container: Container): DatabaseItem;
  public createItem(tableName: string): ItemStack;
  public fetchTable(): void;
}
