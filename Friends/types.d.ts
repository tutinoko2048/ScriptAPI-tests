import { TABLES } from './FriendManager';

interface DatabaseTypes {
  [TABLES.sentRequests]: string[];
  [TABLES.gotRequests]: string[];
  [TABLES.friends]: string[];
  [TABLES.maxFriends]: number;
}