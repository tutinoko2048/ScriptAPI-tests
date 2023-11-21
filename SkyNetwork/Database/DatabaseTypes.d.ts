export interface DatabaseTypes {
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

  /** [userId]: boolean */
  "rankingExcludes": boolean;
}