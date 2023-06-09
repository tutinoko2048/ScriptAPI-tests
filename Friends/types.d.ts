import { TABLES } from './FriendManager';

declare module '@minecraft/server' {
  interface Player {
    isRegistered: boolean;
  }
}

export type UserList = Record<string, string>

export interface Response {
  error: boolean;
  message?: string;
}

export interface FetchResponse extends Response {
  got?: User[];
  sent?: User[];
}

export interface SendResponse extends Response {
  targetId?: string;
}

export interface FriendsResponse extends Response {
  data?: User[];
}

export interface User {
  /** The id of the player, <Player>.id */
  id: string;
  /** The name of the player, <Player>.name */
  name: string;
  /** Whether this user is online or not */
  online?: boolean;
}

export interface DatabaseTypes {
  [TABLES.sentRequests]: string[];
  [TABLES.gotRequests]: string[];
  [TABLES.friends]: string[];
  [TABLES.maxFriends]: number;
}
